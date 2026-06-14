import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { useMemo, useState } from "react";
import { Search, Download, Eye, X, Paperclip } from "lucide-react";
import { trabalhos, type Trabalho, type Status } from "@/data/mockAdmin";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/trabalhos")({
  head: () => ({ meta: [{ title: "Trabalhos · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <TrabalhosPage />
    </AdminShell>
  ),
});

function TrabalhosPage() {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "Todos">("Todos");
  const [arquivoFilter, setArquivoFilter] = useState<"todos" | "com" | "sem">("todos");
  const [selected, setSelected] = useState<Trabalho | null>(null);
  const [hoverCoautores, setHoverCoautores] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return trabalhos.filter((t) => {
      if (q) {
        const s = q.toLowerCase();
        if (!t.titulo.toLowerCase().includes(s) && !t.responsavel.toLowerCase().includes(s)) return false;
      }
      if (statusFilter !== "Todos" && t.statusPagamento !== statusFilter) return false;
      if (arquivoFilter === "com" && !t.arquivo) return false;
      if (arquivoFilter === "sem" && t.arquivo) return false;
      return true;
    });
  }, [q, statusFilter, arquivoFilter]);

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
              {(["Todos", "Confirmado", "Pendente", "Cancelado"] as const).map((s) => (
                <Chip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</Chip>
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
            onClick={() => toast.success("Exportação iniciada")}
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
                <th className="px-4 py-3">Arquivo</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Status Pgto</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => (
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
                  <td className="px-4 py-3">
                    {t.arquivo ? (
                      <span className="inline-flex items-center gap-1.5 rounded bg-[#dbeafe] px-2 py-0.5 text-[11px] font-medium text-[#1e40af]">
                        <Paperclip className="h-3 w-3" /> {t.arquivo.tipo}
                      </span>
                    ) : (
                      <span className="rounded bg-[#f3f4f6] px-2 py-0.5 text-[11px] text-[#6b7280]">Pendente</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">
                    {new Date(t.dataSubmissao).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={t.statusPagamento} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setSelected(t)} className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f3f0ee] hover:text-[#731111]">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        disabled={!t.arquivo}
                        onClick={() => toast.success(`Baixando ${t.arquivo?.nome}`)}
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
            <div className="mt-2"><StatusBadge status={item.statusPagamento} /></div>
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
            <KV k="Data submissão" v={new Date(item.dataSubmissao).toLocaleString("pt-BR")} />
            <div className="mt-2 text-[12px] text-[#6b6b6b]">{item.resumo}</div>
          </Sec>
          <Sec title="Arquivo">
            {item.arquivo ? (
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-[#1a1a1a]">{item.arquivo.nome}</span>
                <button onClick={() => toast.success("Download iniciado")} className="flex items-center gap-1 text-[#731111] hover:underline">
                  <Download className="h-4 w-4" /> Baixar
                </button>
              </div>
            ) : <div className="text-[12px] text-[#6b6b6b]">Nenhum arquivo anexado.</div>}
          </Sec>
          <Sec title="Pagamento">
            <KV k="Status" v={item.statusPagamento} />
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
