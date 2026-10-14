import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { errorMessage } from "../api";
import { useAuth } from "../AuthContext";
import AuthCard from "../components/AuthCard";
import PasswordInput from "../components/PasswordInput";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup({ name, email, password, role });
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Create an account" subtitle="Join LearnHub and start learning.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">Name</span>
          <input className="input" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} required />
          <span className="hint">Letters and spaces only.</span>
        </label>
        <label className="block">
          <span className="label">Email</span>
          <input className="input" type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block">
          <span className="label">Password</span>
          <PasswordInput value={password} onChange={setPassword} placeholder="Create a password" />
          <span className="hint">8+ characters with a number, uppercase, lowercase and a special character (!@#$%^&*).</span>
        </label>
        <label className="block">
          <span className="label">I am a</span>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="instructor">Instructor</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn w-full py-3" disabled={busy}>
          {busy ? "Creating account..." : "Sign up"}
        </button>
        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="link font-semibold">
            Log in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
