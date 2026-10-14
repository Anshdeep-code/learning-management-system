import { User } from "../models/user.model.js";
import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.js";
import { generateToken } from "../utils/generateToken.js";
import { deleteMediaFromCloudinary, uploadMedia } from "../utils/cloudinary.js";
import { getPublicIdFromUrl, removeLocalFile } from "../utils/file.js";
import { sendEmail } from "../utils/sendEmail.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";
import crypto from "crypto";

const SIGNUP_ROLES = ["student", "instructor"]; // "admin" can never be self-assigned
const STRONG_PASSWORD = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/;

/** Never send the password hash or reset-token fields to the client. */
const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  return obj;
};

/**
 * Create a new user account
 * @route POST /api/v1/users/signup
 */
export const createUserAccount = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email: String(email).toLowerCase() });
  if (existingUser) {
    throw new AppError("User already exists with this email", 409);
  }

  const user = await User.create({
    name,
    email,
    password, // hashed by the pre-save hook in user.model.js
    role: SIGNUP_ROLES.includes(role) ? role : "student",
  });

  return generateToken(res, sanitizeUser(user), "Account created successfully");
});

/**
 * Authenticate user and get token
 * @route POST /api/v1/users/signin
 */
export const authenticateUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // password is `select: false` in the schema, so ask for it explicitly
  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");

  // same message for "no user" and "wrong password" so attackers can't enumerate emails
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  await user.updateLastActive();
  return generateToken(res, sanitizeUser(user), `Welcome back, ${user.name}`);
});

/**
 * Sign out user and clear cookie
 * @route POST /api/v1/users/signout
 */
export const signOutUser = catchAsync(async (_, res) => {
  return res
    .status(200)
    .cookie("token", "", { httpOnly: true, sameSite: "strict", maxAge: 0 })
    .json({ success: true, message: "Signed out successfully" });
});

/**
 * Get current user profile
 * @route GET /api/v1/users/profile
 */
export const getCurrentUserProfile = catchAsync(async (req, res) => {
  const user = await User.findById(req.id)
    .populate({
      path: "enrolledCourses.course",
      select: "title subtitle thumbnail category level price totalLectures",
    })
    .populate("createdCourses", "title thumbnail isPublished price");

  if (!user) throw new AppError("User not found", 404);

  res.status(200).json({ success: true, user: sanitizeUser(user) });
});

/**
 * Update user profile
 * @route PATCH /api/v1/users/profile
 */
export const updateUserProfile = catchAsync(async (req, res) => {
  const { name, bio } = req.body;
  const user = req.user; // already loaded by isAuthenticated

  if (name !== undefined) user.name = String(name).trim();
  if (bio !== undefined) user.bio = String(bio);

  if (req.file) {
    try {
      const result = await uploadMedia(req.file.path);
      if (!result) throw new AppError("Failed to upload avatar", 502);

      const oldPublicId = getPublicIdFromUrl(user.avatar);
      user.avatar = result.secure_url;
      if (oldPublicId) await deleteMediaFromCloudinary(oldPublicId);
    } finally {
      await removeLocalFile(req.file.path); // multer's temp copy
    }
  }

  await user.save({ validateModifiedOnly: true });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: sanitizeUser(user),
  });
});

/**
 * Change user password
 * @route PATCH /api/v1/users/password
 */
export const changeUserPassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Current password is incorrect", 400);
  }

  user.password = newPassword; // re-hashed by the pre-save hook
  await user.save();

  return generateToken(res, sanitizeUser(user), "Password changed successfully");
});

/**
 * Request password reset
 * @route POST /api/v1/users/forgot-password
 */
export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new AppError("Email is required", 400);

  // identical response whether or not the account exists (prevents email enumeration)
  const genericResponse = {
    success: true,
    message: "If an account exists for that email, a reset link has been sent.",
  };

  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user) return res.status(200).json(genericResponse);

  // raw token goes in the email, only its SHA-256 hash is stored in the DB
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password reset request",
      text: `You requested a password reset. Open this link (valid for 10 minutes):\n\n${resetUrl}\n\nIf this wasn't you, ignore this email.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("Could not send the reset email. Please try again later.", 500);
  }

  res.status(200).json(genericResponse);
});

/**
 * Reset password
 * @route POST /api/v1/users/reset-password/:token
 */
export const resetPassword = catchAsync(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 8 || !STRONG_PASSWORD.test(password)) {
    throw new AppError(
      "Password must be at least 8 characters and include a number, an uppercase letter, a lowercase letter and a special character",
      400
    );
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(String(req.params.token))
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) throw new AppError("Reset token is invalid or has expired", 400);

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return generateToken(res, sanitizeUser(user), "Password reset successful");
});

/**
 * Delete user account
 * @route DELETE /api/v1/users/account
 */
export const deleteUserAccount = catchAsync(async (req, res) => {
  const user = req.user;

  if (user.createdCourses?.length > 0) {
    throw new AppError(
      "You still have courses you created. Delete or transfer them before deleting your account.",
      400
    );
  }

  const avatarId = getPublicIdFromUrl(user.avatar);
  if (avatarId) await deleteMediaFromCloudinary(avatarId);

  await Promise.all([
    CourseProgress.deleteMany({ user: user._id }),
    Course.updateMany({ enrolledStudents: user._id }, { $pull: { enrolledStudents: user._id } }),
  ]);
  await User.findByIdAndDelete(user._id);

  res
    .status(200)
    .cookie("token", "", { httpOnly: true, sameSite: "strict", maxAge: 0 })
    .json({ success: true, message: "Account deleted successfully" });
});
