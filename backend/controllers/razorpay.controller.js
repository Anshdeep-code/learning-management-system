import Razorpay from "razorpay";
import crypto from "crypto";
import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { enrollUserInCourse } from "../utils/courseAccess.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

/**
 * Step 1 - create an order on Razorpay (amount is decided on the SERVER, never trusted from the client)
 * @route POST /api/v1/razorpay/create-order
 */
export const createRazorpayOrder = catchAsync(async (req, res) => {
  const { courseId } = req.body;
  if (!mongoose.isValidObjectId(courseId))
    throw new AppError("Valid courseId is required", 400);

  const course = await Course.findById(courseId);
  if (!course || !course.isPublished)
    throw new AppError("Course not found", 404);
  if (
    course.enrolledStudents.some((id) => String(id) === String(req.user._id))
  ) {
    throw new AppError("You are already enrolled in this course", 400);
  }
  if (!(course.price > 0))
    throw new AppError("This course is free and cannot be purchased", 400);

  const order = await razorpay.orders.create({
    amount: Math.round(course.price * 100), // paise
    currency: "INR",
    receipt: `c_${String(course._id).slice(-8)}_${Date.now()}`, // max 40 chars
    notes: { courseId: String(course._id), userId: String(req.user._id) },
  });

  await CoursePurchase.create({
    course: course._id,
    user: req.user._id,
    amount: course.price,
    currency: "INR",
    status: "pending",
    paymentMethod: "razorpay",
    paymentId: order.id, // razorpay order id, used to find this purchase at verification time
  });

  res.status(200).json({
    success: true,
    order,
    key: process.env.RAZORPAY_KEY_ID, // public key id - the frontend checkout widget needs it
    course: { id: course._id, title: course.title },
  });
});

/**
 * Step 2 - after the checkout popup succeeds, the frontend sends the 3 values Razorpay returned.
 * We recompute the signature with our secret; if it matches, the payment is genuine.
 * @route POST /api/v1/razorpay/verify-payment
 */
export const verifyPayment = catchAsync(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new AppError(
      "razorpay_order_id, razorpay_payment_id and razorpay_signature are required",
      400,
    );
  }

  const purchase = await CoursePurchase.findOne({
    paymentId: String(razorpay_order_id),
    user: req.user._id,
  });
  if (!purchase) throw new AppError("Order not found", 404);

  if (purchase.status === "completed") {
    return res
      .status(200)
      .json({ success: true, message: "Payment already verified" });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const given = Buffer.from(String(razorpay_signature));
  const wanted = Buffer.from(expected);
  const valid =
    given.length === wanted.length && crypto.timingSafeEqual(given, wanted);

  if (!valid) {
    purchase.status = "failed";
    await purchase.save();
    throw new AppError("Payment verification failed", 400);
  }

  purchase.status = "completed";
  purchase.metadata = { razorpayPaymentId: String(razorpay_payment_id) };
  await purchase.save();

  await enrollUserInCourse(purchase.user, purchase.course);

  res.status(200).json({
    success: true,
    message: "Payment verified. You are now enrolled in the course.",
    courseId: purchase.course,
  });
});
