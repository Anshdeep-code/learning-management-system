import axios from "axios";

// withCredentials => the browser sends/receives the httpOnly JWT cookie set by the backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1",
  withCredentials: true,
});

export default api;

interface ApiErrorBody {
  message?: string;
  errors?: { message?: string; msg?: string }[];
}

/** Turn any error into a readable message. */
export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiErrorBody | undefined;
    if (!data) {
      return err.code === "ERR_NETWORK" ? "Cannot reach the server. Is the backend running?" : fallback;
    }
    const list = Array.isArray(data.errors)
      ? data.errors.map((e) => e.message || e.msg).filter((m): m is string => !!m)
      : [];
    return list.length ? list.join(". ") : data.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
}
