import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Users, CreditCard, FileText, Ticket, ArrowUp,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  inscritos, trabalhos, inscricoesPorDia, distribuicaoCupons, COUPON_COLORS, INGRESSO_LABELS,
} from "@/data/mockAdmin";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  ),
});

const KPIS = [
  { label: "Total de Inscritos", value: 247, accent: "#731111", icon: Users, trend: "+12 desde ontem" },
  { label: "Pagamentos Confirmados", value: 198, accent: "#2d7a3a", icon: CreditCard, trend: "+8 desde ontem" },
  { label: "Trabalhos Submetidos", value: 43, accent: "#C9A84C", icon: FileText, trend: "+3 desde ontem" },
  { label: "Vagas Disponíveis", value: 53, accent: "#b5736f", icon: Ticket, trend: "de 300 totais" },
];

function Dashboard() {
  const pieData = Object.entries(distribuicaoCupons).map(([k, v]) => ({ name: k, value: v }));
  const totalRegistrants = pieData.reduce((s, x) => s + x.value, 0);

  // Distribuição por tipo de ingresso
  const ingressoData = (["palestra", "dia", "completo"] as const).map((tipo) => ({
    name: INGRESSO_LABELS[tipo],
    value: inscritos.filter((i) => i.tipoIngresso === tipo).length,
  }));
  const INGRESSO_COLORS: Record<string, string> = {
    "Palestra Avulsa": "#b5736f",
    "1 Dia do Congresso": "#C9A84C",
    "3 Dias Completos": "#731111",
  };

  const ultimasInscricoes = [...inscritos]
    .sort((a, b) => +new Date(b.dataInscricao) - +new Date(a.dataInscricao))
    .slice(0, 5);
  const ultimosTrabalhos = [...trabalhos]
    .sort((a, b) => +new Date(b.dataSubmissao) - +new Date(a.dataSubmissao))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-xl border border-[#d9d9d9] bg-white p-6"
              style={{ borderLeft: `4px solid ${k.accent}` }}
            >
              <div className="flex items-start justify-between">
                <div className="text-[13px] font-medium text-[#6b6b6b]">{k.label}</div>
                <Icon className="h-5 w-5 text-[#6b6b6b]/60" />
              </div>
              <div
                className="mt-3 text-[36px] leading-none text-[#1a1a1a]"
                style={{ fontFamily: "Raleway, sans-serif", fontWeight: 700 }}
              >
                {k.value}
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-[#2d7a3a]">
                <ArrowUp className="h-3 w-3" />
                {k.trend}
              </div>
            </div>
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
                <YAxis tick={{ fill: "#6b6b6b", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #d9d9d9", fontSize: 12 }}
                  labelStyle={{ color: "#1a1a1a", fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="total" stroke="#731111" strokeWidth={2.5} fill="url(#gWine)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-[#d9d9d9] bg-white p-6 lg:col-span-2">
          <h2 className="mb-1 text-[15px] font-semibold text-[#1a1a1a]">
            Distribuição por Categoria de Cupom
          </h2>
          <p className="mb-4 text-[11px] text-[#6b6b6b]">e por tipo de ingresso</p>
          <div className="relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="#fff"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COUPON_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #d9d9d9", fontSize: 12 }} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  formatter={(v) => <span className="text-[11px] text-[#6b6b6b]">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute left-0 right-0 top-[40%] -translate-y-1/2 text-center">
              <div className="text-[10px] uppercase tracking-wider text-[#6b6b6b]">Total</div>
              <div className="text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "Raleway" }}>
                {totalRegistrants}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <MiniTable
          title="Últimas Inscrições"
          headers={["Nome", "E-mail", "Data", "Status"]}
          rows={ultimasInscricoes.map((r) => [
            <span key="n" className="font-medium text-[#1a1a1a]">{r.nome}</span>,
            <span key="e" className="text-[#6b6b6b]">{r.email}</span>,
            <span key="d" className="text-[11px] text-[#6b6b6b]">
              {new Date(r.dataInscricao).toLocaleDateString("pt-BR")}
            </span>,
            <StatusBadge key="s" status={r.status} />,
          ])}
        />
        <MiniTable
          title="Últimos Trabalhos"
          headers={["Título", "Responsável", "Data", "Arquivo"]}
          rows={ultimosTrabalhos.map((r) => [
            <span key="t" className="line-clamp-1 font-medium text-[#1a1a1a]">{r.titulo}</span>,
            <span key="r" className="text-[#6b6b6b]">{r.responsavel}</span>,
            <span key="d" className="text-[11px] text-[#6b6b6b]">
              {new Date(r.dataSubmissao).toLocaleDateString("pt-BR")}
            </span>,
            <StatusBadge key="a" status={r.arquivo ? "Arquivo Anexado" : "Sem Arquivo"} />,
          ])}
        />
      </div>
    </div>
  );
}

function MiniTable({
  title, headers, rows,
}: { title: string; headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="rounded-xl border border-[#d9d9d9] bg-white p-6">
      <h2 className="mb-4 text-[15px] font-semibold text-[#1a1a1a]">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
              {headers.map((h) => <th key={h} className="px-3 py-2.5">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-[#f0eceb] last:border-0">
                {r.map((c, j) => <td key={j} className="px-3 py-3 text-[13px]">{c}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
