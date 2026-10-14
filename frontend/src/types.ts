export interface User {
  _id: string;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
  bio?: string;
  avatar?: string;
}

export interface Lecture {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string; // only present if you own/purchased the course, or the lecture is a preview
  duration: number; // seconds
  order: number;
  isPreview: boolean;
}

export interface Course {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  level: string;
  price: number;
  thumbnail: string;
  // populated object in lists/details, plain id in "my courses"
  instructor: { _id: string; name: string; bio?: string } | string;
  lectures: Lecture[];
  isPublished: boolean;
  totalLectures: number;
  totalDuration: number;
}

export interface LectureProgress {
  lecture: string | { _id: string };
  isCompleted: boolean;
  watchTime: number;
}

export interface Progress {
  completionPercentage: number;
  isCompleted: boolean;
  lectureProgress: LectureProgress[];
}

export interface Pagination {
  page: number;
  totalPages: number;
  total: number;
}
