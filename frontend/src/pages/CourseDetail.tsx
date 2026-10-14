import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "../AuthContext";
import type { Course, Lecture } from "../types";
import { formatDuration, formatPrice, instructorName, loadRazorpay } from "../utils";

type Tab = "overview" | "curriculum" | "instructor";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "curriculum", label: "Curriculum" },
  { id: "instructor", label: "Instructor" },
];

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [purchased, setPurchased] = useState(false);
  const [preview, setPreview] = useState<Lecture | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get(`/purchase/course/${courseId}/detail-with-status`)
      .then((res) => {
        setCourse(res.data.course);
        setPurchased(res.data.purchased);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [courseId]);

  async function buyWithRazorpay() {
    if (!course) return;
    setBusy(true);
    setError("");
    try {
      if (!(await loadRazorpay())) throw new Error("Could not load Razorpay");
      const { data } = await api.post("/razorpay/create-order", { courseId });
      const rzp = new window.Razorpay({
        key: data.key,
        amount: data.order.amount,
        currency: data.order.currency,
        order_id: data.order.id,
        name: "LearnHub",
        description: course.title,
        prefill: { name: user?.name, email: user?.email },
        // Razorpay gives back order_id, payment_id and signature; the server verifies them.
        handler: async (resp: Record<string, string>) => {
          try {
            await api.post("/razorpay/verify-payment", resp);
            navigate(`/course-progress/${courseId}`);
          } catch (e) {
            setError(errorMessage(e, "Payment verification failed"));
          }
        },
      });
      rzp.on("payment.failed", () => setError("Payment failed. Please try again."));
      rzp.open();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function buyWithStripe() {
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/purchase/checkout/create-checkout-session", { courseId });
      window.location.href = data.url; // Stripe hosted checkout page
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  if (error && !course) return <p className="page error">{error}</p>;
  if (!course) return <p className="page text-muted">Loading...</p>;

  const teacher = typeof course.instructor === "string" ? null : course.instructor;
  const isOwner = user && teacher && teacher._id === user._id;

  return (
    <div className="page">
      <p className="mb-4 text-sm text-muted">
        <Link to="/courses" className="hover:text-ink">
          Courses
        </Link>{" "}
        / {course.category} / {course.title}
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* ---------- left: course info ---------- */}
        <div>
          <h1 className="text-3xl font-bold">
            {course.title} {!course.isPublished && <span className="text-base font-normal text-muted">(draft)</span>}
          </h1>
          {course.subtitle && <p className="mt-2 text-muted">{course.subtitle}</p>}
          {teacher && <p className="mt-3 text-sm">Created by <b>{instructorName(course)}</b></p>}

          <div className="mt-5 overflow-hidden rounded-xl bg-black">
            {preview?.videoUrl ? (
              <video key={preview._id} src={preview.videoUrl} controls autoPlay className="aspect-video w-full" />
            ) : (
              <img src={course.thumbnail} alt="" className="aspect-video w-full object-cover" />
            )}
          </div>
          {preview && <p className="mt-2 text-sm text-muted">Previewing: {preview.title}</p>}

          <div className="mt-6 flex gap-6 border-b border-line">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`-mb-px border-b-2 pb-3 text-sm font-semibold ${tab === t.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-5">
            {tab === "overview" && <p className="whitespace-pre-line">{course.description || "No description yet."}</p>}

            {tab === "curriculum" && (
              <>
                {course.lectures.length === 0 && <p className="text-muted">No lectures yet.</p>}
                <ol className="divide-y divide-line">
                  {course.lectures.map((l, i) => (
                    <li key={l._id} className="flex items-center justify-between gap-4 py-3">
                      <span>
                        {i + 1}. {l.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-3 text-sm text-muted">
                        {formatDuration(l.duration)}
                        {l.videoUrl ? (
                          !purchased && (
                            <button className="link font-semibold" onClick={() => setPreview(l)}>
                              Preview
                            </button>
                          )
                        ) : (
                          <span>Locked</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            )}

            {tab === "instructor" && (
              <div>
                <p className="font-semibold">{instructorName(course) || "Instructor"}</p>
                <p className="mt-1 text-muted">{teacher?.bio || "This instructor has not added a bio yet."}</p>
              </div>
            )}
          </div>
        </div>

        {/* ---------- right: price + buy ---------- */}
        <aside className="card h-fit space-y-4 p-6 lg:sticky lg:top-6">
          <p className="text-3xl font-bold">{formatPrice(course.price)}</p>

          {purchased ? (
            <Link to={`/course-progress/${course._id}`} className="btn w-full">
              Go to course
            </Link>
          ) : (
            <div className="space-y-2">
              <button className="btn w-full py-3" disabled={busy} onClick={buyWithRazorpay}>
                Buy now
              </button>
              <button className="btn-outline w-full py-3" disabled={busy} onClick={buyWithStripe}>
                Pay with card (Stripe)
              </button>
            </div>
          )}

          {isOwner && (
            <Link to={`/instructor/courses/${course._id}/lectures`} className="link block text-sm">
              Manage lectures
            </Link>
          )}
          {error && <p className="error">{error}</p>}

          <ul className="space-y-2 border-t border-line pt-4 text-sm text-muted">
            <li>Category: {course.category}</li>
            <li className="capitalize">Level: {course.level}</li>
            <li>{course.totalLectures} lectures</li>
            <li>{formatDuration(course.totalDuration)} of video</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
