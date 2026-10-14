import type { Course, LectureProgress } from "./types";

export const CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Data Science",
  "Machine Learning",
  "Programming",
  "Design",
  "Business",
  "Other",
];
export const LEVELS = ["beginner", "intermediate", "advanced"];

export const formatPrice = (n: number) => (n > 0 ? `₹${n.toLocaleString("en-IN")}` : "Free");

/** seconds -> "1h 05m" / "12m" / "45s" */
export function formatDuration(seconds = 0): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}

export const instructorName = (c: Course) => (typeof c.instructor === "string" ? "" : c.instructor.name);

/** progress entries hold the lecture as an id string OR a populated object */
export const lectureId = (lp: LectureProgress) =>
  typeof lp.lecture === "string" ? lp.lecture : lp.lecture._id;

// ---- Razorpay checkout popup (script loaded on demand) ----
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, cb: () => void) => void;
    };
  }
}

export function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}
