import Stripe from "stripe";
import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Lecture } from "../models/lecture.model.js";
import { User } from "../models/user.model.js";
import {
  enrollUserInCourse,
  hasCourseAccess,
  shapeCourse,
} from "../utils/courseAccess.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const CURRENCY = (process.env.CURRENCY || "INR").toUpperCase();
const CLIENT_URL = () => process.env.CLIENT_URL || "http://localhost:5173";

/**
 * Create a Stripe checkout session for course purchase
 * @route POST /api/v1/payments/create-checkout-session
 */
export const initiateStripeCheckout = catchAsync(async (req, res) => {
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

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: CURRENCY.toLowerCase(),
          product_data: { name: course.title, images: [course.thumbnail] },
          unit_amount: Math.round(course.price * 100), // Stripe uses the smallest currency unit
        },
        quantity: 1,
      },
    ],
    success_url: `${CLIENT_URL()}/course-progress/${course._id}`,
    cancel_url: `${CLIENT_URL()}/course-detail/${course._id}`,
    client_reference_id: String(req.user._id),
    metadata: { courseId: String(course._id), userId: String(req.user._id) },
  });

  // pending until the webhook confirms payment
  await CoursePurchase.create({
    course: course._id,
    user: req.user._id,
    amount: course.price,
    currency: CURRENCY,
    status: "pending",
    paymentMethod: "stripe",
    paymentId: session.id,
  });

  res
    .status(200)
    .json({ success: true, url: session.url, sessionId: session.id });
});

const fulfillCheckout = async (session) => {
  if (session.payment_status && session.payment_status !== "paid") return; // e.g. async method still pending

  const purchase = await CoursePurchase.findOne({ paymentId: session.id });
  if (!purchase) {
    console.error(
      `Stripe webhook: no purchase found for session ${session.id}`,
    );
    return;
  }
  if (purchase.status === "completed") return; // Stripe retries webhooks - stay idempotent

  purchase.status = "completed";
  if (session.amount_total) purchase.amount = session.amount_total / 100;
  purchase.metadata = { paymentIntent: String(session.payment_intent || "") };
  await purchase.save();

  await enrollUserInCourse(purchase.user, purchase.course);
};

const failCheckout = async (session) => {
  await CoursePurchase.updateOne(
    { paymentId: session.id, status: "pending" },
    { status: "failed" },
  );
};

/**
 * Handle Stripe webhook events
 * @route POST /api/v1/payments/webhook
 * NOTE: needs the RAW request body, so it is mounted in index.js BEFORE express.json().
 */
export const handleStripeWebhook = catchAsync(async (req, res) => {
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    // verifies the request really came from Stripe (HMAC of raw body + secret)
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
      await fulfillCheckout(event.data.object);
      break;
    case "checkout.session.expired":
    case "checkout.session.async_payment_failed":
      await failCheckout(event.data.object);
      break;
    default:
      break; // ignore events we don't care about
  }

  res.status(200).json({ received: true });
});

/**
 * Get course details with purchase status
 * @route GET /api/v1/payments/courses/:courseId/purchase-status
 */
export const getCoursePurchaseStatus = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  if (!mongoose.isValidObjectId(courseId))
    throw new AppError("Invalid course ID", 400);

  const course = await Course.findById(courseId)
    .populate("instructor", "name avatar bio")
    .populate({ path: "lectures", options: { sort: { order: 1 } } });
  if (!course) throw new AppError("Course not found", 404);

  const purchased =
    hasCourseAccess(course, req.user) ||
    !!(await CoursePurchase.exists({
      course: course._id,
      user: req.user._id,
      status: "completed",
    }));

  // locked lectures hide their video URL until the course is purchased
  res.status(200).json({
    success: true,
    course: shapeCourse(course, req.user),
    purchased,
  });
});

/**
 * Get all purchased courses
 * @route GET /api/v1/payments/purchased-courses
 */
export const getPurchasedCourses = catchAsync(async (req, res) => {
  const purchases = await CoursePurchase.find({
    user: req.user._id,
    status: "completed",
  })
    .populate({
      path: "course",
      select:
        "title subtitle thumbnail category level price totalLectures instructor",
      populate: { path: "instructor", select: "name avatar" },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: purchases.length,
    purchasedCourses: purchases.map((p) => ({
      purchaseId: p._id,
      purchasedAt: p.createdAt,
      amount: p.amount,
      currency: p.currency,
      course: p.course,
    })),
  });
});
