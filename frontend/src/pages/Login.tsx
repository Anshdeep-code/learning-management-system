import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { errorMessage } from "../api";
import { useAuth } from "../AuthContext";
import AuthCard from "../components/AuthCard";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // ProtectedRoute remembers the page you wanted, so we can send you back there
  const from = (location.state as { from?: string } | null)?.from || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Log in" subtitle="Welcome back! Please log in to your account.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">Email</span>
          <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <PasswordInput value={password} onChange={setPassword} placeholder="Enter your password" />
        </label>
        <div className="text-right text-sm">
          <Link to="/forgot-password" className="link">
            Forgot password?
          </Link>
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn w-full py-3" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>
        <p className="text-center text-sm text-muted">
          Don't have an account?{" "}
          <Link to="/signup" className="link font-semibold">
            Sign up
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
