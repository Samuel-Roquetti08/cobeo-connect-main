import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useMemo, useState } from "react";
import { Plus, Search, Eye, Trash2, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useCupons, useCreateCupom, useDeleteCupom } from "@/lib/api/adminHooks";
import {
  type Cupom, type CupomCategoria, type CupomStatus,
  CUPOM_CATEGORIA_LABELS,
} from "@/lib/api/adminTypes";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <CuponsPage />
    </AdminShell>
  ),
});

// Pílulas de cor por categoria (chave = enum do banco)
const COUPON_PILL: Record<CupomCategoria, string> = {
  aluno_interno: "bg-[#dbeafe] text-[#1e40af]",
  servidor_publico: "bg-[#f3e8ff] text-[#7e22ce]",
  aluno_externo: "bg-[#ccfbf1] text-[#0f766e]",
  publico_geral: "bg-[#f3f4f6] text-[#4b5563]",
};

const CAT_BAR_COLOR: Record<CupomCategoria, string> = {
  aluno_interno: "#3b82f6",
  servidor_publico: "#9333ea",
  aluno_externo: "#0d9488",
  publico_geral: "#9ca3af",
};

const CAT_OPTS: (CupomCategoria | "todos")[] = [
  "todos", "aluno_interno", "servidor_publico", "aluno_externo", "publico_geral",
];

const STATUS_OPTS: (CupomStatus | "todos")[] = ["todos", "disponivel", "utilizado"];

const STATUS_LABEL: Record<CupomStatus, string> = {
  disponivel: "Disponível",
  utilizado: "Utilizado",
  expirado: "Expirado",
};

