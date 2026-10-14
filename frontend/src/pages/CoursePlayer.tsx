import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import type { Course, Progress } from "../types";
import { formatDuration, lectureId } from "../utils";

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeId, setActiveId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const detail = await api.get(`/purchase/course/${courseId}/detail-with-status`);
        if (!detail.data.purchased) {
          navigate(`/course-detail/${courseId}`, { replace: true });
          return;
        }
        const prog = await api.get(`/progress/${courseId}`);
        const c: Course = detail.data.course;
        const p: Progress = prog.data.data.progress;
        setCourse(c);
        setProgress(p);
        // start at the first lecture that is not completed yet
        const next = c.lectures.find((l) => !p.lectureProgress.find((lp) => lectureId(lp) === l._id)?.isCompleted);
        setActiveId((next || c.lectures[0])?._id || "");
      } catch (e) {
        setError(errorMessage(e));
      }
    }
    load();
  }, [courseId, navigate]);

  async function patch(url: string, body?: object) {
    setError("");
    try {
      const res = await api.patch(`/progress/${courseId}${url}`, body);
      setProgress(res.data.data.progress);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  if (error && !course) return <p className="page error">{error}</p>;
  if (!course || !progress) return <p className="page text-muted">Loading...</p>;

  const entryOf = (id: string) => progress.lectureProgress.find((lp) => lectureId(lp) === id);
  const active = course.lectures.find((l) => l._id === activeId);
  const activeDone = active ? !!entryOf(active._id)?.isCompleted : false;

  return (
    <div className="page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <div className="w-60">
          <div className="h-2 overflow-hidden rounded-full bg-line">
            <div className="h-full rounded-full bg-brand" style={{ width: `${progress.completionPercentage}%` }} />
          </div>
          <p className="mt-1 text-sm text-muted">
            {progress.completionPercentage}% complete {progress.isCompleted && "- course finished"}
          </p>
        </div>
      </div>
      {error && <p className="error mb-4">{error}</p>}

      {course.lectures.length === 0 ? (
        <p className="text-muted">This course has no lectures yet.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* ---------- video + lecture info ---------- */}
          <div>
            {active?.videoUrl && (
              <video
                key={active._id}
                src={active.videoUrl}
                controls
                className="aspect-video w-full rounded-xl bg-black"
                onLoadedMetadata={(e) => {
                  const saved = entryOf(active._id)?.watchTime || 0;
                  if (!activeDone && saved > 0) e.currentTarget.currentTime = saved; // resume where you stopped
                }}
                onPause={(e) => patch(`/lectures/${active._id}`, { watchTime: Math.floor(e.currentTarget.currentTime) })}
                onEnded={() => patch(`/lectures/${active._id}`, { isCompleted: true })}
              />
            )}
            {active && (
              <div className="mt-4 space-y-3">
                <h2 className="text-xl font-semibold">{active.title}</h2>
                {active.description && <p className="text-muted">{active.description}</p>}
                <button className={activeDone ? "btn-outline" : "btn"} onClick={() => patch(`/lectures/${active._id}`, { isCompleted: !activeDone })}>
                  {activeDone ? "Mark as not completed" : "Mark as completed"}
                </button>
              </div>
            )}
          </div>

          {/* ---------- lecture list ---------- */}
          <div>
            <h2 className="mb-3 font-semibold">Lectures</h2>
            <ol className="space-y-2">
              {course.lectures.map((l, i) => {
                const done = !!entryOf(l._id)?.isCompleted;
                const isActive = l._id === activeId;
                return (
                  <li key={l._id}>
                    <button
                      onClick={() => setActiveId(l._id)}
                      className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left text-sm ${isActive ? "border-brand bg-brand-soft" : "border-line hover:bg-surface"}`}
                    >
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${done ? "border-brand bg-brand text-white" : "border-gray-300"}`}
                      >
                        {done && "✓"}
                      </span>
                      <span className="flex-1">
                        {i + 1}. {l.title}
                      </span>
                      <span className="text-muted">{formatDuration(l.duration)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-outline" onClick={() => patch("/complete")}>
                Mark course completed
              </button>
              <button className="btn-outline" onClick={() => window.confirm("Reset all progress for this course?") && patch("/reset")}>
                Reset progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
