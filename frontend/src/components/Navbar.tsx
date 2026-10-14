import { useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Avatar from "./Avatar";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? "text-sm font-semibold text-brand" : "text-sm text-muted hover:text-ink";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    navigate(`/courses?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
        <Link to="/" className="text-xl font-extrabold text-brand">
          LearnHub
        </Link>

        <NavLink to="/" end className={linkClass}>
          Home
        </NavLink>
        <NavLink to="/courses" className={linkClass}>
          Courses
        </NavLink>
        {user && (
          <NavLink to="/my-learning" className={linkClass}>
            My learning
          </NavLink>
        )}
        {user?.role === "instructor" && (
          <NavLink to="/instructor" className={linkClass}>
            Instructor
          </NavLink>
        )}

        <form onSubmit={handleSearch} className="w-full sm:ml-auto sm:w-64">
          <input
            className="input bg-surface"
            placeholder="Search courses..."
            aria-label="Search courses"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {user ? (
          <Link to="/profile" aria-label="Your profile">
            <Avatar user={user} />
          </Link>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="btn-outline">
              Log in
            </Link>
            <Link to="/signup" className="btn">
              Sign up
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
}
