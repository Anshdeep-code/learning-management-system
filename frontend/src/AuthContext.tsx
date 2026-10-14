import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import api from "./api";
import type { User } from "./types";

interface AuthValue {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { name: string; email: string; password: string; role: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // true until we know whether a session cookie exists

  // On first load ask the backend "who am I?" - the cookie is sent automatically.
  useEffect(() => {
    api
      .get("/user/profile")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await api.post("/user/signin", { email, password });
    setUser(res.data.user);
  }

  async function signup(data: { name: string; email: string; password: string; role: string }) {
    const res = await api.post("/user/signup", data);
    setUser(res.data.user);
  }

  async function logout() {
    try {
      await api.post("/user/signout");
    } finally {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
