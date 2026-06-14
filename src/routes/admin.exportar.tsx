import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState } from "react";
import { Users, UserCheck, FileText, Tag, Download, Check } from "lucide-react";

export const Route = createFileRoute("/admin/exportar")({
  head: () => ({ meta: [{ title: "Exportar Dados · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <ExportarPage />
    </AdminShell>
  ),
});

function ExportarPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <SectionBlock title="Exportar Inscritos" description="Baixe a lista completa de inscritos no II COBEO, com filtros por status.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ExportCard icon={Users} label="Todos os Inscritos" fileName="cobeo-inscritos-completo.xlsx" />
          <ExportCard icon={UserCheck} label="Apenas Confirmados" fileName="cobeo-inscritos-confirmados.xlsx" />
        </div>
      </SectionBlock>

      <SectionBlock title="Exportar Trabalhos" description="Relatório completo dos trabalhos científicos submetidos.">
        <ExportCard icon={FileText} label="Todos os Trabalhos" fileName="cobeo-trabalhos.xlsx" />
      </SectionBlock>

      <SectionBlock title="Exportar Cupons" description="Listagem de cupons gerados e seu status de utilização.">
        <ExportCard icon={Tag} label="Relatório de Cupons" fileName="cobeo-cupons.xlsx" />
      </SectionBlock>

      <SectionBlock title="Exportar Completo">
        <BigCard />
      </SectionBlock>
    </div>
  );
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

type State = "idle" | "downloading" | "done";

function ExportCard({ icon: Icon, label, fileName }: { icon: typeof Users; label: string; fileName: string }) {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);

  function trigger() {
    if (state !== "idle") return;
    setState("downloading");
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id);
          setState("done");
          setTimeout(() => { setState("idle"); setProgress(0); }, 2500);
          return 100;
        }
        return p + 8;
      });
    }, 80);
  }

  return (
    <div className="rounded-xl border border-[#d9d9d9] bg-white p-6">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#f3f0ee] text-[#731111]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-[#1a1a1a]">{label}</div>
          <div className="mt-0.5 text-[11px] text-[#6b6b6b]">{fileName}</div>
        </div>
      </div>
      {state === "downloading" && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f3f0ee]">
          <div className="h-full bg-[#731111] transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
      )}
      <button
        onClick={trigger}
        disabled={state !== "idle"}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515] disabled:opacity-70"
      >
        {state === "done" ? <><Check className="h-4 w-4" /> Download iniciado</>
          : state === "downloading" ? <>Gerando...</>
          : <><Download className="h-4 w-4" /> Exportar .xlsx</>}
      </button>
    </div>
  );
}

function BigCard() {
  const [state, setState] = useState<State>("idle");
  const [progress, setProgress] = useState(0);
  function trigger() {
    if (state !== "idle") return;
    setState("downloading");
    setProgress(0);
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id); setState("done");
          setTimeout(() => { setState("idle"); setProgress(0); }, 2500);
          return 100;
        }
        return p + 6;
      });
    }, 80);
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
          disabled={state !== "idle"}
          className="flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[#731111] hover:bg-white/90 disabled:opacity-80"
        >
          {state === "done" ? <><Check className="h-4 w-4" /> Download iniciado</>
            : state === "downloading" ? "Gerando..."
            : <><Download className="h-4 w-4" /> Exportar Completo</>}
        </button>
      </div>
      {state === "downloading" && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full bg-[#C9A84C] transition-[width] duration-100" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
