import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useMemo, useState } from "react";
import {
  Search, Download, Eye, ChevronDown, ChevronLeft, ChevronRight, X, Loader2,
  AlertCircle, RefreshCw,
} from "lucide-react";
import { useInscritos } from "@/lib/api/adminHooks";
import {
  type Inscrito, type StatusPagamento,
  STATUS_LABELS, CATEGORIA_LABELS, JANTAR_LABELS,
} from "@/lib/api/adminTypes";
import { toast } from "sonner";

// Search params que o dashboard usa para abrir esta página já filtrada.
// Ex.: /admin/inscritos?status=pago  ou  /admin/inscritos?jantar=com
interface InscritosSearch {
  status?: StatusPagamento;
  jantar?: "com" | "sem";
  cupom?: "com" | "sem";
}

const VALID_STATUS: StatusPagamento[] = ["pago", "pendente", "cancelado", "reembolsado", "expirado"];

export const Route = createFileRoute("/admin/inscritos")({
  head: () => ({ meta: [{ title: "Inscritos · Admin · II COBEO" }] }),
  validateSearch: (search: Record<string, unknown>): InscritosSearch => {
    const out: InscritosSearch = {};
    if (typeof search.status === "string" && VALID_STATUS.includes(search.status as StatusPagamento)) {
      out.status = search.status as StatusPagamento;
    }
    if (search.jantar === "com" || search.jantar === "sem") out.jantar = search.jantar;
    if (search.cupom === "com" || search.cupom === "sem") out.cupom = search.cupom;
    return out;
  },
  component: () => (
    <AdminShell>
      <InscritosPage />
    </AdminShell>
  ),
});

const STATUS_OPTS: (StatusPagamento | "Todos")[] = [
  "Todos", "pago", "pendente", "cancelado", "reembolsado", "expirado",
];

