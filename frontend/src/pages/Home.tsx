import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import CourseCard from "../components/CourseCard";
import type { Course } from "../types";

/** Simple open-book picture for the hero, so we don't need an image file. */
function HeroArt() {
  return (
    <svg viewBox="0 0 320 240" className="w-full max-w-sm" aria-hidden="true">
      <rect width="320" height="240" rx="28" fill="#eaf1fe" />
      <path d="M60 72 L160 88 V196 L60 180 Z" fill="#1a63e8" />
      <path d="M260 72 L160 88 V196 L260 180 Z" fill="#7aa7f5" />
      <path d="M80 110h60M80 130h60M80 150h40M180 110h60M180 130h60M180 150h40" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
    </svg>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api
      .get("/course/search", { params: { limit: 3 } })
      .then((res) => setCourses(res.data.data.courses))
      .catch(() => setCourses([])); // the hero still works without the list
  }, []);

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-14 sm:px-6 md:grid-cols-2">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
            Learn new skills at your <span className="text-brand">own pace</span>
          </h1>
          <p className="mt-4 max-w-md text-muted">
            Explore courses from expert instructors, watch lectures any time, and keep track of how far you have come.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/courses" className="btn px-6 py-3">
              Browse courses
            </Link>
            {user ? (
              <Link to="/my-learning" className="btn-outline px-6 py-3">
                My learning
              </Link>
            ) : (
              <Link to="/signup" className="btn-outline px-6 py-3">
                Get started
              </Link>
            )}
          </div>
        </div>
        <div className="flex justify-center md:justify-end">
          <HeroArt />
        </div>
      </section>

      {courses.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Explore courses</h2>
            <Link to="/courses" className="link text-sm">
              View all
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c._id} course={c} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
