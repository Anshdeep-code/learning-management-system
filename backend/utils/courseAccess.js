import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js";

const idOf = (v) => String(v?._id ?? v);

export const isCourseOwner = (course, user) =>
  idOf(course.instructor) === idOf(user._id);

/** Owner, admin or an enrolled student may see every lecture. */
export const hasCourseAccess = (course, user) =>
  user.role === "admin" ||
  isCourseOwner(course, user) ||
  (course.enrolledStudents || []).some((id) => idOf(id) === idOf(user._id));

/**
 * Plain object safe to send to the client.
 * - Users without access only get video URLs for preview lectures.
 * - Only the owner/admin can see the enrolled-student id list (others get a count).
 */
export const shapeCourse = (course, user) => {
  const obj = course.toObject ? course.toObject() : { ...course };
  const access = hasCourseAccess(course, user);
  const privileged = user.role === "admin" || isCourseOwner(course, user);

  if (!access && Array.isArray(obj.lectures)) {
    obj.lectures = obj.lectures.map((l) =>
      l?.title === undefined || l.isPreview
        ? l
        : {
            _id: l._id,
            title: l.title,
            duration: l.duration,
            order: l.order,
            isPreview: false,
          },
    );
  }
  obj.enrolledCount = (obj.enrolledStudents || []).length;
  if (!privileged) delete obj.enrolledStudents;
  return obj;
};

/** Add the user to the course and the course to the user (idempotent). */
export const enrollUserInCourse = async (userId, courseId) => {
  await Promise.all([
    Course.updateOne(
      { _id: courseId },
      { $addToSet: { enrolledStudents: userId } },
    ),
    User.updateOne(
      { _id: userId, "enrolledCourses.course": { $ne: courseId } },
      { $push: { enrolledCourses: { course: courseId } } },
    ),
  ]);
};
