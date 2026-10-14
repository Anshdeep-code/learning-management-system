import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import { CATEGORIES, LEVELS } from "../utils";

// One form for both "create" (no courseId in the URL) and "edit".
export default function CourseForm() {
  const { courseId } = useParams();
  const editing = !!courseId;
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [level, setLevel] = useState(LEVELS[0]);
  const [price, setPrice] = useState("0");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    api
      .get(`/course/c/${courseId}`)
      .then((res) => {
        const c = res.data.data.course;
        setTitle(c.title);
        setSubtitle(c.subtitle || "");
        setDescription(c.description || "");
        setCategory(c.category);
        setLevel(c.level);
        setPrice(String(c.price));
      })
      .catch((e) => setError(errorMessage(e)));
  }, [courseId]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("subtitle", subtitle);
      fd.append("description", description);
      fd.append("category", category);
      fd.append("level", level);
      fd.append("price", price);
      if (thumbnail) fd.append("thumbnail", thumbnail);

      if (editing) {
        await api.patch(`/course/c/${courseId}`, fd);
        navigate("/instructor");
      } else {
        const res = await api.post("/course", fd);
        navigate(`/instructor/courses/${res.data.data.course._id}/lectures`);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <form onSubmit={submit} className="card mx-auto max-w-xl space-y-4 p-6">
        <h1 className="text-xl font-bold">{editing ? "Edit course" : "New course"}</h1>
        <label className="block">
          <span className="label">Title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Subtitle</span>
          <input className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </label>
        <label className="block">
          <span className="label">Description</span>
          <textarea className="input" rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Category</span>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {/* keep a course's existing category selectable even if it is not in the list */}
              {[...new Set([...CATEGORIES, category])].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="label">Level</span>
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              {LEVELS.map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="label">Price (INR)</span>
          <input className="input" type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Thumbnail</span>
          <input type="file" accept="image/*" className="text-sm" onChange={(e) => setThumbnail(e.target.files?.[0] || null)} required={!editing} />
          {editing && <span className="hint">Leave empty to keep the current one.</span>}
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn" disabled={busy}>
          {busy ? "Saving..." : "Save course"}
        </button>
      </form>
    </div>
  );
}
