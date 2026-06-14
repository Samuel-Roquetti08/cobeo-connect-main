import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Lock, Mail } from "lucide-react";
import { useAdminAuth } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Admin · II COBEO" }] }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const { login, user, ready } = useAdminAuth();
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/admin/dashboard" });
  }, [ready, user, navigate]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const pass = String(fd.get("pass") || "");

    // Pequeno delay para evitar brute-force visual e feedback de loading
    setTimeout(() => {
      if (login(email, pass)) {
        navigate({ to: "/admin/dashboard" });
      } else {
        setErr("E-mail ou senha incorretos.");
        setLoading(false);
      }
    }, 600);
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#1a0505] px-4"
      style={{ fontFamily: "Poppins, system-ui, sans-serif" }}
    >
      <main className="w-full max-w-sm">
        <form
          onSubmit={onSubmit}
          noValidate
          aria-label="Formulário de acesso administrativo"
          className="rounded-xl border border-white/10 bg-[#0f0303] p-8 shadow-2xl"
        >
          {/* Header */}
          <div className="mb-7 text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-[#731111] font-bold text-white select-none"
            >
              II
            </div>
            <h1 className="text-xl font-semibold text-white">II COBEO · Admin</h1>
            <p className="mt-1 text-xs text-white/50">
              Acesso restrito à organização do evento.
            </p>
          </div>

          <div className="space-y-4">
            {/* E-mail */}
            <div>
              <label
                htmlFor="login-email"
                className="mb-1 block text-[11px] font-medium text-white/60"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                  aria-hidden="true"
                />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@cobeo.com.br"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-9 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-colors focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="login-pass"
                className="mb-1 block text-[11px] font-medium text-white/60"
              >
                Senha
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30"
                  aria-hidden="true"
                />
                <input
                  id="login-pass"
                  name="pass"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-white/10 bg-white/5 px-9 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]"
                />
              </div>
            </div>
          </div>

          {/* Erro */}
          {err && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300"
            >
              {err}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md bg-[#731111] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8a1515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Entrar no Painel"}
          </button>

          {/* Link voltar — sem expor credenciais */}
          <div className="mt-5 text-center">
            <Link
              to="/"
              className="text-[11px] text-white/40 transition-colors hover:text-white/70"
            >
              ← Voltar ao site
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
