import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { Lecture } from "../models/lecture.model.js";
import { User } from "../models/user.model.js";
import {
  deleteMediaFromCloudinary,
  deleteVideoFromCloudinary,
  uploadMedia,
} from "../utils/cloudinary.js";
import { getPublicIdFromUrl, removeLocalFile } from "../utils/file.js";
import { hasCourseAccess, isCourseOwner, shapeCourse } from "../utils/courseAccess.js";
import { catchAsync } from "../middleware/error.middleware.js";
import { AppError } from "../middleware/error.middleware.js";

const LEVELS = ["beginner", "intermediate", "advanced"];

// ---------- helpers ----------
// Escape user text before putting it in a RegExp (prevents regex injection / ReDoS).
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 50);
  return { page, limit, skip: (page - 1) * limit };
};

const parseBool = (v) => v === true || String(v).toLowerCase() === "true";

const assertValidId = (id, label = "course") => {
  if (!mongoose.isValidObjectId(id)) throw new AppError(`Invalid ${label} ID`, 400);
};

/** Load a course and make sure the logged-in user owns it (or is admin). */
const findManagedCourse = async (courseId, user) => {
  assertValidId(courseId);
  const course = await Course.findById(courseId);
  if (!course) throw new AppError("Course not found", 404);
  if (!isCourseOwner(course, user) && user.role !== "admin") {
    throw new AppError("You can only manage your own courses", 403);
  }
  return course;
};

const listCourses = async (filter, query, sort = { createdAt: -1 }) => {
  const { page, limit, skip } = parsePagination(query);
  const [courses, total] = await Promise.all([
    Course.find(filter)
      .select("-enrolledStudents")
      .populate("instructor", "name avatar")
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Course.countDocuments(filter),
  ]);
  return {
    courses,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Create a new course
 * @route POST /api/v1/courses
 */
export const createNewCourse = catchAsync(async (req, res) => {
  const { title, subtitle, description, category, level, price } = req.body;

  try {
    // validate BEFORE uploading so we don't waste a Cloudinary upload on bad input
    if (!title || !category || price === undefined || Number.isNaN(Number(price))) {
      throw new AppError("title, category and a numeric price are required", 400);
    }
    if (level && !LEVELS.includes(level)) {
      throw new AppError(`level must be one of: ${LEVELS.join(", ")}`, 400);
    }
    if (!req.file) throw new AppError("Course thumbnail is required", 400);

    const upload = await uploadMedia(req.file.path);
    if (!upload) throw new AppError("Failed to upload thumbnail", 502);

    let course;
    try {
      course = await Course.create({
        title,
        subtitle,
        description,
        category,
        level,
        price: Number(price),
        thumbnail: upload.secure_url,
        instructor: req.user._id,
      });
    } catch (err) {
      await deleteMediaFromCloudinary(upload.public_id); // don't leave an orphan image
      throw err;
    }

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { createdCourses: course._id } });

    res.status(201).json({ success: true, message: "Course created successfully", data: { course } });
  } finally {
    await removeLocalFile(req.file?.path);
  }
});

/**
 * Search courses with filters
 * @route GET /api/v1/courses/search
 */
export const searchCourses = catchAsync(async (req, res) => {
  const { category, level, minPrice, maxPrice, sortBy = "newest" } = req.query;
  const q = req.query.q ?? req.query.query;

  const filter = { isPublished: true };

  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ title: rx }, { subtitle: rx }, { description: rx }, { category: rx }];
  }
  if (category) {
    // "web,design" -> either category, case-insensitive exact match
    filter.category = {
      $in: String(category)
        .split(",")
        .map((c) => new RegExp(`^${escapeRegex(c.trim())}$`, "i")),
    };
  }
  if (level) {
    const levels = String(level).split(",").filter((l) => LEVELS.includes(l));
    if (levels.length) filter.level = { $in: levels };
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) filter.price.$lte = Number(maxPrice);
    if (Object.keys(filter.price).length === 0) delete filter.price;
  }

  const sorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    "price-low": { price: 1 },
    "price-high": { price: -1 },
  };

  const { courses, pagination } = await listCourses(filter, req.query, sorts[sortBy] || sorts.newest);

  res.status(200).json({ success: true, count: courses.length, pagination, data: { courses } });
});

/**
 * Get all published courses
 * @route GET /api/v1/courses/published
 */
export const getPublishedCourses = catchAsync(async (req, res) => {
  const { courses, pagination } = await listCourses({ isPublished: true }, req.query);
  res.status(200).json({ success: true, count: courses.length, pagination, data: { courses } });
});

/**
 * Get courses created by the current user
 * @route GET /api/v1/courses/my-courses
 */
