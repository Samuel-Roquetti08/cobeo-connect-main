import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState } from "react";
import { Users, UserCheck, FileText, Tag, Download, Check, Loader2 } from "lucide-react";
import { useInscritos, useTrabalhos, useCupons } from "@/lib/api/adminHooks";
import { inscritoParaLinha, trabalhoParaLinha, cupomParaLinha } from "@/lib/api/exportRows";
import type { Inscrito, Trabalho, Cupom } from "@/lib/api/adminTypes";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/exportar")({
  head: () => ({ meta: [{ title: "Exportar Dados · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <ExportarPage />
    </AdminShell>
  ),
});

function ExportarPage() {
  const { data: inscritos, isLoading: loadingInscritos } = useInscritos();
  const { data: trabalhos, isLoading: loadingTrabalhos } = useTrabalhos();
  const { data: cupons, isLoading: loadingCupons } = useCupons();

  const todosInscritos = inscritos ?? [];
  const confirmados = todosInscritos.filter((r) => r.status === "pago");
  const todosTrabalhos = trabalhos ?? [];
  const todosCupons = cupons ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <SectionBlock title="Exportar Inscritos" description="Baixe a lista completa de inscritos no II COBEO, com filtros por status.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ExportCard
            icon={Users}
            label="Todos os Inscritos"
            fileName="cobeo-inscritos-completo.xlsx"
            loading={loadingInscritos}
            count={todosInscritos.length}
            gerar={() => gerarPlanilha(todosInscritos.map(inscritoParaLinha), "Inscritos", "cobeo-inscritos-completo.xlsx")}
          />
          <ExportCard
            icon={UserCheck}
            label="Apenas Confirmados"
            fileName="cobeo-inscritos-confirmados.xlsx"
            loading={loadingInscritos}
            count={confirmados.length}
            gerar={() => gerarPlanilha(confirmados.map(inscritoParaLinha), "Confirmados", "cobeo-inscritos-confirmados.xlsx")}
          />
        </div>
      </SectionBlock>

      <SectionBlock title="Exportar Trabalhos" description="Relatório completo dos trabalhos científicos submetidos.">
        <ExportCard
          icon={FileText}
          label="Todos os Trabalhos"
          fileName="cobeo-trabalhos.xlsx"
          loading={loadingTrabalhos}
          count={todosTrabalhos.length}
          gerar={() => gerarPlanilha(todosTrabalhos.map(trabalhoParaLinha), "Trabalhos", "cobeo-trabalhos.xlsx")}
        />
      </SectionBlock>

      <SectionBlock title="Exportar Cupons" description="Listagem de cupons gerados e seu status de utilização.">
        <ExportCard
          icon={Tag}
          label="Relatório de Cupons"
          fileName="cobeo-cupons.xlsx"
          loading={loadingCupons}
          count={todosCupons.length}
          gerar={() => gerarPlanilha(todosCupons.map(cupomParaLinha), "Cupons", "cobeo-cupons.xlsx")}
        />
      </SectionBlock>

      <SectionBlock title="Exportar Completo">
        <BigCard
          loading={loadingInscritos || loadingTrabalhos || loadingCupons}
          gerar={() => gerarPlanilhaCompleta(todosInscritos, todosTrabalhos, todosCupons)}
        />
      </SectionBlock>
    </div>
  );
}

// ─── Geração dos arquivos (SheetJS carregado sob demanda) ────────────────────
async function gerarPlanilha(rows: Record<string, unknown>[], aba: string, fileName: string) {
  if (rows.length === 0) {
    toast.error("Nada para exportar", { description: "Não há registros para esse relatório." });
    return;
  }
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, aba);
  XLSX.writeFile(wb, fileName);
}

async function gerarPlanilhaCompleta(inscritos: Inscrito[], trabalhos: Trabalho[], cupons: Cupom[]) {
  if (inscritos.length === 0 && trabalhos.length === 0 && cupons.length === 0) {
    toast.error("Nada para exportar", { description: "Não há registros no banco ainda." });
    return;
  }
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  if (inscritos.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inscritos.map(inscritoParaLinha)), "Inscritos");
  }
  if (trabalhos.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(trabalhos.map(trabalhoParaLinha)), "Trabalhos");
  }
  if (cupons.length > 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cupons.map(cupomParaLinha)), "Cupons");
  }
  XLSX.writeFile(wb, `cobeo-completo-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function SectionBlock({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] font-semibold text-[#1a1a1a]">{title}</h2>
      {description && <p className="mt-1 text-[13px] text-[#6b6b6b]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

type State = "idle" | "gerando" | "done";

function ExportCard({
  icon: Icon, label, fileName, loading, count, gerar,
}: {
  icon: typeof Users; label: string; fileName: string; loading: boolean; count: number; gerar: () => Promise<void>;
}) {
  const [state, setState] = useState<State>("idle");

  async function trigger() {
    if (state !== "idle" || loading) return;
    setState("gerando");
    try {
      await gerar();
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      console.error("[exportar]", e);
      toast.error("Erro ao gerar planilha", { description: (e as Error)?.message ?? "Tente novamente." });
      setState("idle");
    }
  }

  return (
    <div className="rounded-xl border border-[#d9d9d9] bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#f3f0ee] text-[#731111]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-[#1a1a1a]">{label}</div>
          <div className="mt-0.5 text-[11px] text-[#6b6b6b]">
            {fileName} {!loading && <span>· {count} registro{count !== 1 ? "s" : ""}</span>}
          </div>
        </div>
      </div>
      <button
        onClick={trigger}
        disabled={state !== "idle" || loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515] disabled:opacity-70"
      >
        {state === "done" ? <><Check className="h-4 w-4" /> Download iniciado</>
          : state === "gerando" ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
          : loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Carregando dados...</>
          : <><Download className="h-4 w-4" /> Exportar .xlsx</>}
      </button>
    </div>
  );
}

function BigCard({ loading, gerar }: { loading: boolean; gerar: () => Promise<void> }) {
  const [state, setState] = useState<State>("idle");

  async function trigger() {
    if (state !== "idle" || loading) return;
    setState("gerando");
    try {
      await gerar();
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch (e) {
      console.error("[exportar-completo]", e);
      toast.error("Erro ao gerar planilha", { description: (e as Error)?.message ?? "Tente novamente." });
      setState("idle");
    }
  }

  return (
    <div className="rounded-xl bg-[#731111] p-7 text-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-md">
          <h3 className="text-[18px] font-semibold">Exportar tudo em um arquivo</h3>
          <p className="mt-1 text-[13px] text-white/70">
            Gera uma planilha .xlsx com abas separadas para inscritos, trabalhos e cupons.
          </p>
        </div>
        <button
          onClick={trigger}
          disabled={state !== "idle" || loading}
          className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#731111] hover:bg-white/90 disabled:opacity-80"
        >
          {state === "done" ? <><Check className="h-4 w-4" /> Download iniciado</>
            : state === "gerando" ? <><Loader2 className="h-4 w-4 animate-spin" /> Gerando...</>
            : loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</>
            : <><Download className="h-4 w-4" /> Exportar Completo</>}
        </button>
      </div>
    </div>
  );
}
