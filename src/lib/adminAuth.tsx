import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "./supabaseClient";

interface AdminUser {
  email: string;
  role: string;
  initials: string;
}

interface AdminAuthCtx {
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  ready: boolean;
  error: string | null;
  // Item 3 da auditoria pré-lançamento: recuperação de senha via Supabase Auth nativo.
  requestPasswordReset: (email: string) => Promise<{ ok: boolean; error?: string }>;
  updatePassword: (novaSenha: string) => Promise<{ ok: boolean; error?: string }>;
}

const Ctx = createContext<AdminAuthCtx | null>(null);

function initialsFrom(email: string) {
  const namePart = email.split("@")[0] ?? "";
  const letters = namePart.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  return letters || "AD";
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Restaura sessão existente
    supabase.auth.getSession().then(({ data }) => {
      const email = data.session?.user?.email;
      if (email) {
        setUser({ email, role: "Administrador", initials: initialsFrom(email) });
      }
      setReady(true);
    });

    // Escuta mudanças de autenticação (login/logout em outras abas)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email;
      setUser(email ? { email, role: "Administrador", initials: initialsFrom(email) } : null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string): Promise<boolean> {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      setError("E-mail ou senha incorretos.");
      return false;
    }

    setUser({
      email: data.user.email!,
      role: "Administrador",
      initials: initialsFrom(data.user.email!),
    });
    return true;
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function requestPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/admin/redefinir-senha` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  async function updatePassword(novaSenha: string): Promise<{ ok: boolean; error?: string }> {
    const { error } = await supabase.auth.updateUser({ password: novaSenha });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  return (
    <Ctx.Provider value={{ user, login, logout, ready, error, requestPasswordReset, updatePassword }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAdminAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAdminAuth must be inside AdminAuthProvider");
  return c;
}
