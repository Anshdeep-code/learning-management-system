import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";
import type { Course } from "../types";
import { formatPrice } from "../utils";

export default function InstructorDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .get("/course")
      .then((res) => setCourses(res.data.data.courses))
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function togglePublish(c: Course) {
    setError("");
    try {
      await api.patch(`/course/c/${c._id}`, { isPublished: !c.isPublished });
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  async function deleteCourse(c: Course) {
    if (!window.confirm(`Delete "${c.title}" and all its lectures? This cannot be undone.`)) return;
    setError("");
    try {
      // NOTE: check this path against your backend's course routes
      await api.delete(`/course/c/${c._id}`);
      load();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <div className="page">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My courses</h1>
        <Link to="/instructor/courses/new" className="btn">
          New course
        </Link>
      </div>
      {error && <p className="error mb-4">{error}</p>}
      {loading && <p className="text-muted">Loading...</p>}
      {!loading && courses.length === 0 && <p className="text-muted">You have not created any course yet.</p>}

      {courses.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Lectures</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {courses.map((c) => (
                <tr key={c._id}>
                  <td className="px-4 py-3">
                    <Link to={`/course-detail/${c._id}`} className="link font-semibold">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.isPublished ? "bg-green-50 text-green-700" : "bg-gray-100 text-muted"}`}>
                      {c.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3">{c.lectures.length}</td>
                  <td className="px-4 py-3">{formatPrice(c.price)}</td>
                  <td className="space-x-4 whitespace-nowrap px-4 py-3 text-right">
                    <Link to={`/instructor/courses/${c._id}/edit`} className="link">
                      Edit
                    </Link>
                    <Link to={`/instructor/courses/${c._id}/lectures`} className="link">
                      Lectures
                    </Link>
                    <button className="link" onClick={() => togglePublish(c)}>
                      {c.isPublished ? "Unpublish" : "Publish"}
                    </button>
                    <button className="text-red-600 hover:underline" onClick={() => deleteCourse(c)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
