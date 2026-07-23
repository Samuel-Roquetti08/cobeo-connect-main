import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { useAdminAuth } from "@/lib/adminAuth";

export const Route = createFileRoute("/admin/redefinir-senha")({
  head: () => ({ meta: [{ title: "Redefinir senha · Admin · II COBEO" }] }),
  component: RedefinirSenha,
});

// Chegou aqui pelo link de e-mail do Supabase Auth (?type=recovery). O
// próprio client já detecta o token na URL e estabelece a sessão antes de
// `ready` virar true — ver detectSessionInUrl em supabaseClient.ts.
function RedefinirSenha() {
  const navigate = useNavigate();
  const { user, ready, updatePassword } = useAdminAuth();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    if (senha.length < 6) {
      setErr("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErr("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { ok, error } = await updatePassword(senha);
    setLoading(false);
    if (ok) {
      setSucesso(true);
      setTimeout(() => navigate({ to: "/admin/dashboard" }), 1500);
    } else {
      setErr(error ?? "Não foi possível redefinir a senha.");
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#1a0505] px-4"
      style={{ fontFamily: "Poppins, system-ui, sans-serif" }}
    >
      <main className="w-full max-w-sm">
        <div className="rounded-xl border border-white/10 bg-[#0f0303] p-8 shadow-2xl">
          <div className="mb-7 text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-md bg-[#731111] font-bold text-white select-none"
            >
              II
            </div>
            <h1 className="text-xl font-semibold text-white">Definir nova senha</h1>
          </div>

          {!ready ? (
            <p className="text-center text-xs text-white/50">Verificando link...</p>
          ) : !user ? (
            <div className="space-y-4 text-center">
              <p className="text-xs text-red-300">
                Link inválido ou expirado. Peça um novo link de redefinição na tela de login.
              </p>
              <Link to="/admin/login" className="text-[11px] text-white/40 underline hover:text-white/70">
                ← Voltar ao login
              </Link>
            </div>
          ) : sucesso ? (
            <p role="status" className="text-center text-xs text-emerald-300">
              Senha redefinida com sucesso. Redirecionando...
            </p>
          ) : (
            <form onSubmit={onSubmit} noValidate aria-label="Formulário de nova senha" className="space-y-4">
              <div>
                <label htmlFor="nova-senha" className="mb-1 block text-[11px] font-medium text-white/60">
                  Nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
                  <input
                    id="nova-senha"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-9 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmar-senha" className="mb-1 block text-[11px] font-medium text-white/60">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" aria-hidden="true" />
                  <input
                    id="confirmar-senha"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-white/10 bg-white/5 px-9 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C]"
                  />
                </div>
              </div>

              {err && (
                <div role="alert" className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {err}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[#731111] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8a1515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