function InscritosPage() {
  const search = useSearch({ from: "/admin/inscritos" });
  const { data: inscritos, isLoading, isError, error, refetch } = useInscritos();


  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusPagamento | "Todos">(search.status ?? "Todos");
  const [cupomFilter, setCupomFilter] = useState<"todos" | "com" | "sem">(search.cupom ?? "todos");
  const [jantarFilter, setJantarFilter] = useState<"todos" | "com" | "sem">(search.jantar ?? "todos");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selected, setSelected] = useState<Inscrito | null>(null);
  const [analysisOpen, setAnalysisOpen] = useState(true);

  const all = inscritos ?? [];

  const filtered = useMemo(() => {
    return all.filter((r) => {
      if (q) {
        const s = q.toLowerCase();
        if (!r.nome.toLowerCase().includes(s) && !r.email.toLowerCase().includes(s)) return false;
      }
      if (statusFilter !== "Todos" && r.status !== statusFilter) return false;
      if (cupomFilter === "com" && !r.cupomCodigo) return false;
      if (cupomFilter === "sem" && r.cupomCodigo) return false;
      if (jantarFilter === "com" && !r.jantarOpcao) return false;
      if (jantarFilter === "sem" && r.jantarOpcao) return false;
      if (from && new Date(r.createdAt) < new Date(from)) return false;
      if (to && new Date(r.createdAt) > new Date(to + "T23:59:59")) return false;
      return true;
    });
  }, [all, q, statusFilter, cupomFilter, jantarFilter, from, to]);


  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const comCupom = filtered.filter((r) => r.cupomCodigo).length;
  const confirmados = filtered.filter((r) => r.status === "pago").length;
  const byDay: Record<string, number> = {};
  filtered.forEach((r) => {
    const d = new Date(r.createdAt).toLocaleDateString("pt-BR");
    byDay[d] = (byDay[d] || 0) + 1;
  });
  const pico = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  async function exportExcel() {
    if (filtered.length === 0) {
      toast.error("Nada para exportar com os filtros atuais.");
      return;
    }
    try {
      // import dinâmico — só carrega o SheetJS quando o admin clica em exportar
      const XLSX = await import("xlsx");
      const rows = filtered.map((r) => ({
        "Código": r.codigoInscricao ?? "—",
        "Nome": r.nome,
        "E-mail": r.email,
        "Telefone": r.telefone,
        "WhatsApp": r.whatsapp,
        "Categoria": r.categoria ? CATEGORIA_LABELS[r.categoria] : "—",
        "Cursos": r.cursos.map((c) => c.curso_titulo).join(" | "),
        "Qtd. Cursos": r.cursos.length,
        "Jantar": r.jantarOpcao ? JANTAR_LABELS[r.jantarOpcao] : "—",
        "Cupom": r.cupomCodigo ?? "—",
        "Desconto": r.descontoCupom,
        "Valor Total": r.valorTotal,
        "Status": STATUS_LABELS[r.status],
        "Pagamento": r.metodoPagamento ?? "—",
        "Data": new Date(r.createdAt).toLocaleString("pt-BR"),
        "Presença": r.presenca ? "Sim" : "Não",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inscritos");
      XLSX.writeFile(wb, `cobeo-inscritos-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Exportação concluída", { description: `${filtered.length} inscritos exportados.` });
    } catch (e) {
      toast.error("Erro ao exportar", { description: "Verifique se a biblioteca xlsx está instalada." });
      console.error(e);
    }
  }

  // ── Estados de carregamento e erro ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#6b6b6b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#731111]" />
        <p className="text-sm">Carregando inscritos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="font-semibold text-[#1a1a1a]">Não foi possível carregar os inscritos</p>
        <p className="max-w-md text-[13px] text-[#6b6b6b]">
          {(error as Error)?.message ?? "Erro desconhecido ao consultar o banco."}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-2 flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]"
        >
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
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
                options={STATUS_OPTS.map((s) => ({ id: s, label: s === "Todos" ? "Todos" : STATUS_LABELS[s as StatusPagamento] }))}
                active={statusFilter}
                onChange={(v) => { setStatusFilter(v as StatusPagamento | "Todos"); setPage(1); }}
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
              <ChipRow
                label="Jantar:"
                options={[
                  { id: "todos", label: "Todos" },
                  { id: "com", label: "Com jantar" },
                  { id: "sem", label: "Sem jantar" },
                ]}
                active={jantarFilter}
                onChange={(v) => { setJantarFilter(v as typeof jantarFilter); setPage(1); }}
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
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Cursos</th>
                <th className="px-4 py-3">Jantar</th>
                <th className="px-4 py-3">Cupom</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-16 text-center text-[#6b6b6b]">Nenhum inscrito encontrado.</td></tr>
              ) : pageRows.map((r, i) => (
                <tr key={r.pedidoId} className="border-t border-[#f0eceb] hover:bg-[#faf8f7]">
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-4 py-3">
                    {r.codigoInscricao
                      ? <code className="rounded bg-[#f3f0ee] px-2 py-0.5 font-mono text-[11px] text-[#731111]">{r.codigoInscricao}</code>
                      : <span className="text-[#6b6b6b]">—</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{r.nome}</td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{r.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#f3f0ee] px-2 py-0.5 text-[11px] font-medium text-[#731111]">
                      {r.categoria ? CATEGORIA_LABELS[r.categoria] : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-[#1a1a1a]">{r.cursos.length}</span>
                    <span className="text-[11px] text-[#6b6b6b]"> curso{r.cursos.length !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-4 py-3 text-[12px]">
                    {r.jantarOpcao
                      ? <span className="text-[#731111]">{r.jantarOpcao === "com_restricao" ? "Com restr." : "Sem restr."}</span>
                      : <span className="text-[#6b6b6b]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {r.cupomCodigo
                      ? <code className="rounded bg-[#f3f0ee] px-2 py-0.5 font-mono text-[11px] text-[#731111]">{r.cupomCodigo}</code>
                      : <span className="text-[#6b6b6b]">—</span>}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                    R$ {r.valorTotal.toFixed(2).replace(".", ",")}
                  </td>
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
            <KV k="Categoria" v={item.categoria ? CATEGORIA_LABELS[item.categoria] : "—"} />
            <KV k="Código" v={item.codigoInscricao ?? "—"} />
          </Section>
          <Section title={`Cursos (${item.cursos.length})`}>
            {item.cursos.length === 0
              ? <div className="text-[12px] text-[#6b6b6b]">Nenhum curso.</div>
              : <ul className="space-y-1.5 text-[13px] text-[#1a1a1a]">
                  {item.cursos.map((c) => (
                    <li key={c.id} className="flex justify-between gap-3">
                      <span>· {c.curso_titulo}</span>
                      <span className="shrink-0 text-[#6b6b6b]">R$ {c.valor.toFixed(2).replace(".", ",")}</span>
                    </li>
                  ))}
                </ul>}
          </Section>
          {item.jantarOpcao && (
            <Section title="Jantar de Encerramento">
              <KV k="Opção" v={JANTAR_LABELS[item.jantarOpcao]} />
              <KV k="Valor" v={`R$ ${item.valorJantar.toFixed(2).replace(".", ",")}`} />
            </Section>
          )}
          <Section title="Pagamento">
            <KV k="Cursos" v={`R$ ${item.valorCursos.toFixed(2).replace(".", ",")}`} />
            {item.valorJantar > 0 && <KV k="Jantar" v={`R$ ${item.valorJantar.toFixed(2).replace(".", ",")}`} />}
            {item.valorTrabalho > 0 && <KV k="Trabalho" v={`R$ ${item.valorTrabalho.toFixed(2).replace(".", ",")}`} />}
            {item.descontoCupom > 0 && <KV k="Desconto cupom" v={`- R$ ${item.descontoCupom.toFixed(2).replace(".", ",")}`} />}
            <KV k="Total" v={`R$ ${item.valorTotal.toFixed(2).replace(".", ",")}`} />
            <KV k="Método" v={item.metodoPagamento ?? "—"} />
            <KV k="Status" v={STATUS_LABELS[item.status]} />
            <KV k="Pago em" v={item.pagoEm ? new Date(item.pagoEm).toLocaleString("pt-BR") : "—"} />
          </Section>
          <Section title="Presença">
            <KV k="Check-in" v={item.presenca ? "Sim" : "Não"} />
            <KV k="Primeiro check-in" v={item.primeiroCheckinEm ? new Date(item.primeiroCheckinEm).toLocaleString("pt-BR") : "—"} />
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