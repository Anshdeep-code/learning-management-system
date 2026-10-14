import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import type { Course } from "../types";
import { formatDuration } from "../utils";

export default function ManageLectures() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [video, setVideo] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0); // changing the key clears the file input
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api
      .get(`/course/c/${courseId}`)
      .then((res) => setCourse(res.data.data.course))
      .catch((e) => setError(errorMessage(e)));
  }, [courseId]);

  useEffect(load, [load]);

  async function addLecture(e: FormEvent) {
    e.preventDefault();
    if (!video) return;
    setError("");
    setPercent(0);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("isPreview", String(isPreview));
      fd.append("video", video);
      await api.post(`/course/c/${courseId}/lectures`, fd, {
        onUploadProgress: (ev) => setPercent(Math.round((ev.loaded * 100) / (ev.total || ev.loaded || 1))),
      });
      setTitle("");
      setDescription("");
      setIsPreview(false);
      setVideo(null);
      setFileKey((k) => k + 1);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPercent(null);
    }
  }

  async function deleteLecture(lectureId: string, lectureTitle: string) {
    if (!window.confirm(`Delete "${lectureTitle}"? This cannot be undone.`)) return;
    setError("");
    try {
      // NOTE: check this path against your backend's lecture routes
      await api.delete(`/course/c/${courseId}/lectures/${lectureId}`);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (error && !course) return <p className="page error">{error}</p>;
  if (!course) return <p className="page text-muted">Loading...</p>;

  return (
    <div className="page mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-sm text-muted">
          {course.isPublished ? "Published" : "Draft"} ·{" "}
          <Link to="/instructor" className="link">
            Back to dashboard
          </Link>
        </p>
      </div>

      <div className="card p-6">
        <h2 className="mb-3 font-semibold">Lectures ({course.lectures.length})</h2>
        {course.lectures.length === 0 && <p className="text-muted">No lectures yet. Add one below.</p>}
        {error && <p className="error mb-3">{error}</p>}
        <ol className="divide-y divide-line">
          {course.lectures.map((l, i) => (
            <li key={l._id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <span>
                {i + 1}. {l.title}
              </span>
              <span className="flex shrink-0 items-center gap-4 text-muted">
                <span>
                  {formatDuration(l.duration)}
                  {l.isPreview && " · free preview"}
                </span>
                <button type="button" className="text-red-600 hover:underline" onClick={() => deleteLecture(l._id, l.title)}>
                  Delete
                </button>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <form onSubmit={addLecture} className="card space-y-4 p-6">
        <h2 className="font-semibold">Add a lecture</h2>
        <label className="block">
          <span className="label">Title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea className="input" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} /> Free preview (anyone can watch it)
        </label>
        <label className="block">
          <span className="label">Video</span>
          <input key={fileKey} type="file" accept="video/*" className="text-sm" onChange={(e) => setVideo(e.target.files?.[0] || null)} required />
        </label>
        {percent !== null && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-brand" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-1 text-sm text-muted">Uploading... {percent}%</p>
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={percent !== null}>
          Add lecture
        </button>
      </form>
    </div>
  );
}
