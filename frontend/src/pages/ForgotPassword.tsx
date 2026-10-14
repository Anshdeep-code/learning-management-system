import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api";
import AuthCard from "../components/AuthCard";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const res = await api.post("/user/forgot-password", { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Forgot password" subtitle="Enter your email and we will send you a reset link.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">Email</span>
          <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
        <button className="btn w-full py-3" disabled={busy}>
          {busy ? "Sending..." : "Send reset link"}
        </button>
        <p className="text-center text-sm">
          <Link to="/login" className="link">
            Back to log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
