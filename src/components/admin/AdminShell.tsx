import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, FileText, Tag, Download,
  Settings, LogOut, Menu, X, BadgeCheck,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAdminAuth } from "@/lib/adminAuth";
import { Toaster } from "@/components/ui/sonner";

const NAV_GESTAO = [
  { to: "/admin/dashboard",    label: "Dashboard",            icon: LayoutDashboard },
  { to: "/admin/inscritos",    label: "Inscritos no Evento",  icon: Users },
  { to: "/admin/trabalhos",    label: "Trabalhos Submetidos", icon: FileText },
  { to: "/admin/cupons",       label: "Cupons",               icon: Tag },
  { to: "/admin/crachas",      label: "Crachás",              icon: BadgeCheck },
  { to: "/admin/exportar",     label: "Exportar Dados",       icon: Download },
];

const PAGE_TITLES: Record<string, string> = {
  "/admin/dashboard":    "Dashboard",
  "/admin/inscritos":    "Inscritos no Evento",
  "/admin/trabalhos":    "Trabalhos Submetidos",
  "/admin/cupons":       "Cupons",
  "/admin/crachas":      "Crachás",
  "/admin/exportar":     "Exportar Dados",
  "/admin/configuracoes":"Configurações",
};

export function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { user, ready, logout } = useAdminAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/admin/login" });
  }, [ready, user, navigate]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Bloqueia scroll do body no mobile quando sidebar aberta
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (!ready || !user) {
    return (
      <div
        className="min-h-screen bg-[#f9f6f4]"
        aria-busy="true"
        aria-label="Carregando painel administrativo"
      />
    );
  }

  const title = PAGE_TITLES[pathname] ?? "Admin";
  const today = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return (
    <div
      className="min-h-screen bg-[#f9f6f4]"
      style={{ fontFamily: "Poppins, system-ui, sans-serif" }}
    >
      <Toaster position="top-right" />

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Botão hamburger mobile */}
      <button
        onClick={() => setMobileOpen((o) => !o)}
        className="fixed left-3 top-3 z-50 rounded-md bg-[#1a0505] p-2 text-white shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C] md:hidden"
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        role="navigation"
        aria-label="Menu administrativo"
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-[#1a0505] text-white/75 transition-transform duration-300 md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo do painel */}
        <div className="flex items-center gap-3 px-5 py-5">
          <div
            aria-hidden="true"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#731111] font-bold text-white select-none"
          >
            II
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.1em] text-white/40">
              II COBEO
            </div>
            <div className="text-sm font-semibold text-white">Admin</div>
          </div>
        </div>

        <div className="h-px bg-white/10" />

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
            Gestão
          </div>
          <ul role="list" className="space-y-0.5">
            {NAV_GESTAO.map((item) => {
              const active = pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${
                      active
                        ? "bg-[#731111] text-white"
                        : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                    }`}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-[#C9A84C]"
                      />
                    )}
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/40">
            Sistema
          </div>
          <ul role="list" className="space-y-0.5">
            <li>
              <Link
                to="/admin/configuracoes"
                aria-current={pathname.startsWith("/admin/configuracoes") ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition-colors ${
                  pathname.startsWith("/admin/configuracoes")
                    ? "bg-[#731111] text-white"
                    : "text-white/75 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                <span>Configurações</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => { logout(); navigate({ to: "/admin/login" }); }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-[13px] text-white/75 transition-colors hover:bg-white/[0.06] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Usuário logado */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#C9A84C] text-xs font-bold text-[#1a0505] select-none"
            >
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12px] font-medium text-white">
                {user.email}
              </div>
              <div className="text-[10px] text-white/50">{user.role}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="md:pl-60">
        {/* Topbar — sem sininho */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#d9d9d9] bg-white px-6">
          <h1
            className="pl-10 text-[20px] font-semibold text-[#1a1a1a] md:pl-0"
            style={{ fontWeight: 600 }}
          >
            {title}
          </h1>
          <div className="flex items-center gap-4">
            <time
              dateTime={new Date().toISOString().split("T")[0]}
              className="hidden text-xs text-[#6b6b6b] md:inline"
            >
              {today}
            </time>
            <div
              aria-hidden="true"
              title={user.email}
              className="grid h-8 w-8 place-items-center rounded-full bg-[#731111] text-[11px] font-bold text-white select-none"
            >
              {user.initials}
            </div>
          </div>
        </header>

        <main id="main-content" className="p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
