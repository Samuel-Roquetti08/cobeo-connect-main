import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface AdminUser {
  email: string;
  role: string;
  initials: string;
}

interface AdminAuthCtx {
  user: AdminUser | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  ready: boolean;
}

const Ctx = createContext<AdminAuthCtx | null>(null);

const ADMIN_EMAIL = "admin@cobeo.com.br";
const ADMIN_PASS = "cobeo2025";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("cobeo_admin_v2") === "1") {
      setUser({ email: ADMIN_EMAIL, role: "Administrador", initials: "AD" });
    }
    setReady(true);
  }, []);

  function login(email: string, password: string) {
    if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASS) {
      localStorage.setItem("cobeo_admin_v2", "1");
      setUser({ email: ADMIN_EMAIL, role: "Administrador", initials: "AD" });
      return true;
    }
    return false;
  }
  function logout() {
    localStorage.removeItem("cobeo_admin_v2");
    setUser(null);
  }

  return <Ctx.Provider value={{ user, login, logout, ready }}>{children}</Ctx.Provider>;
}

export function useAdminAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminAuth must be inside AdminAuthProvider");
  return c;
}
