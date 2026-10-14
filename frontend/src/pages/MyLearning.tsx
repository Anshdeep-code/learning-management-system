import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";
import AccountLayout from "../components/AccountLayout";
import type { Course } from "../types";

interface Purchase {
  purchaseId: string;
  course: Course;
}

export default function MyLearning() {
  const [items, setItems] = useState<Purchase[]>([]);
  const [percent, setPercent] = useState<Record<string, number>>({}); // courseId -> % complete
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/purchase");
        const purchases: Purchase[] = res.data.purchasedCourses;
        setItems(purchases);

        // one progress request per course; if one fails we simply show 0%
        const entries = await Promise.all(
          purchases.map(async (p) => {
            try {
              const r = await api.get(`/progress/${p.course._id}`);
              return [p.course._id, r.data.data.progress.completionPercentage as number] as const;
            } catch {
              return [p.course._id, 0] as const;
            }
          })
        );
        setPercent(Object.fromEntries(entries));
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <AccountLayout>
      <h1 className="text-2xl font-bold">My learning</h1>

      <div className="mt-6 space-y-4">
        {error && <p className="error">{error}</p>}
        {loading && <p className="text-muted">Loading...</p>}
        {!loading && !error && items.length === 0 && (
          <p className="text-muted">
            You have not bought any course yet.{" "}
            <Link to="/courses" className="link">
              Browse courses
            </Link>
          </p>
        )}

        {items.map(({ purchaseId, course }) => {
          const done = percent[course._id] || 0;
          return (
            <div key={purchaseId} className="card flex flex-wrap items-center gap-4 p-4">
              <img src={course.thumbnail} alt="" className="aspect-video w-32 rounded-lg object-cover sm:w-40" />
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{course.title}</h2>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${done}%` }} />
                </div>
                <p className="mt-1 text-sm text-muted">{done}% complete</p>
              </div>
              <Link to={`/course-progress/${course._id}`} className="btn">
                Continue
              </Link>
            </div>
          );
        })}
      </div>
    </AccountLayout>
  );
}
