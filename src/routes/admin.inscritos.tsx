import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useMemo, useState } from "react";
import { Search, Download, Eye, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { inscritos, INGRESSO_LABELS, type Inscrito, type Status } from "@/data/mockAdmin";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inscritos")({
  head: () => ({ meta: [{ title: "Inscritos · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <InscritosPage />
    </AdminShell>
  ),
});

const STATUS_OPTS: (Status | "Todos")[] = ["Todos", "Confirmado", "Pendente", "Cancelado"];

function InscritosPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "Todos">("Todos");
  const [cupomFilter, setCupomFilter] = useState<"todos" | "com" | "sem">("todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<Inscrito | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(true);

  const filtered = useMemo(() => {
    return inscritos.filter((r) => {
      if (q) {
        const s = q.toLowerCase();
        if (!r.nome.toLowerCase().includes(s) && !r.email.toLowerCase().includes(s)) return false;
      }
      if (statusFilter !== "Todos" && r.status !== statusFilter) return false;
      if (cupomFilter === "com" && !r.cupom) return false;
      if (cupomFilter === "sem" && r.cupom) return false;
      if (from && new Date(r.dataInscricao) < new Date(from)) return false;
      if (to && new Date(r.dataInscricao) > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [q, statusFilter, cupomFilter, from, to]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const comCupom = filtered.filter((r) => r.cupom).length;
  const confirmados = filtered.filter((r) => r.status === "Confirmado").length;
  const byDay: Record<string, number> = {};
  filtered.forEach((r) => {
    const d = new Date(r.dataInscricao).toLocaleDateString("pt-BR");
    byDay[d] = (byDay[d] || 0) + 1;
  });
  const pico = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  function exportExcel() {
    toast.success("Exportação iniciada", { description: "O arquivo .xlsx será baixado em instantes." });
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl border border-[#d9d9d9] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[260px]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6b6b6b]" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Buscar por nome ou e-mail..."
                className="w-full rounded-md border border-[#d9d9d9] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#731111]"
              />
            </div>

            <div className="mt-4 space-y-2 text-[12px]">
              <ChipRow
                label="Status:"
                options={STATUS_OPTS.map((s) => ({ id: s, label: s }))}
                active={statusFilter}
                onChange={(v) => { setStatusFilter(v as Status | "Todos"); setPage(1); }}
              />
              <ChipRow
                label="Cupom:"
                options={[
                  { id: "todos", label: "Todos" },
                  { id: "com", label: "Com cupom" },
                  { id: "sem", label: "Sem cupom" },
                ]}
                active={cupomFilter}
                onChange={(v) => { setCupomFilter(v as typeof cupomFilter); setPage(1); }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[#6b6b6b]">Período:</span>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                  className="rounded-md border border-[#d9d9d9] bg-white px-2 py-1 text-[12px]" />
                <span className="text-[#6b6b6b]">→</span>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                  className="rounded-md border border-[#d9d9d9] bg-white px-2 py-1 text-[12px]" />
              </div>
            </div>
          </div>

          <button
            onClick={exportExcel}
            className="flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]"
          >
            <Download className="h-4 w-4" /> Exportar Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Ingresso</th>
                <th className="px-4 py-3">Cupom</th>
                <th className="px-4 py-3">Desconto</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-[#6b6b6b]">Nenhum inscrito encontrado.</td></tr>
              ) : pageRows.map((r, i) => (
                <tr key={r.id} className="border-t border-[#f0eceb] hover:bg-[#faf8f7]">
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{r.nome}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{r.email}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{r.telefone}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{r.whatsapp}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">
                    {new Date(r.dataInscricao).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    {r.cupom ? (
                      <code className="rounded bg-[#f3f0ee] px-2 py-0.5 font-mono text-[11px] text-[#731111]">{r.cupom}</code>
                    ) : <span className="text-[#6b6b6b]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                      <span className="rounded-full bg-[#f3f0ee] px-2 py-0.5 font-body text-[11px] font-medium text-[#731111]">
                        {INGRESSO_LABELS[r.tipoIngresso]}
                      </span>
                    </td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{r.descontoLabel}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(r)} className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f3f0ee] hover:text-[#731111]" aria-label="Ver">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#f0eceb] bg-[#faf8f7] px-4 py-3 text-[12px] text-[#6b6b6b]">
          <span>
            Mostrando {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–
            {Math.min(page * pageSize, filtered.length)} de {filtered.length} resultados
          </span>
          <div className="flex items-center gap-3">
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded border border-[#d9d9d9] bg-white px-2 py-1 text-[12px]"
            >
              {[10, 20, 50, 100].map((s) => <option key={s} value={s}>{s} por página</option>)}
            </select>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded p-1.5 disabled:opacity-40 hover:bg-[#f3f0ee]">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded p-1.5 disabled:opacity-40 hover:bg-[#f3f0ee]">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Análise */}
      <div className="rounded-xl border border-[#d9d9d9] bg-white">
        <button
          onClick={() => setAnalysisOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <span className="text-[14px] font-semibold text-[#1a1a1a]">Análise de Dados</span>
          <ChevronDown className={`h-4 w-4 text-[#6b6b6b] transition-transform ${analysisOpen ? "rotate-180" : ""}`} />
        </button>
        {analysisOpen && (
          <div className="grid gap-5 border-t border-[#f0eceb] px-5 py-5 sm:grid-cols-3">
            <Insight
              label="Inscritos com cupom"
              pct={filtered.length ? (comCupom / filtered.length) * 100 : 0}
              color="#731111"
              caption={`${comCupom} de ${filtered.length}`}
            />
            <Insight
              label="Taxa de confirmação"
              pct={filtered.length ? (confirmados / filtered.length) * 100 : 0}
              color="#2d7a3a"
              caption={`${confirmados} confirmados`}
            />
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">Pico de inscrições</div>
              <div className="mt-2 text-2xl font-bold text-[#1a1a1a]" style={{ fontFamily: "Raleway" }}>
                {pico}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      {selected && <DetailDrawer item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function ChipRow<T extends string>({
  label, options, active, onChange,
}: { label: string; options: { id: T; label: string }[]; active: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[#6b6b6b]">{label}</span>
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
            active === o.id
              ? "border-[#731111] bg-[#731111] text-white"
              : "border-[#d9d9d9] bg-white text-[#6b6b6b] hover:border-[#b5736f]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Insight({ label, pct, color, caption }: { label: string; pct: number; color: string; caption: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">{label}</div>
        <div className="text-sm font-bold text-[#1a1a1a]" style={{ fontFamily: "Raleway" }}>
          {pct.toFixed(1)}%
        </div>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#f3f0ee]">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mt-1 text-[11px] text-[#6b6b6b]">{caption}</div>
    </div>
  );
}

function DetailDrawer({ item, onClose }: { item: Inscrito; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#f0eceb] p-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">Inscrito</div>
            <div className="mt-1 text-lg font-semibold text-[#1a1a1a]">{item.nome}</div>
            <div className="mt-2"><StatusBadge status={item.status} /></div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#6b6b6b] hover:bg-[#f3f0ee]">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <Section title="Dados Pessoais">
            <KV k="E-mail" v={item.email} />
            <KV k="Telefone" v={item.telefone} />
            <KV k="WhatsApp" v={item.whatsapp} />
          </Section>
          <Section title="Inscrição">
            <KV k="Data" v={new Date(item.dataInscricao).toLocaleString("pt-BR")} />
            <KV k="Cupom" v={item.cupom ?? "—"} />
            <KV k="Categoria do cupom" v={item.cupomCategoria ?? "—"} />
            <KV k="Desconto aplicado" v={item.descontoLabel} />
          </Section>
          <Section title="Pagamento">
            <KV k="Valor pago" v={`R$ ${item.valorPago.toFixed(2).replace(".", ",")}`} />
            <KV k="Status" v={item.status} />
          </Section>
        </div>
        <footer className="border-t border-[#f0eceb] p-4">
          <button onClick={onClose} className="w-full rounded-md border border-[#d9d9d9] py-2 text-sm font-medium text-[#1a1a1a] hover:bg-[#faf8f7]">
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#731111]">{title}</div>
      <div className="space-y-1.5 rounded-lg border border-[#f0eceb] bg-[#faf8f7] p-3">{children}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 text-[13px]">
      <span className="text-[#6b6b6b]">{k}</span>
      <span className="text-right font-medium text-[#1a1a1a]">{v}</span>
    </div>
  );
}
