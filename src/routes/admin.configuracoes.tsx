import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { Lock, Unlock, Utensils, Loader2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useConfiguracoes, useUpdateConfiguracoes } from "@/lib/api/adminHooks";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <ConfiguracoesPage />
    </AdminShell>
  ),
});

function ConfiguracoesPage() {
  const { data: config, isLoading, isError, refetch } = useConfiguracoes();
  const update = useUpdateConfiguracoes();

  function toggleInscricoes() {
    if (!config) return;
    const novo = !config.inscricoesBloqueadas;
    update.mutate({ inscricoesBloqueadas: novo }, {
      onSuccess: () => toast.success(novo ? "Inscrições bloqueadas" : "Inscrições reabertas", {
        description: novo
          ? "Novos participantes não conseguem mais se inscrever nos cursos."
          : "O site voltou a aceitar novas inscrições.",
      }),
      onError: (e) => toast.error("Erro ao atualizar", { description: (e as Error)?.message }),
    });
  }

  function toggleJantar() {
    if (!config) return;
    const novo = !config.jantarBloqueado;
    update.mutate({ jantarBloqueado: novo }, {
      onSuccess: () => toast.success(novo ? "Jantar bloqueado" : "Jantar reaberto", {
        description: novo
          ? "Não é mais possível comprar ingressos do jantar."
          : "A compra de ingressos do jantar foi reaberta.",
      }),
      onError: (e) => toast.error("Erro ao atualizar", { description: (e as Error)?.message }),
    });
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#6b6b6b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#731111]" />
        <p className="text-sm">Carregando configurações...</p>
      </div>
    );
  }

  if (isError || !config) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="font-semibold text-[#1a1a1a]">Não foi possível carregar as configurações</p>
        <button onClick={() => refetch()} className="mt-2 flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-[#1a1a1a]">Configurações do Evento</h1>
        <p className="mt-1 text-[13px] text-[#6b6b6b]">
          Controles manuais de disponibilidade. As mudanças têm efeito imediato no site público.
        </p>
      </div>

      {/* Bloqueio de inscrições */}
      <ControlCard
        icon={config.inscricoesBloqueadas ? Lock : Unlock}
        iconColor={config.inscricoesBloqueadas ? "#991b1b" : "#2d7a3a"}
        title="Inscrições nos Cursos"
        description={
          config.inscricoesBloqueadas
            ? "As inscrições estão BLOQUEADAS. Novos participantes não conseguem comprar cursos no site."
            : "As inscrições estão ABERTAS. O site aceita novos participantes normalmente."
        }
        status={config.inscricoesBloqueadas ? "Bloqueado" : "Aberto"}
        statusColor={config.inscricoesBloqueadas ? "#991b1b" : "#2d7a3a"}
        buttonLabel={config.inscricoesBloqueadas ? "Reabrir inscrições" : "Bloquear inscrições"}
        buttonDanger={!config.inscricoesBloqueadas}
        onClick={toggleInscricoes}
        loading={update.isPending}
      />

      {/* Bloqueio do jantar */}
      <ControlCard
        icon={Utensils}
        iconColor={config.jantarBloqueado ? "#991b1b" : "#b8860b"}
        title="Ingressos do Jantar de Encerramento"
        description={
          config.jantarBloqueado
            ? "A venda de ingressos do jantar está BLOQUEADA. Use quando as vagas do Boulevard esgotarem."
            : "A venda de ingressos do jantar está ABERTA. Disponível para quem comprar 3+ cursos."
        }
        status={config.jantarBloqueado ? "Bloqueado" : "Aberto"}
        statusColor={config.jantarBloqueado ? "#991b1b" : "#2d7a3a"}
        buttonLabel={config.jantarBloqueado ? "Reabrir jantar" : "Bloquear jantar"}
        buttonDanger={!config.jantarBloqueado}
        onClick={toggleJantar}
        loading={update.isPending}
      />

      {/* Status dos certificados (somente leitura por enquanto) */}
      <div className="rounded-xl border border-[#d9d9d9] bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: "#f3f0ee" }}>
            <ShieldCheck className="h-5 w-5" style={{ color: "#731111" }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-[#1a1a1a]">Certificados</h3>
            <p className="mt-1 text-[13px] text-[#6b6b6b]">
              {config.certificadosEnviadosEm
                ? `Certificados enviados em ${new Date(config.certificadosEnviadosEm).toLocaleString("pt-BR")}.`
                : "Os certificados ainda não foram enviados. O envio será habilitado após o evento."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlCard({
  icon: Icon, iconColor, title, description, status, statusColor,
  buttonLabel, buttonDanger, onClick, loading,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string; title: string; description: string;
  status: string; statusColor: string;
  buttonLabel: string; buttonDanger: boolean;
  onClick: () => void; loading: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#d9d9d9] bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: "#f3f0ee" }}>
            <Icon className="h-5 w-5" style={{ color: iconColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold text-[#1a1a1a]">{title}</h3>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ background: `${statusColor}1a`, color: statusColor }}>
                {status}
              </span>
            </div>
            <p className="mt-1 max-w-md text-[13px] text-[#6b6b6b]">{description}</p>
          </div>
        </div>
        <button
          onClick={onClick}
          disabled={loading}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
            buttonDanger ? "bg-[#991b1b] hover:bg-[#7f1414]" : "bg-[#2d7a3a] hover:bg-[#24632f]"
          }`}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}