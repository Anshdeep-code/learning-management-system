import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2 text-sm font-semibold ${isActive ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface hover:text-ink"}`;

/** Sidebar + content area, shared by "My learning" and "Profile". */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="page grid gap-8 md:grid-cols-[200px_1fr]">
      <aside className="flex gap-1 md:flex-col">
        <NavLink to="/my-learning" className={linkClass}>
          My learning
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          Profile
        </NavLink>
        <button onClick={handleLogout} className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 md:mt-4">
          Log out
        </button>
      </aside>
      <main>{children}</main>
    </div>
  );
}
