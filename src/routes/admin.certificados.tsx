import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Info } from "lucide-react";
import { useElegiveisCertificado, useMarcarCertificadosEnviados } from "@/lib/api/adminHooks";
import { useConfiguracoes } from "@/lib/api/adminHooks";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/certificados")({
  head: () => ({ meta: [{ title: "Certificados · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <CertificadosPage />
    </AdminShell>
  ),
});

function CertificadosPage() {
  const { data: elegiveis, isLoading, isError, error, refetch } = useElegiveisCertificado();
  const { data: config } = useConfiguracoes();
  const marcarEnviados = useMarcarCertificadosEnviados();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const lista = elegiveis ?? [];
  const aptos = lista.filter((e) => e.elegivel);
  const naoAptos = lista.filter((e) => !e.elegivel);
  const jaEnviados = Boolean(config?.certificadosEnviadosEm);

  async function handleConfirmarEnvio() {
    try {
      await marcarEnviados.mutateAsync();
      toast.success("Certificados marcados como emitidos.", {
        description: `${aptos.length} participante${aptos.length === 1 ? "" : "s"} elegível${aptos.length === 1 ? "" : "eis"}.`,
      });
      setConfirmOpen(false);
    } catch (e) {
      toast.error("Erro ao registrar emissão", { description: (e as Error)?.message });
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#6b6b6b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#731111]" />
        <p className="text-sm">Carregando elegibilidade...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="font-semibold text-[#1a1a1a]">Não foi possível carregar os certificados</p>
        <p className="max-w-md text-[13px] text-[#6b6b6b]">{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="mt-2 flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-lg border border-[#d9d9d9] bg-[#f3f0ee] px-4 py-3 text-[13px] text-[#6b6b6b]">
        <Info className="h-4 w-4 shrink-0 text-[#731111] mt-0.5" />
        <p>
          Elegibilidade calculada automaticamente: pedido pago e presença registrada em todos os cursos
          comprados. A geração do PDF do certificado ainda depende da carga horária de cada curso, que é
          uma pendência do Fabiano — esta tela cobre apenas a checagem de elegibilidade e o registro do envio.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#d9d9d9] bg-white p-5">
        <div className="flex gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">Elegíveis</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">{aptos.length}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">Não elegíveis</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">{naoAptos.length}</div>
          </div>
        </div>
        <div className="text-right">
          {jaEnviados && (
            <p className="mb-2 text-[12px] text-[#6b6b6b]">
              Enviados em {new Date(config!.certificadosEnviadosEm!).toLocaleString("pt-BR")}
            </p>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={jaEnviados || aptos.length === 0}
            className="rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {jaEnviados ? "Certificados já emitidos" : "Emitir e Enviar Certificados"}
          </button>
        </div>
      </div>

      <Secao titulo={`Elegíveis (${aptos.length})`} icone={<CheckCircle2 className="h-4 w-4 text-green-600" />}>
        {aptos.length === 0 ? (
          <VazioLinha texto="Nenhum participante elegível ainda." />
        ) : (
          <TabelaBase>
            {aptos.map((e) => (
              <tr key={e.inscritoId} className="border-t border-[#f0eceb] hover:bg-[#faf8f7]">
                <td className="px-4 py-3 font-medium text-[#1a1a1a]">{e.nome}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{e.email}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-[#6b6b6b]">{e.codigoInscricao}</td>
                <td className="px-4 py-3 text-right text-[#6b6b6b]">{e.cursosPresentes}/{e.totalCursos} cursos</td>
              </tr>
            ))}
          </TabelaBase>
        )}
      </Secao>

      <Secao titulo={`Não elegíveis (${naoAptos.length})`} icone={<XCircle className="h-4 w-4 text-red-500" />}>
        {naoAptos.length === 0 ? (
          <VazioLinha texto="Todos os pagos estão elegíveis." />
        ) : (
          <TabelaBase>
            {naoAptos.map((e) => (
              <tr key={e.inscritoId} className="border-t border-[#f0eceb] hover:bg-[#faf8f7]">
                <td className="px-4 py-3 font-medium text-[#1a1a1a]">{e.nome}</td>
                <td className="px-4 py-3 text-[#6b6b6b]">{e.email}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-[#6b6b6b]">{e.codigoInscricao}</td>
                <td className="px-4 py-3 text-right text-[#b45309]">
                  {e.totalCursos - e.cursosPresentes} curso{e.totalCursos - e.cursosPresentes === 1 ? "" : "s"} sem check-in
                  <span className="ml-1 text-[#6b6b6b]">({e.cursosPresentes}/{e.totalCursos})</span>
                </td>
              </tr>
            ))}
          </TabelaBase>
        )}
      </Secao>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[#1a1a1a]">Emitir e enviar certificados</h3>
              <p className="mt-2 text-sm text-[#6b6b6b]">
                Isso marcará os certificados como emitidos para {aptos.length} participante{aptos.length === 1 ? "" : "s"}.
                Esta ação é irreversível e o botão será desabilitado em seguida — emitir duas vezes gera confusão
                e queima cota do Resend.
              </p>
            </div>
            <footer className="flex justify-end gap-2 border-t border-[#f0eceb] px-6 py-4">
              <button onClick={() => setConfirmOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-[#6b6b6b] hover:bg-[#f3f0ee]">
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEnvio}
                disabled={marcarEnviados.isPending}
                className="flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8a1515] disabled:opacity-60"
              >
                {marcarEnviados.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar Emissão
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}

function Secao({ titulo, icone, children }: { titulo: string; icone: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
      <div className="flex items-center gap-2 border-b border-[#f0eceb] bg-[#faf8f7] px-4 py-3">
        {icone}
        <h3 className="text-sm font-semibold text-[#1a1a1a]">{titulo}</h3>
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function TabelaBase({ children }: { children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
        <tr>
          <th className="px-4 py-3">Nome</th>
          <th className="px-4 py-3">E-mail</th>
          <th className="px-4 py-3">Código</th>
          <th className="px-4 py-3 text-right">Presença</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function VazioLinha({ texto }: { texto: string }) {
  return <p className="px-4 py-8 text-center text-sm text-[#6b6b6b]">{texto}</p>;
}