export const getMyCreatedCourses = catchAsync(async (req, res) => {
  const courses = await Course.find({ instructor: req.user._id })
    .populate("lectures", "title duration order")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, count: courses.length, data: { courses } });
});

/**
 * Update course details
 * @route PATCH /api/v1/courses/:courseId
 */
export const updateCourseDetails = catchAsync(async (req, res) => {
  try {
    const course = await findManagedCourse(req.params.courseId, req.user);

    // whitelist - never copy req.body blindly (would allow changing instructor, enrolledStudents...)
    const { title, subtitle, description, category, level, price, isPublished } = req.body;
    if (title !== undefined) course.title = title;
    if (subtitle !== undefined) course.subtitle = subtitle;
    if (description !== undefined) course.description = description;
    if (category !== undefined) course.category = category;
    if (level !== undefined) {
      if (!LEVELS.includes(level)) throw new AppError(`level must be one of: ${LEVELS.join(", ")}`, 400);
      course.level = level;
    }
    if (price !== undefined) {
      if (Number.isNaN(Number(price))) throw new AppError("price must be a number", 400);
      course.price = Number(price);
    }
    if (isPublished !== undefined) {
      const publish = parseBool(isPublished);
      if (publish && course.lectures.length === 0) {
        throw new AppError("Add at least one lecture before publishing the course", 400);
      }
      course.isPublished = publish;
    }

    if (req.file) {
      const upload = await uploadMedia(req.file.path);
      if (!upload) throw new AppError("Failed to upload thumbnail", 502);
      const oldId = getPublicIdFromUrl(course.thumbnail);
      course.thumbnail = upload.secure_url;
      if (oldId) await deleteMediaFromCloudinary(oldId);
    }

    await course.save();
    res.status(200).json({ success: true, message: "Course updated successfully", data: { course } });
  } finally {
    await removeLocalFile(req.file?.path);
  }
});

/**
 * Get course by ID
 * @route GET /api/v1/courses/:courseId
 */
export const getCourseDetails = catchAsync(async (req, res) => {
  assertValidId(req.params.courseId);

  const course = await Course.findById(req.params.courseId)
    .populate("instructor", "name avatar bio")
    .populate({ path: "lectures", options: { sort: { order: 1 } } });
  if (!course) throw new AppError("Course not found", 404);

  // drafts are only visible to the owner, admins and already-enrolled students
  if (!course.isPublished && !hasCourseAccess(course, req.user)) {
    throw new AppError("Course not found", 404);
  }

  res.status(200).json({ success: true, data: { course: shapeCourse(course, req.user) } });
});

/**
 * Add lecture to course
 * @route POST /api/v1/courses/:courseId/lectures
 */
export const addLectureToCourse = catchAsync(async (req, res) => {
  try {
    const course = await findManagedCourse(req.params.courseId, req.user);

    const { title, description, isPreview, order } = req.body;
    if (!title) throw new AppError("Lecture title is required", 400);
    if (!req.file) throw new AppError("Lecture video is required", 400);

    const upload = await uploadMedia(req.file.path);
    if (!upload) throw new AppError("Failed to upload video", 502);

    let lecture;
    try {
      lecture = await Lecture.create({
        title,
        description,
        videoUrl: upload.secure_url,
        publicId: upload.public_id,
        duration: upload.duration || 0,
        isPreview: parseBool(isPreview),
        order: order !== undefined && !Number.isNaN(Number(order)) ? Number(order) : course.lectures.length + 1,
      });
    } catch (err) {
      await deleteVideoFromCloudinary(upload.public_id);
      throw err;
    }

    course.lectures.push(lecture._id);
    course.totalDuration += lecture.duration;
    await course.save(); // pre-save hook refreshes totalLectures

    res.status(201).json({ success: true, message: "Lecture added successfully", data: { lecture } });
  } finally {
    await removeLocalFile(req.file?.path);
  }
});

/**
 * Get course lectures
 * @route GET /api/v1/courses/:courseId/lectures
 */
export const getCourseLectures = catchAsync(async (req, res) => {
  assertValidId(req.params.courseId);

  const course = await Course.findById(req.params.courseId).populate({
    path: "lectures",
    options: { sort: { order: 1 } },
  });
  if (!course) throw new AppError("Course not found", 404);

  if (!course.isPublished && !hasCourseAccess(course, req.user)) {
    throw new AppError("Course not found", 404);
  }

  // non-enrolled users only get video URLs for preview lectures
  const { lectures } = shapeCourse(course, req.user);

  res.status(200).json({ success: true, count: lectures.length, data: { lectures } });
});
