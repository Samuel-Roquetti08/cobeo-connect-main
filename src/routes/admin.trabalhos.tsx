import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useMemo, useState } from "react";
import { Search, Download, Eye, X, Paperclip, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useTrabalhos } from "@/lib/api/adminHooks";
import { getTrabalhoDownloadUrl } from "@/lib/api/adminData";
import { normalizarBusca } from "@/lib/utils";
import { type Trabalho, type StatusPagamento, STATUS_LABELS } from "@/lib/api/adminTypes";
import { FORMATO_TRABALHO_LABELS } from "@/data/event";
import { toast } from "sonner";

// O banco grava o formato como "Pôster" (valor interno — ver event.ts); o
// rótulo exibido ao admin acompanha o que o site já mostra ao participante.
function formatoLabel(formato: string): string {
  return (FORMATO_TRABALHO_LABELS as Record<string, string>)[formato] ?? formato;
}

export const Route = createFileRoute("/admin/trabalhos")({
  head: () => ({ meta: [{ title: "Trabalhos · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <TrabalhosPage />
    </AdminShell>
  ),
});

const STATUS_OPTS: (StatusPagamento | "Todos")[] = ["Todos", "pago", "pendente", "cancelado"];

// Baixa o PDF do trabalho gerando uma URL assinada temporária (bucket privado)
async function baixarArquivo(t: Trabalho) {
  if (!t.arquivoPath) {
    toast.error("Este trabalho não tem arquivo anexado.");
    return;
  }
  try {
    const url = await getTrabalhoDownloadUrl(t.arquivoPath);
    window.open(url, "_blank");
  } catch (e) {
    toast.error("Erro ao gerar link de download", { description: (e as Error)?.message });
  }
}

function TrabalhosPage() {
  const { data: trabalhos, isLoading, isError, error, refetch } = useTrabalhos();

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusPagamento | "Todos">("Todos");
  const [arquivoFilter, setArquivoFilter] = useState<"todos" | "com" | "sem">("todos");
  const [selected, setSelected] = useState<Trabalho | null>(null);
  const [hoverCoautores, setHoverCoautores] = useState<string | null>(null);

  const all = trabalhos ?? [];

  const filtered = useMemo(() => {
    return all.filter((t) => {
      if (q) {
        const s = normalizarBusca(q);
        if (!normalizarBusca(t.titulo).includes(s) && !normalizarBusca(t.responsavel).includes(s)) return false;
      }
      if (statusFilter !== "Todos" && t.status !== statusFilter) return false;
      if (arquivoFilter === "com" && !t.arquivoPath) return false;
      if (arquivoFilter === "sem" && t.arquivoPath) return false;
      return true;
    });
  }, [all, q, statusFilter, arquivoFilter]);

  async function exportExcel() {
    if (filtered.length === 0) {
      toast.error("Nada para exportar com os filtros atuais.");
      return;
    }
    try {
      const XLSX = await import("xlsx");
      const rows = filtered.map((t) => ({
        "Título": t.titulo,
        "Responsável": t.responsavel,
        "E-mail": t.responsavelEmail,
        "Categoria": t.categoria,
        "Modalidade": t.modalidade,
        "Formato": formatoLabel(t.formato),
        "Coautores": t.coautores.join(" | "),
        "Arquivo": t.arquivoNome ?? "—",
        "Status": STATUS_LABELS[t.status],
        "Data": new Date(t.createdAt).toLocaleString("pt-BR"),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Trabalhos");
      XLSX.writeFile(wb, `cobeo-trabalhos-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Exportação concluída", { description: `${filtered.length} trabalhos exportados.` });
    } catch (e) {
      toast.error("Erro ao exportar", { description: "Verifique se a biblioteca xlsx está instalada." });
      console.error(e);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#6b6b6b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#731111]" />
        <p className="text-sm">Carregando trabalhos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="font-semibold text-[#1a1a1a]">Não foi possível carregar os trabalhos</p>
        <p className="max-w-md text-[13px] text-[#6b6b6b]">{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="mt-2 flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#d9d9d9] bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-[260px] space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6b6b6b]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por título ou responsável..."
                className="w-full rounded-md border border-[#d9d9d9] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#731111]"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <span className="text-[#6b6b6b]">Status:</span>
              {STATUS_OPTS.map((s) => (
                <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                  {s === "Todos" ? "Todos" : STATUS_LABELS[s as StatusPagamento]}
                </Chip>
              ))}
              <span className="ml-3 text-[#6b6b6b]">Arquivo:</span>
              {(["todos", "com", "sem"] as const).map((s) => (
                <Chip key={s} active={arquivoFilter === s} onClick={() => setArquivoFilter(s)}>
                  {s === "todos" ? "Todos" : s === "com" ? "Com arquivo" : "Sem arquivo"}
                </Chip>
              ))}
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

      <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Coautores</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Modalidade</th>
                <th className="px-4 py-3">Formato</th>
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-16 text-center text-[#6b6b6b]">Nenhum trabalho encontrado.</td></tr>
              ) : filtered.map((t, i) => (
                <tr key={t.id} className="border-t border-[#f0eceb] hover:bg-[#faf8f7]">
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{i + 1}</td>
                  <td className="px-4 py-3 max-w-sm">
                    <div className="line-clamp-2 font-medium text-[#1a1a1a]">{t.titulo}</div>
                  </td>
                  <td className="px-4 py-3 text-[#6b6b6b]">{t.responsavel}</td>
                  <td className="px-4 py-3 relative">
                    {t.coautores.length === 0 ? (
                      <span className="text-[#6b6b6b]">—</span>
                    ) : (
                      <span
                        onMouseEnter={() => setHoverCoautores(t.id)}
                        onMouseLeave={() => setHoverCoautores(null)}
                        className="inline-block cursor-help rounded-full bg-[#f3f0ee] px-2 py-0.5 text-[11px] text-[#6b6b6b]"
                      >
                        {t.coautores.length} {t.coautores.length === 1 ? "coautor" : "coautores"}
                        {hoverCoautores === t.id && (
                          <span className="absolute left-0 top-full z-10 mt-1 w-max max-w-xs rounded-md bg-[#1a0505] px-3 py-2 text-[11px] text-white shadow-lg">
                            {t.coautores.join(", ")}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{t.categoria}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{t.modalidade}</td>
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{formatoLabel(t.formato)}</td>
                  <td className="px-4 py-3">
                    {t.arquivoPath ? (
                      <span className="inline-flex items-center gap-1.5 rounded bg-[#dbeafe] px-2 py-0.5 text-[11px] font-medium text-[#1e40af]">
                        <Paperclip className="h-3 w-3" /> PDF
                      </span>
                    ) : (
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] text-[#6b7280]">Pendente</span>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setSelected(t)} className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f3f0ee] hover:text-[#731111]">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        disabled={!t.arquivoPath}
                        onClick={() => baixarArquivo(t)}
                        className="rounded p-1.5 text-[#6b6b6b] enabled:hover:bg-[#f3f0ee] enabled:hover:text-[#731111] disabled:opacity-30"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <TrabalhoDrawer item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
        active ? "border-[#731111] bg-[#731111] text-white" : "border-[#d9d9d9] bg-white text-[#6b6b6b] hover:border-[#b5736f]"
      }`}
    >
      {children}
    </button>
  );
}

function TrabalhoDrawer({ item, onClose }: { item: Trabalho; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-[#f0eceb] p-5">
          <div className="pr-6">
            <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">Trabalho</div>
            <div className="mt-1 text-base font-semibold text-[#1a1a1a]">{item.titulo}</div>
            <div className="mt-2"><StatusBadge status={item.status} /></div>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#6b6b6b] hover:bg-[#f3f0ee]"><X className="h-5 w-5" /></button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">
          <Sec title="Dados do Responsável">
            <KV k="Nome" v={item.responsavel} />
            <KV k="E-mail" v={item.responsavelEmail} />
          </Sec>
          <Sec title={`Coautores (${item.coautores.length})`}>
            {item.coautores.length === 0
              ? <div className="text-[12px] text-[#6b6b6b]">Nenhum coautor.</div>
              : <ul className="space-y-1 text-[13px] text-[#1a1a1a]">
                  {item.coautores.map((c) => <li key={c}>· {c}</li>)}
                </ul>}
          </Sec>
          <Sec title="Dados do Trabalho">
            <KV k="Categoria" v={item.categoria} />
            <KV k="Modalidade" v={item.modalidade} />
            <KV k="Formato" v={formatoLabel(item.formato)} />
            <KV k="Data submissão" v={new Date(item.createdAt).toLocaleString("pt-BR")} />
            <div className="mt-2 text-[12px] text-[#6b6b6b]">{item.resumo}</div>
          </Sec>
          <Sec title="Arquivo">
            {item.arquivoPath ? (
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-[#1a1a1a]">{item.arquivoNome ?? "arquivo.pdf"}</span>
                <button onClick={() => baixarArquivo(item)} className="flex items-center gap-1 text-[#731111] hover:underline">
                  <Download className="h-4 w-4" /> Baixar
                </button>
              </div>
            ) : <div className="text-[12px] text-[#6b6b6b]">Nenhum arquivo anexado.</div>}
          </Sec>
          <Sec title="Pagamento">
            <KV k="Status" v={STATUS_LABELS[item.status]} />
          </Sec>
        </div>
        <footer className="border-t border-[#f0eceb] p-4">
          <button onClick={onClose} className="w-full rounded-md border border-[#d9d9d9] py-2 text-sm font-medium hover:bg-[#faf8f7]">Fechar</button>
        </footer>
      </div>
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
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