import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import CourseCard from "../components/CourseCard";
import type { Course, Pagination } from "../types";

export default function Courses() {
  // The search text and page number live in the URL (/courses?q=react&page=2),
  // so the navbar search, the back button and shared links all just work.
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "";
  const page = Number(params.get("page")) || 1;

  const [text, setText] = useState(query);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // keep the box in sync when the navbar search changes the URL
  useEffect(() => setText(query), [query]);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get("/course/search", { params: { q: query, page, limit: 9 } })
      .then((res) => {
        setCourses(res.data.data.courses);
        setPagination(res.data.pagination);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [query, page]);

  function goTo(newQuery: string, newPage: number) {
    const next: Record<string, string> = {};
    if (newQuery) next.q = newQuery;
    if (newPage > 1) next.page = String(newPage);
    setParams(next);
  }

  function search(e: FormEvent) {
    e.preventDefault();
    goTo(text.trim(), 1);
  }

  return (
    <div className="page">
      <h1 className="text-2xl font-bold">All courses</h1>
      {pagination && !loading && (
        <p className="mt-1 text-sm text-muted">
          {pagination.total} {pagination.total === 1 ? "course" : "courses"} found
          {query && ` for "${query}"`}
        </p>
      )}

      <form onSubmit={search} className="mt-5 flex max-w-lg gap-2">
        <input className="input" placeholder="Search courses..." aria-label="Search courses" value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn">Search</button>
      </form>

      <div className="mt-6">
        {error && <p className="error">{error}</p>}
        {loading && <p className="text-muted">Loading...</p>}
        {!loading && !error && courses.length === 0 && <p className="text-muted">No courses found. Try a different search.</p>}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard key={c._id} course={c} />
          ))}
        </div>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button className="btn-outline" disabled={page <= 1} onClick={() => goTo(query, page - 1)}>
            Previous
          </button>
          <span className="text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button className="btn-outline" disabled={page >= pagination.totalPages} onClick={() => goTo(query, page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
