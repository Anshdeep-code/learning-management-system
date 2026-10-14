import { Link } from "react-router-dom";
import type { Course } from "../types";
import { formatPrice, instructorName } from "../utils";

export default function CourseCard({ course }: { course: Course }) {
  const teacher = instructorName(course);

  return (
    <Link to={`/course-detail/${course._id}`} className="card block overflow-hidden hover:shadow-md">
      <img src={course.thumbnail} alt="" className="aspect-video w-full object-cover" />
      <div className="space-y-1 p-4">
        <h3 className="font-semibold leading-snug">{course.title}</h3>
        {teacher && <p className="text-sm text-muted">{teacher}</p>}
        <p className="text-sm capitalize text-muted">
          {course.level} · {course.totalLectures} lectures
        </p>
        <p className="pt-1 text-lg font-bold">{formatPrice(course.price)}</p>
      </div>
    </Link>
  );
}
