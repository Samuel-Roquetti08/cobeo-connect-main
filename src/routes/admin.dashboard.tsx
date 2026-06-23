import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useMemo, useState } from "react";
import {
  Users, CreditCard, FileText, Utensils, Loader2, AlertCircle, RefreshCw,
  ArrowUp, ArrowDown, ChevronsUpDown,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useInscritos, useTrabalhos } from "@/lib/api/adminHooks";
import { CATEGORIA_LABELS, STATUS_LABELS, type Inscrito, type StatusPagamento } from "@/lib/api/adminTypes";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  ),
});

const CATEGORIA_COLORS: Record<string, string> = {
  "Aluno UNIFAFIBE": "#731111",
  "Aluno Externo": "#C9A84C",
  "Profissional": "#b5736f",
};

// ── Tipagem da ordenação da tabela ────────────────────────────────────────────
type SortCol = "nome" | "createdAt" | "status";
type SortDir = "asc" | "desc";

function Dashboard() {
  const inscritosQ = useInscritos();
  const trabalhosQ = useTrabalhos();

  const isLoading = inscritosQ.isLoading || trabalhosQ.isLoading;
  const isError = inscritosQ.isError || trabalhosQ.isError;

  const inscritos = useMemo(() => inscritosQ.data ?? [], [inscritosQ.data]);
  const trabalhos = useMemo(() => trabalhosQ.data ?? [], [trabalhosQ.data]);

  // Estado de ordenação da tabela de inscrições (tipo explorer)
  const [sortCol, setSortCol] = useState<SortCol>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      // padrão sensato por coluna: nome A→Z, data recente→antiga, status A→Z
      setSortDir(col === "createdAt" ? "desc" : "asc");
    }
  }

  // ── KPIs derivados ──────────────────────────────────────────────────────────
  const totalInscritos = inscritos.length;
  const confirmados = inscritos.filter((i) => i.status === "pago").length;
  const pendentes = inscritos.filter((i) => i.status === "pendente").length;
  const totalTrabalhos = trabalhos.length;
  const comJantar = inscritos.filter((i) => i.jantarOpcao && i.status === "pago").length;

  // Cada KPI aponta para um destino (Inscritos filtrado ou Trabalhos)
  const KPIS = [
    {
      label: "Total de Inscritos", value: totalInscritos, accent: "#731111", icon: Users,
      sub: `${pendentes} pendentes`,
      to: "/admin/inscritos" as const, search: {} as Record<string, string>,
    },
    {
      label: "Pagamentos Confirmados", value: confirmados, accent: "#2d7a3a", icon: CreditCard,
      sub: totalInscritos > 0 ? `${Math.round((confirmados / totalInscritos) * 100)}% do total` : "—",
      to: "/admin/inscritos" as const, search: { status: "pago" },
    },
    {
      label: "Trabalhos Submetidos", value: totalTrabalhos, accent: "#C9A84C", icon: FileText,
      sub: `${trabalhos.filter((t) => t.status === "pago").length} pagos`,
      to: "/admin/trabalhos" as const, search: {} as Record<string, string>,
    },
    {
      label: "Ingressos de Jantar", value: comJantar, accent: "#b5736f", icon: Utensils,
      sub: "confirmados",
      to: "/admin/inscritos" as const, search: { jantar: "com" },
    },
  ];

  // ── Inscrições por dia (últimos 7 dias) ─────────────────────────────────────
  const inscricoesPorDia = useMemo(() => {
    const dias: { dia: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const total = inscritos.filter((ins) => new Date(ins.createdAt).toDateString() === d.toDateString()).length;
      dias.push({ dia: label, total });
    }
    return dias;
  }, [inscritos]);

  // ── Distribuição por categoria ──────────────────────────────────────────────
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    inscritos.forEach((i) => {
      if (!i.categoria) return;
      const label = CATEGORIA_LABELS[i.categoria];
      map[label] = (map[label] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [inscritos]);
  const totalPie = pieData.reduce((s, x) => s + x.value, 0);

  // ── Inscrições ordenadas (top 5 da ordenação atual) ─────────────────────────
  const inscricoesOrdenadas = useMemo(() => {
    const arr = [...inscritos];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortCol === "nome") {
        cmp = a.nome.localeCompare(b.nome, "pt-BR");
      } else if (sortCol === "createdAt") {
        cmp = +new Date(a.createdAt) - +new Date(b.createdAt);
      } else if (sortCol === "status") {
        cmp = STATUS_LABELS[a.status].localeCompare(STATUS_LABELS[b.status], "pt-BR");
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr.slice(0, 5);
  }, [inscritos, sortCol, sortDir]);

  const ultimosTrabalhos = useMemo(
    () => [...trabalhos].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5),
    [trabalhos],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#6b6b6b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#731111]" />
        <p className="text-sm">Carregando dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="font-semibold text-[#1a1a1a]">Não foi possível carregar o dashboard</p>
        <button onClick={() => { inscritosQ.refetch(); trabalhosQ.refetch(); }} className="mt-2 flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs — agora clicáveis, levam ao destino filtrado */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <Link
              key={k.label}
              to={k.to}
              search={k.search}
              className="group rounded-xl border border-[#d9d9d9] bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#731111]"
              style={{ borderLeft: `4px solid ${k.accent}` }}
            >
              <div className="flex items-start justify-between">
                <div className="text-[13px] font-medium text-[#6b6b6b]">{k.label}</div>
                <Icon className="h-5 w-5 text-[#6b6b6b]/60 transition-colors group-hover:text-[#731111]" />
              </div>
              <div className="mt-3 text-[36px] leading-none text-[#1a1a1a]" style={{ fontFamily: "Raleway, sans-serif", fontWeight: 700 }}>
                {k.value}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-[#6b6b6b]">{k.sub}</span>
                <span className="text-[11px] font-medium text-[#731111] opacity-0 transition-opacity group-hover:opacity-100">
                  Ver →
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[15px] font-semibold text-[#1a1a1a]">Inscrições por Dia</h2>
            <span className="text-[11px] text-[#6b6b6b]">Últimos 7 dias</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={inscricoesPorDia} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gWine" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#731111" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#731111" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f0eceb" vertical={false} />
                <XAxis dataKey="dia" tick={{ fill: "#6b6b6b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b6b6b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #d9d9d9", fontSize: 12 }} labelStyle={{ color: "#1a1a1a", fontWeight: 600 }} />
                <Area type="monotone" dataKey="total" stroke="#731111" strokeWidth={2.5} fill="url(#gWine)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#d9d9d9] bg-white p-6 lg:col-span-2">
          <h2 className="mb-1 text-[15px] font-semibold text-[#1a1a1a]">Distribuição por Categoria</h2>
          <p className="mb-4 text-[11px] text-[#6b6b6b]">Participantes por tipo</p>
          <div className="relative h-64">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[13px] text-[#6b6b6b]">Sem dados ainda.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" innerRadius={60} outerRadius={90} paddingAngle={2} stroke="#fff">
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={CATEGORIA_COLORS[entry.name] ?? "#9ca3af"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #d9d9d9", fontSize: 12 }} />
                    <Legend verticalAlign="bottom" iconType="circle" formatter={(v) => <span className="text-[11px] text-[#6b6b6b]">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute left-0 right-0 top-[40%] -translate-y-1/2 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-[#6b6b6b]">Total</div>
                  <div className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "Raleway" }}>{totalPie}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tables row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Inscrições — com cabeçalhos clicáveis */}
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-[#1a1a1a]">Inscrições</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
                  <SortHeader label="Nome" col="nome" active={sortCol} dir={sortDir} onClick={toggleSort} />
                  <th className="px-3 py-2.5">E-mail</th>
                  <SortHeader label="Data" col="createdAt" active={sortCol} dir={sortDir} onClick={toggleSort} />
                  <SortHeader label="Status" col="status" active={sortCol} dir={sortDir} onClick={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {inscricoesOrdenadas.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-10 text-center text-[13px] text-[#6b6b6b]">Nenhum registro ainda.</td></tr>
                ) : inscricoesOrdenadas.map((r: Inscrito) => (
                  <tr key={r.pedidoId} className="border-b border-[#f0eceb] last:border-0">
                    <td className="px-3 py-3 text-[13px] font-medium text-[#1a1a1a]">{r.nome}</td>
                    <td className="px-3 py-3 text-[13px] text-[#6b6b6b]">{r.email}</td>
                    <td className="px-3 py-3 text-[11px] text-[#6b6b6b]">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trabalhos */}
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-6">
          <h2 className="mb-4 text-[15px] font-semibold text-[#1a1a1a]">Últimos Trabalhos</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
                  <th className="px-3 py-2.5">Título</th>
                  <th className="px-3 py-2.5">Responsável</th>
                  <th className="px-3 py-2.5">Data</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {ultimosTrabalhos.length === 0 ? (
                  <tr><td colSpan={4} className="px-3 py-10 text-center text-[13px] text-[#6b6b6b]">Nenhum registro ainda.</td></tr>
                ) : ultimosTrabalhos.map((r) => (
                  <tr key={r.id} className="border-b border-[#f0eceb] last:border-0">
                    <td className="px-3 py-3 text-[13px]"><span className="line-clamp-1 font-medium text-[#1a1a1a]">{r.titulo}</span></td>
                    <td className="px-3 py-3 text-[13px] text-[#6b6b6b]">{r.responsavel}</td>
                    <td className="px-3 py-3 text-[11px] text-[#6b6b6b]">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</td>
                    <td className="px-3 py-3"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cabeçalho de coluna clicável com indicador de direção
function SortHeader({
  label, col, active, dir, onClick,
}: { label: string; col: SortCol; active: SortCol; dir: SortDir; onClick: (c: SortCol) => void }) {
  const isActive = active === col;
  return (
    <th className="px-3 py-2.5">
      <button
        onClick={() => onClick(col)}
        className={`inline-flex items-center gap-1 transition-colors hover:text-[#731111] ${isActive ? "text-[#731111]" : ""}`}
      >
        {label}
        {isActive
          ? (dir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)
          : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
      </button>
    </th>
  );
}