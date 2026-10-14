import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api, { errorMessage } from "../api";
import { useAuth } from "../AuthContext";
import AccountLayout from "../components/AccountLayout";
import Avatar from "../components/Avatar";
import PasswordInput from "../components/PasswordInput";

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const [deleteErr, setDeleteErr] = useState("");

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileMsg("");
    setProfileErr("");
    try {
      const fd = new FormData();
      fd.append("name", name);
      fd.append("bio", bio);
      if (avatar) fd.append("avatar", avatar);
      const res = await api.patch("/user/profile", fd);
      setUser(res.data.user);
      setProfileMsg("Profile saved.");
    } catch (err) {
      setProfileErr(errorMessage(err));
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwErr("");
    try {
      await api.patch("/user/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPwMsg("Password changed.");
    } catch (err) {
      setPwErr(errorMessage(err));
    }
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account permanently?")) return;
    setDeleteErr("");
    try {
      await api.delete("/user/account");
      setUser(null);
      navigate("/");
    } catch (err) {
      setDeleteErr(errorMessage(err));
    }
  }

  if (!user) return null;

  return (
    <AccountLayout>
      <div className="max-w-xl space-y-6">
        <form onSubmit={saveProfile} className="card space-y-4 p-6">
          <div className="flex items-center gap-4">
            <Avatar user={user} size="h-16 w-16" />
            <div>
              <h1 className="text-xl font-bold">Profile</h1>
              <p className="text-sm capitalize text-muted">
                {user.email} · {user.role}
              </p>
            </div>
          </div>
          <label className="block">
            <span className="label">Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block">
            <span className="label">Bio</span>
            <textarea className="input" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
          </label>
          <label className="block">
            <span className="label">Profile picture</span>
            <input type="file" accept="image/*" className="text-sm" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
          </label>
          {profileMsg && <p className="success">{profileMsg}</p>}
          {profileErr && <p className="error">{profileErr}</p>}
          <button className="btn">Save changes</button>
        </form>

        <form onSubmit={changePassword} className="card space-y-4 p-6">
          <h2 className="text-lg font-semibold">Change password</h2>
          <label className="block">
            <span className="label">Current password</span>
            <PasswordInput value={currentPassword} onChange={setCurrentPassword} />
          </label>
          <label className="block">
            <span className="label">New password</span>
            <PasswordInput value={newPassword} onChange={setNewPassword} />
          </label>
          {pwMsg && <p className="success">{pwMsg}</p>}
          {pwErr && <p className="error">{pwErr}</p>}
          <button className="btn">Change password</button>
        </form>

        <div className="card space-y-3 p-6">
          <h2 className="text-lg font-semibold">Delete account</h2>
          <p className="text-sm text-muted">This removes your account for good and cannot be undone.</p>
          {deleteErr && <p className="error">{deleteErr}</p>}
          <button className="btn-danger" onClick={deleteAccount}>
            Delete my account
          </button>
        </div>
      </div>
    </AccountLayout>
  );
}
