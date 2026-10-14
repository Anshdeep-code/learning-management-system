import mongoose from "mongoose";
import { CourseProgress } from "../models/courseProgress.js";
import { Course } from "../models/course.model.js";
import { hasCourseAccess } from "../utils/courseAccess.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";

/** Course must exist and the user must be enrolled (or be its instructor / admin). */
const loadAccessibleCourse = async (courseId, user) => {
  if (!mongoose.isValidObjectId(courseId)) throw new AppError("Invalid course ID", 400);
  const course = await Course.findById(courseId).select("lectures enrolledStudents instructor");
  if (!course) throw new AppError("Course not found", 404);
  if (!hasCourseAccess(course, user)) {
    throw new AppError("You are not enrolled in this course", 403);
  }
  return course;
};

/**
 * Get (or lazily create) the progress document and keep it in sync with the course's lectures.
 * The model computes completionPercentage as completed / lectureProgress.length, so every lecture
 * of the course must have an entry - otherwise 1 watched lecture out of 10 would show 100%.
 */
const syncProgress = async (userId, course) => {
  let progress = await CourseProgress.findOne({ user: userId, course: course._id });
  if (!progress) {
    progress = new CourseProgress({ user: userId, course: course._id, lectureProgress: [] });
  }

  const current = new Set(course.lectures.map(String));
  const known = new Set(progress.lectureProgress.map((lp) => String(lp.lecture)));
  let changed = progress.isNew;

  // lectures added after the student started
  for (const id of course.lectures) {
    if (!known.has(String(id))) {
      progress.lectureProgress.push({ lecture: id });
      changed = true;
    }
  }
  // lectures that were deleted from the course
  const kept = progress.lectureProgress.filter((lp) => current.has(String(lp.lecture)));
  if (kept.length !== progress.lectureProgress.length) {
    progress.lectureProgress = kept;
    changed = true;
  }

  if (changed) await progress.save();
  return progress;
};

/**
 * Get user's progress for a specific course
 * @route GET /api/v1/progress/:courseId
 */
export const getUserCourseProgress = catchAsync(async (req, res) => {
  const course = await loadAccessibleCourse(req.params.courseId, req.user);
  const progress = await syncProgress(req.user._id, course);

  await progress.populate("lectureProgress.lecture", "title duration order isPreview");

  res.status(200).json({ success: true, data: { progress } });
});

/**
 * Update progress for a specific lecture
 * @route PATCH /api/v1/progress/:courseId/lectures/:lectureId
 */
export const updateLectureProgress = catchAsync(async (req, res) => {
  const { courseId, lectureId } = req.params;
  const course = await loadAccessibleCourse(courseId, req.user);

  if (!course.lectures.some((id) => String(id) === lectureId)) {
    throw new AppError("Lecture does not belong to this course", 404);
  }

  const progress = await syncProgress(req.user._id, course);
  const entry = progress.lectureProgress.find((lp) => String(lp.lecture) === lectureId);

  const { isCompleted, watchTime } = req.body;
  if (isCompleted !== undefined) {
    entry.isCompleted = isCompleted === true || String(isCompleted).toLowerCase() === "true";
  }
  if (watchTime !== undefined) {
    const seconds = Number(watchTime);
    if (Number.isNaN(seconds) || seconds < 0) throw new AppError("watchTime must be a non-negative number", 400);
    entry.watchTime = seconds;
  }
  entry.lastWatched = new Date();
  progress.lastAccessed = new Date();

  await progress.save(); // pre-save hook recalculates completionPercentage / isCompleted

  res.status(200).json({ success: true, message: "Progress updated", data: { progress } });
});

/**
 * Mark entire course as completed
 * @route PATCH /api/v1/progress/:courseId/complete
 */
export const markCourseAsCompleted = catchAsync(async (req, res) => {
  const course = await loadAccessibleCourse(req.params.courseId, req.user);
  const progress = await syncProgress(req.user._id, course);

  progress.lectureProgress.forEach((lp) => {
    lp.isCompleted = true;
    lp.lastWatched = new Date();
  });
  // pre-save only recalculates when there is at least one lecture, so set it for the empty case too
  progress.isCompleted = true;
  progress.completionPercentage = 100;
  progress.lastAccessed = new Date();

  await progress.save();

  res.status(200).json({ success: true, message: "Course marked as completed", data: { progress } });
});

/**
 * Reset course progress
 * @route PATCH /api/v1/progress/:courseId/reset
 */
export const resetCourseProgress = catchAsync(async (req, res) => {
  const course = await loadAccessibleCourse(req.params.courseId, req.user);
  const progress = await syncProgress(req.user._id, course);

  progress.lectureProgress.forEach((lp) => {
    lp.isCompleted = false;
    lp.watchTime = 0;
  });
  progress.isCompleted = false;
  progress.completionPercentage = 0;
  progress.lastAccessed = new Date();

  await progress.save();

  res.status(200).json({ success: true, message: "Course progress reset", data: { progress } });
});
