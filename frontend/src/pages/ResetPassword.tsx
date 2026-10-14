import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "../AuthContext";
import AuthCard from "../components/AuthCard";
import PasswordInput from "../components/PasswordInput";

export default function ResetPassword() {
  const { token } = useParams();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.post(`/user/reset-password/${token}`, { password });
      setUser(res.data.user); // the backend logs you in after a reset
      navigate("/");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthCard title="Reset password" subtitle="Choose a new password for your account.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">New password</span>
          <PasswordInput value={password} onChange={setPassword} placeholder="Enter a new password" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn w-full py-3" disabled={busy}>
          {busy ? "Saving..." : "Reset password"}
        </button>
      </form>
    </AuthCard>
  );
}