function CuponsPage() {
  const { data: cupons, isLoading, isError, error, refetch } = useCupons();
  const createCupom = useCreateCupom();
  const deleteCupom = useDeleteCupom();

  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState<CupomCategoria | "todos">("todos");
  const [statusFilter, setStatusFilter] = useState<CupomStatus | "todos">("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<Cupom | null>(null);
  const [confirmDel, setConfirmDel] = useState<Cupom | null>(null);

  const list = cupons ?? [];

  const filtered = useMemo(() => list.filter((c) => {
    if (q && !c.codigo.toLowerCase().includes(q.toLowerCase()) && !c.titular.toLowerCase().includes(q.toLowerCase())) return false;
    if (catFilter !== "todos" && c.categoria !== catFilter) return false;
    if (statusFilter !== "todos" && c.status !== statusFilter) return false;
    return true;
  }), [list, q, catFilter, statusFilter]);

  const total = list.length;
  const disponiveis = list.filter((c) => c.status === "disponivel").length;
  const utilizados = list.filter((c) => c.status === "utilizado").length;
  // Economia estimada: cupons fixos contam o valor; percentuais estimam sobre um curso médio (R$40)
  const economia = list
    .filter((c) => c.status === "utilizado")
    .reduce((s, c) => s + (c.tipo === "fixo" ? c.valor : 40 * c.valor / 100), 0);

  const porCategoria = (["aluno_interno", "servidor_publico", "aluno_externo", "publico_geral"] as CupomCategoria[])
    .map((cat) => ({ cat, count: list.filter((c) => c.categoria === cat).length }));
  const maxCount = Math.max(...porCategoria.map((p) => p.count), 1);

  function handleCreate(input: {
    codigo: string; titular: string; categoria: CupomCategoria;
    tipo: "fixo" | "percentual"; valor: number;
  }) {
    createCupom.mutate(input, {
      onSuccess: (c) => {
        toast.success("Cupom criado", { description: `${c.codigo} — ${c.titular}` });
        setModalOpen(false);
      },
      onError: (e) => {
        const msg = (e as Error)?.message ?? "";
        if (msg.includes("duplicate") || msg.includes("unique")) {
          toast.error("Código já existe", { description: "Escolha outro código de cupom." });
        } else {
          toast.error("Erro ao criar cupom", { description: msg });
        }
      },
    });
  }

  function handleDelete(id: string) {
    deleteCupom.mutate(id, {
      onSuccess: () => { toast.success("Cupom removido"); setConfirmDel(null); },
      onError: (e) => toast.error("Erro ao remover", { description: (e as Error)?.message }),
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#6b6b6b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#731111]" />
        <p className="text-sm">Carregando cupons...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="font-semibold text-[#1a1a1a]">Não foi possível carregar os cupons</p>
        <p className="max-w-md text-[13px] text-[#6b6b6b]">{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="mt-2 flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* LEFT — table */}
      <div className="space-y-4">
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]"
            >
              <Plus className="h-4 w-4" /> Novo Cupom
            </button>
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6b6b6b]" />
              <input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar código ou titular..."
                className="w-full rounded-md border border-[#d9d9d9] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#731111]"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-[12px]">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#6b6b6b]">Categoria:</span>
              {CAT_OPTS.map((c) => (
                <Chip key={c} active={catFilter === c} onClick={() => setCatFilter(c)}>
                  {c === "todos" ? "Todos" : CUPOM_CATEGORIA_LABELS[c]}
                </Chip>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[#6b6b6b]">Status:</span>
              {STATUS_OPTS.map((s) => (
                <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {s === "todos" ? "Todos" : STATUS_LABEL[s]}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Titular</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Usado Em</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} className="border-t border-[#f0eceb] hover:bg-[#faf8f7]">
                    <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{i + 1}</td>
                    <td className="px-4 py-3">
                      <code className={`rounded bg-[#f3f0ee] px-2 py-0.5 font-mono text-[11px] text-[#731111] ${c.status === "utilizado" ? "line-through opacity-60" : ""}`}>
                        {c.codigo}
                      </code>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">{c.titular}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${COUPON_PILL[c.categoria]}`}>
                        {CUPOM_CATEGORIA_LABELS[c.categoria]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{c.tipo === "fixo" ? "R$ Fixo" : "Percentual"}</td>
                    <td className="px-4 py-3 font-medium text-[#1a1a1a]">
                      {c.tipo === "fixo" ? `R$ ${c.valor.toFixed(2).replace(".", ",")}` : `${c.valor}%`}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${c.status === "disponivel" ? "bg-[#dcfce7] text-[#166534]" : "bg-[#f3f4f6] text-[#6b7280]"}`}>
                        {STATUS_LABEL[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">
                      {c.usadoEm ? new Date(c.usadoEm).toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setViewing(c)} className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f3f0ee] hover:text-[#731111]">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDel(c)} className="rounded p-1.5 text-[#6b6b6b] hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-[#6b6b6b]">Nenhum cupom encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT — stats */}
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-5">
          <h2 className="text-[15px] font-semibold text-[#1a1a1a]">Resumo dos Cupons</h2>
          <dl className="mt-4 space-y-3 text-[13px]">
            <Stat label="Total gerados" value={total.toString()} />
            <Stat label="Disponíveis" value={disponiveis.toString()} color="#166534" />
            <Stat label="Utilizados" value={utilizados.toString()} color="#6b7280" />
            <Stat label="Economia gerada" value={`R$ ${economia.toFixed(2).replace(".", ",")}`} color="#731111" />
          </dl>
          <div className="my-5 h-px bg-[#f0eceb]" />
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b]">Por categoria</div>
          <div className="mt-3 space-y-2.5">
            {porCategoria.map(({ cat, count }) => (
              <div key={cat}>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#1a1a1a]">{CUPOM_CATEGORIA_LABELS[cat]}</span>
                  <span className="font-medium text-[#6b6b6b]">{count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#f3f0ee]">
                  <div className="h-full rounded-full" style={{ width: `${(count / maxCount) * 100}%`, background: CAT_BAR_COLOR[cat] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {modalOpen && <CreateModal onClose={() => setModalOpen(false)} onCreate={handleCreate} submitting={createCupom.isPending} />}
      {viewing && <ViewModal cupom={viewing} onClose={() => setViewing(null)} />}
      {confirmDel && (
        <ConfirmModal
          title="Remover cupom"
          message={`Tem certeza que deseja remover o cupom ${confirmDel.codigo}?`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => handleDelete(confirmDel.id)}
          loading={deleteCupom.isPending}
        />
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-2.5 py-0.5 text-[11px] transition-colors ${
        active ? "border-[#731111] bg-[#731111] text-white" : "border-[#d9d9d9] bg-white text-[#6b6b6b] hover:border-[#b5736f]"
      }`}>
      {children}
    </button>
  );
}

function Stat({ label, value, color = "#1a1a1a" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-[#6b6b6b]">{label}</dt>
      <dd className="text-lg font-bold" style={{ color, fontFamily: "Raleway" }}>{value}</dd>
    </div>
  );
}

function ModalShell({ children, onClose, maxWidth = 480 }: { children: React.ReactNode; onClose: () => void; maxWidth?: number }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full overflow-hidden rounded-xl bg-white shadow-2xl" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreate, submitting }: {
  onClose: () => void;
  onCreate: (c: { codigo: string; titular: string; categoria: CupomCategoria; tipo: "fixo" | "percentual"; valor: number }) => void;
  submitting: boolean;
}) {
  const [codigo, setCodigo] = useState("");
  const [titular, setTitular] = useState("");
  const [categoria, setCategoria] = useState<CupomCategoria>("aluno_interno");
  const [tipo, setTipo] = useState<"fixo" | "percentual">("fixo");
  const [valor, setValor] = useState<number>(50);

  function gerarCodigo() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let r = "";
    for (let i = 0; i < 8; i++) r += chars[Math.floor(Math.random() * chars.length)];
    setCodigo(r);
  }

  function submit() {
    if (!codigo.trim() || !titular.trim()) {
      toast.error("Preencha código e titular");
      return;
    }
    onCreate({
      codigo: codigo.trim().toUpperCase(),
      titular: titular.trim(),
      categoria,
      tipo,
      valor: Math.max(1, Math.min(tipo === "percentual" ? 100 : 99999, valor || 0)),
    });
  }

  const valorLabel = tipo === "percentual" ? `${valor}%` : `R$ ${(valor || 0).toFixed(2).replace(".", ",")}`;

  return (
    <ModalShell onClose={onClose}>
      <header className="flex items-center justify-between border-b border-[#f0eceb] px-6 py-4">
        <h2 className="text-[20px] font-semibold text-[#1a1a1a]">Gerar Novo Cupom</h2>
        <button onClick={onClose} className="rounded p-1 text-[#6b6b6b] hover:bg-[#f3f0ee]"><X className="h-5 w-5" /></button>
      </header>
      <div className="space-y-4 p-6">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#6b6b6b]">Código do Cupom *</label>
          <input
            value={codigo} onChange={(e) => setCodigo(e.target.value)}
            className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 font-mono text-sm uppercase outline-none focus:border-[#731111]"
            placeholder="EX: COBEO2025"
          />
          <button onClick={gerarCodigo} type="button" className="mt-1 text-[11px] text-[#731111] hover:underline">
            Gerar automaticamente
          </button>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#6b6b6b]">Titular *</label>
          <input
            value={titular} onChange={(e) => setTitular(e.target.value)}
            className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm outline-none focus:border-[#731111]"
            placeholder="Nome de quem receberá o cupom"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#6b6b6b]">Categoria</label>
          <select
            value={categoria} onChange={(e) => setCategoria(e.target.value as CupomCategoria)}
            className="w-full rounded-md border border-[#d9d9d9] px-3 py-2 text-sm outline-none focus:border-[#731111]"
          >
            {(["aluno_interno", "servidor_publico", "aluno_externo", "publico_geral"] as CupomCategoria[]).map((c) => (
              <option key={c} value={c}>{CUPOM_CATEGORIA_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#6b6b6b]">Tipo de Desconto</label>
          <div className="flex rounded-md border border-[#d9d9d9] p-0.5">
            {(["fixo", "percentual"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 rounded px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  tipo === t ? "bg-[#731111] text-white" : "text-[#6b6b6b] hover:bg-[#f3f0ee]"
                }`}
              >
                {t === "fixo" ? "R$ Valor Fixo" : "% Percentual"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#6b6b6b]">Valor</label>
          <div className="relative">
            {tipo === "fixo" && <span className="absolute left-3 top-2 text-sm text-[#6b6b6b]">R$</span>}
            <input
              type="number"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              max={tipo === "percentual" ? 100 : undefined}
              min={1}
              className={`w-full rounded-md border border-[#d9d9d9] py-2 text-sm outline-none focus:border-[#731111] ${tipo === "fixo" ? "pl-10 pr-3" : "px-3"}`}
            />
            {tipo === "percentual" && <span className="absolute right-3 top-2 text-sm text-[#6b6b6b]">%</span>}
          </div>
        </div>
        <div className="rounded-lg bg-[#f9f6f4] p-4 text-[12px] text-[#1a1a1a]">
          Cupom <strong>{codigo || "[CÓDIGO]"}</strong> — {titular || "[NOME]"} ({CUPOM_CATEGORIA_LABELS[categoria]}) — Desconto de <strong>{valorLabel}</strong>
        </div>
      </div>
      <footer className="flex justify-end gap-2 border-t border-[#f0eceb] px-6 py-4">
        <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-[#6b6b6b] hover:bg-[#f3f0ee]">Cancelar</button>
        <button
          onClick={submit}
          disabled={submitting}
          className="flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8a1515] disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar Cupom
        </button>
      </footer>
    </ModalShell>
  );
}

function ViewModal({ cupom, onClose }: { cupom: Cupom; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <header className="flex items-center justify-between border-b border-[#f0eceb] px-6 py-4">
        <h2 className="text-[18px] font-semibold text-[#1a1a1a]">Detalhes do Cupom</h2>
        <button onClick={onClose} className="rounded p-1 text-[#6b6b6b] hover:bg-[#f3f0ee]"><X className="h-5 w-5" /></button>
      </header>
      <div className="space-y-2 p-6 text-[13px]">
        <KV k="Código" v={cupom.codigo} />
        <KV k="Titular" v={cupom.titular} />
        <KV k="Categoria" v={CUPOM_CATEGORIA_LABELS[cupom.categoria]} />
        <KV k="Tipo" v={cupom.tipo === "fixo" ? "R$ Fixo" : "Percentual"} />
        <KV k="Valor" v={cupom.tipo === "fixo" ? `R$ ${cupom.valor.toFixed(2).replace(".", ",")}` : `${cupom.valor}%`} />
        <KV k="Status" v={STATUS_LABEL[cupom.status]} />
        <KV k="Criado em" v={new Date(cupom.createdAt).toLocaleString("pt-BR")} />
        <KV k="Usado em" v={cupom.usadoEm ? new Date(cupom.usadoEm).toLocaleString("pt-BR") : "—"} />
      </div>
    </ModalShell>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-[#f0eceb] py-1.5">
      <span className="text-[#6b6b6b]">{k}</span>
      <span className="font-medium text-[#1a1a1a]">{v}</span>
    </div>
  );
}

function ConfirmModal({ title, message, onCancel, onConfirm, loading }: {
  title: string; message: string; onCancel: () => void; onConfirm: () => void; loading: boolean;
}) {
  return (
    <ModalShell onClose={onCancel} maxWidth={400}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-[#1a1a1a]">{title}</h3>
        <p className="mt-2 text-sm text-[#6b6b6b]">{message}</p>
      </div>
      <footer className="flex justify-end gap-2 border-t border-[#f0eceb] px-6 py-4">
        <button onClick={onCancel} className="rounded-md px-4 py-2 text-sm font-medium text-[#6b6b6b] hover:bg-[#f3f0ee]">Cancelar</button>
        <button onClick={onConfirm} disabled={loading} className="flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Remover
        </button>
      </footer>
    </ModalShell>
  );
}