import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw, Info, MailCheck } from "lucide-react";
import { useElegiveisCertificado, useEnviarCertificados } from "@/lib/api/adminHooks";
import { useConfiguracoes } from "@/lib/api/adminHooks";
import { CargaHorariaPendenteError } from "@/lib/api/adminData";
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
  const enviar = useEnviarCertificados();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // Progresso acumulado ao longo dos lotes (a function processa em lotes e a UI
  // reinvoca até zerar).
  const [progresso, setProgresso] = useState<{ enviados: number; falhas: number } | null>(null);
  const [cargaPendente, setCargaPendente] = useState<string | null>(null);

  const lista = elegiveis ?? [];
  const aptos = lista.filter((e) => e.elegivel);
  const naoAptos = lista.filter((e) => !e.elegivel);
  const aptosPendentes = aptos.filter((e) => !e.certificadoEnviadoEm);
  const aptosEnviados = aptos.filter((e) => e.certificadoEnviadoEm);
  const enviando = enviar.isPending;

  async function handleConfirmarEnvio() {
    setConfirmOpen(false);
    setCargaPendente(null);
    let enviados = 0;
    let falhas = 0;
    setProgresso({ enviados, falhas });
    try {
      // Loop de lotes: chama a function até não sobrar elegível sem certificado.
      // Guarda contra loop infinito caso um lote inteiro falhe sem avançar.
      for (let i = 0; i < 500; i++) {
        const r = await enviar.mutateAsync(undefined);
        enviados += r.enviados;
        falhas += r.falhas;
        setProgresso({ enviados, falhas });
        if (r.restantes === 0) break;
        if (r.enviados === 0) break; // nenhum avanço neste lote — evita girar em falso
      }
      toast.success("Envio de certificados concluído.", {
        description: `${enviados} enviado${enviados === 1 ? "" : "s"}${falhas ? `, ${falhas} com falha` : ""}.`,
      });
    } catch (e) {
      if (e instanceof CargaHorariaPendenteError) {
        setCargaPendente(e.message);
        toast.error("Carga horária pendente", { description: "Nenhum certificado foi enviado." });
      } else {
        toast.error("Erro ao enviar certificados", { description: (e as Error)?.message });
      }
    } finally {
      setProgresso(null);
      refetch();
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
          comprados. O botão gera o PDF do certificado e envia por e-mail (com anexo) a cada participante
          elegível que ainda não recebeu — pode ser clicado de novo com segurança, nunca reenvia para quem
          já recebeu. A carga horária de cada curso ainda é pendência do Fabiano; enquanto não for
          preenchida, o envio é recusado.
        </p>
      </div>

      {cargaPendente && (
        <div className="flex items-start gap-3 rounded-lg border border-[#f0c000] bg-[#fdf6e3] px-4 py-3 text-[13px] text-[#8a6d00]">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{cargaPendente}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#d9d9d9] bg-white p-5">
        <div className="flex gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">Elegíveis</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">{aptos.length}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">A enviar</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">{aptosPendentes.length}</div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">Não elegíveis</div>
            <div className="text-2xl font-bold text-[#1a1a1a]">{naoAptos.length}</div>
          </div>
        </div>
        <div className="text-right">
          {config?.certificadosEnviadosEm && (
            <p className="mb-2 text-[12px] text-[#6b6b6b]">
              Fila zerada em {new Date(config.certificadosEnviadosEm).toLocaleString("pt-BR")}
            </p>
          )}
          {enviando && progresso && (
            <p className="mb-2 text-[12px] text-[#731111]">
              Enviando… {progresso.enviados} enviado{progresso.enviados === 1 ? "" : "s"}
              {progresso.falhas ? `, ${progresso.falhas} com falha` : ""}
            </p>
          )}
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={enviando || aptosPendentes.length === 0}
            className="flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
            {aptosPendentes.length === 0 ? "Todos os certificados enviados" : `Emitir e Enviar (${aptosPendentes.length})`}
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
                <td className="px-4 py-3 text-right">
                  {e.certificadoEnviadoEm ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-green-700">
                      <MailCheck className="h-3.5 w-3.5" />
                      {new Date(e.certificadoEnviadoEm).toLocaleDateString("pt-BR")}
                    </span>
                  ) : (
                    <span className="text-[12px] text-[#b45309]">A enviar</span>
                  )}
                </td>
              </tr>
            ))}
          </TabelaBase>
        )}
      </Secao>

      <Secao titulo={`Não elegíveis (${naoAptos.length})`} icone={<XCircle className="h-4 w-4 text-red-500" />}>
        {naoAptos.length === 0 ? (
          <VazioLinha texto="Todos os pagos estão elegíveis." />
        ) : (
          <TabelaBase colunaFinal="Presença">
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
                Isso vai gerar o PDF e enviar o certificado por e-mail para {aptosPendentes.length} participante
                {aptosPendentes.length === 1 ? "" : "s"} que ainda não recebe{aptosPendentes.length === 1 ? "u" : "ram"}.
                Quem já recebeu não é reenviado. {aptosEnviados.length > 0 ? `(${aptosEnviados.length} já enviado${aptosEnviados.length === 1 ? "" : "s"}.)` : ""}
              </p>
            </div>
            <footer className="flex justify-end gap-2 border-t border-[#f0eceb] px-6 py-4">
              <button onClick={() => setConfirmOpen(false)} className="rounded-md px-4 py-2 text-sm font-medium text-[#6b6b6b] hover:bg-[#f3f0ee]">
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEnvio}
                disabled={enviando}
                className="flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8a1515] disabled:opacity-60"
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar Envio
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

function TabelaBase({ children, colunaFinal = "Certificado" }: { children: React.ReactNode; colunaFinal?: string }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
        <tr>
          <th className="px-4 py-3">Nome</th>
          <th className="px-4 py-3">E-mail</th>
          <th className="px-4 py-3">Código</th>
          <th className="px-4 py-3 text-right">{colunaFinal}</th>
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function VazioLinha({ texto }: { texto: string }) {
  return <p className="px-4 py-8 text-center text-sm text-[#6b6b6b]">{texto}</p>;
}
