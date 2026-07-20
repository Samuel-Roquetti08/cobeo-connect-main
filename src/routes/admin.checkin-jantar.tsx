import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode, Search, CheckCircle2, XCircle, Clock, RotateCcw, Loader2,
  Wine, ShieldAlert, X, CameraOff,
} from "lucide-react";
import { buscarParaCheckinJantar, registrarCheckinJantar } from "@/lib/api/adminData";
import { JANTAR_LABELS, type ElegivelJantar } from "@/lib/api/adminTypes";
import { useAdminAuth } from "@/lib/adminAuth";
import { toast } from "sonner";

// Região do DOM onde o html5-qrcode injeta o preview da câmera
const QR_REGION_ID = "checkin-jantar-qr-region";

export const Route = createFileRoute("/admin/checkin-jantar")({
  head: () => ({ meta: [{ title: "Check-in Jantar · Admin · II COBEO" }] }),
  validateSearch: (search: Record<string, unknown>): { codigo?: string } => {
    return typeof search.codigo === "string" ? { codigo: search.codigo } : {};
  },
  component: () => (
    <AdminShell>
      <CheckinJantarPage />
    </AdminShell>
  ),
});

// Três estados, espelhando o check-in por curso (D18): comprou/compareceu tudo,
// já entrou, ou está barrado (com motivo específico).
type EstadoJantar = "autorizado" | "ja_confirmado" | "nao_autorizado";

function getEstado(r: ElegivelJantar): EstadoJantar {
  if (r.jantarCheckInEm) return "ja_confirmado";
  if (r.elegivelJantar) return "autorizado";
  return "nao_autorizado";
}

// A pessoa na porta precisa do motivo específico pra explicar a recusa —
// "não autorizado" sem motivo gera discussão com quem pagou.
function motivoRecusa(r: ElegivelJantar): string {
  if (!r.comprouJantar) return "Não comprou o jantar de encerramento.";
  const qtd = r.cursosFaltantes.length;
  const plural = r.cursosComprados > 1;
  return `Faltou em ${qtd} de ${r.cursosComprados} curso${plural ? "s" : ""} comprado${plural ? "s" : ""}: ${r.cursosFaltantes.join(", ")}`;
}

function CheckinJantarPage() {
  const search = useSearch({ from: "/admin/checkin-jantar" });
  const { user } = useAdminAuth();

  const [query, setQuery] = useState("");
  const [found, setFound] = useState<ElegivelJantar | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [motivoOverride, setMotivoOverride] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerErro, setScannerErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qrInstanceRef = useRef<Html5Qrcode | null>(null);

  const buscar = useCallback(async (q: string) => {
    const term = q.trim();
    if (!term) return;
    setLoading(true);
    setNotFound(false);
    setFound(null);
    setShowOverride(false);
    setMotivoOverride("");
    try {
      const res = await buscarParaCheckinJantar(term);
      if (res) setFound(res);
      else setNotFound(true);
    } catch (e) {
      toast.error("Erro na busca", { description: (e as Error)?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (search.codigo) {
      setQuery(search.codigo);
      buscar(search.codigo);
    } else {
      inputRef.current?.focus();
    }
  }, [search.codigo, buscar]);

  // Câmera do QR Code: só extrai o código e alimenta a MESMA busca já
  // existente (buscar) — sem lógica de autorização paralela. Requer HTTPS
  // (ou localhost).
  useEffect(() => {
    if (!scannerOpen) return;
    let cancelled = false;
    const html5QrCode = new Html5Qrcode(QR_REGION_ID);
    qrInstanceRef.current = html5QrCode;
    setScannerErro(null);

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decodedText) => {
          if (cancelled) return;
          cancelled = true;
          let codigoLido = decodedText;
          try {
            const url = new URL(decodedText, window.location.origin);
            codigoLido = url.searchParams.get("codigo") ?? decodedText;
          } catch {
            // QR não é uma URL — usa o texto lido diretamente como código
          }
          setScannerOpen(false);
          setQuery(codigoLido);
          buscar(codigoLido);
        },
        () => {
          // Falha ao decodificar um frame isolado — normal até o QR entrar em foco, ignorar.
        },
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = (err as Error)?.message ?? String(err);
        setScannerErro(
          msg.toLowerCase().includes("permission")
            ? "Permissão de câmera negada. Autorize o acesso à câmera nas configurações do navegador."
            : "Não foi possível abrir a câmera. Verifique se o site está em HTTPS e se há uma câmera disponível.",
        );
      });

    return () => {
      cancelled = true;
      const instance = qrInstanceRef.current;
      qrInstanceRef.current = null;
      if (instance) {
        instance.stop().then(() => instance.clear()).catch(() => {});
      }
    };
  }, [scannerOpen, buscar]);

  async function confirmarEntrada(override: boolean) {
    if (!found || !user) return;
    if (override && !motivoOverride.trim()) {
      toast.error("Informe o motivo da autorização manual.");
      return;
    }
    setRegistrando(true);
    try {
      await registrarCheckinJantar(
        found.inscritoId,
        user.email,
        override,
        override ? motivoOverride.trim() : null,
      );
      setFound({
        ...found,
        jantarCheckInEm: new Date().toISOString(),
        jantarCheckInPor: user.email,
        jantarCheckInOverride: override,
        jantarCheckInMotivo: override ? motivoOverride.trim() : null,
      });
      toast.success("Entrada confirmada", { description: found.nome });
    } catch (e) {
      toast.error("Erro ao confirmar", { description: (e as Error)?.message });
    } finally {
      setRegistrando(false);
    }
  }

  function resetar() {
    setQuery("");
    setFound(null);
    setNotFound(false);
    setShowOverride(false);
    setMotivoOverride("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const estado = found ? getEstado(found) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border border-[#d9d9d9] bg-white p-5">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b]">
          <Wine className="h-3.5 w-3.5" /> Check-in — Jantar de Encerramento
        </p>
        <p className="mt-2 text-[13px] text-[#6b6b6b]">
          Autorizado apenas quem comprou o jantar e compareceu a todos os cursos que comprou.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
        <div className="border-b border-[#f0eceb] p-6">
          <label htmlFor="checkin-jantar-search" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b]">
            Código de inscrição, nome ou e-mail
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
              <input
                id="checkin-jantar-search"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscar(query)}
                placeholder="Ex: COBEO-A1B2 ou Ana Souza"
                className="w-full rounded-md border border-[#d9d9d9] bg-white py-2.5 pl-9 pr-3 font-mono text-sm uppercase tracking-wider outline-none transition-colors focus:border-[#731111] focus:ring-1 focus:ring-[#731111]"
                autoComplete="off"
              />
            </div>
            <button
              onClick={() => buscar(query)}
              disabled={loading}
              className="flex items-center gap-2 rounded-md bg-[#731111] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#8a1515] disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
            <button
              onClick={() => setScannerOpen(true)}
              className="flex items-center gap-2 rounded-md border border-[#731111] px-4 text-sm font-semibold text-[#731111] transition-colors hover:bg-[#731111] hover:text-white"
            >
              <QrCode className="h-4 w-4" />
              Ler QR Code
            </button>
          </div>
        </div>

        {found && estado && (
          <ResultPanel
            estado={estado}
            registro={found}
            showOverride={showOverride}
            motivoOverride={motivoOverride}
            onMotivoChange={setMotivoOverride}
            onAskOverride={() => setShowOverride(true)}
            onCancelOverride={() => { setShowOverride(false); setMotivoOverride(""); }}
            onConfirm={() => confirmarEntrada(false)}
            onConfirmOverride={() => confirmarEntrada(true)}
            onReset={resetar}
            registrando={registrando}
          />
        )}

        {notFound && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <XCircle className="h-10 w-10 text-[#d9d9d9]" />
            <p className="font-semibold text-[#1a1a1a]">Nenhum inscrito encontrado</p>
            <p className="text-[13px] text-[#6b6b6b]">Verifique o código ou busque pelo nome.</p>
            <button onClick={resetar} className="mt-2 text-sm font-semibold text-[#731111] underline">Tentar novamente</button>
          </div>
        )}

        {!found && !notFound && !loading && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f0ee]">
              <QrCode className="h-8 w-8 text-[#b5736f]" />
            </div>
            <p className="font-semibold text-[#1a1a1a]">Aguardando leitura</p>
            <p className="max-w-xs text-[13px] text-[#6b6b6b]">
              Digite o código do crachá ou use um leitor de QR Code conectado ao teclado.
            </p>
          </div>
        )}
      </div>

      {/* Overlay da câmera de QR Code */}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-6">
          <div className="flex w-full max-w-sm items-center justify-between pb-3">
            <p className="text-sm font-semibold text-white">Aponte para o QR do crachá</p>
            <button
              onClick={() => setScannerOpen(false)}
              className="rounded p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Fechar câmera"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div id={QR_REGION_ID} className="w-full max-w-sm overflow-hidden rounded-xl bg-black" />
          {scannerErro && (
            <div className="mt-4 flex max-w-sm items-start gap-2 rounded-lg border border-red-400 bg-red-950/60 px-4 py-3 text-[13px] text-red-100">
              <CameraOff className="mt-0.5 h-4 w-4 shrink-0" />
              {scannerErro}
            </div>
          )}
          <button
            onClick={() => setScannerOpen(false)}
            className="mt-4 flex items-center gap-2 rounded-md border border-white/30 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            <RotateCcw className="h-4 w-4" />
            Cancelar e digitar manualmente
          </button>
        </div>
      )}
    </div>
  );
}

function ResultPanel({
  estado, registro, showOverride, motivoOverride, onMotivoChange,
  onAskOverride, onCancelOverride, onConfirm, onConfirmOverride, onReset, registrando,
}: {
  estado: EstadoJantar;
  registro: ElegivelJantar;
  showOverride: boolean;
  motivoOverride: string;
  onMotivoChange: (v: string) => void;
  onAskOverride: () => void;
  onCancelOverride: () => void;
  onConfirm: () => void;
  onConfirmOverride: () => void;
  onReset: () => void;
  registrando: boolean;
}) {
  const config = {
    autorizado: {
      bg: "bg-green-50", iconBg: "bg-green-100", iconColor: "text-green-600",
      titleColor: "text-green-700", title: "AUTORIZADO", icon: CheckCircle2,
    },
    ja_confirmado: {
      bg: "bg-amber-50", iconBg: "bg-amber-100", iconColor: "text-amber-600",
      titleColor: "text-amber-700", title: "JÁ CONFIRMADO", icon: Clock,
    },
    nao_autorizado: {
      bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600",
      titleColor: "text-red-700", title: "NÃO AUTORIZADO", icon: XCircle,
    },
  }[estado];

  const Icon = config.icon;

  return (
    <div className={`flex flex-col items-center p-8 text-center ${config.bg}`} role="status" aria-live="assertive">
      <div className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full ${config.iconBg}`}>
        <Icon className={`h-14 w-14 ${config.iconColor}`} aria-hidden="true" />
      </div>
      <h2 className={`text-3xl font-extrabold tracking-tight ${config.titleColor}`} style={{ fontFamily: "Raleway" }}>
        {config.title}
      </h2>
      <p className="mt-2 text-[17px] font-semibold text-[#1a1a1a]">{registro.nome}</p>
      <p className="text-[13px] text-[#6b6b6b]">{registro.email}</p>

      <div className="mt-3 w-full max-w-sm rounded-lg border border-[#d9d9d9] bg-white px-4 py-3 text-left">
        <Row label="Código" value={registro.codigoInscricao} mono />
        <Row label="Cursos comprados" value={String(registro.cursosComprados)} />
        <Row label="Cursos com presença" value={String(registro.cursosPresentes)} />
      </div>

      {/* Opção de bebida — a pessoa na porta precisa saber isso na hora */}
      {estado === "autorizado" && registro.opcaoJantar && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-[#C9A84C]/50 bg-[#C9A84C]/10 px-4 py-2.5">
          <Wine className="h-4 w-4 shrink-0 text-[#8a6d1a]" aria-hidden="true" />
          <span className="text-[13px] font-semibold text-[#8a6d1a]">
            {JANTAR_LABELS[registro.opcaoJantar]}
          </span>
        </div>
      )}

      {estado === "ja_confirmado" && registro.jantarCheckInEm && (
        <p className="mt-3 text-[13px] text-amber-700">
          Entrada registrada em {new Date(registro.jantarCheckInEm).toLocaleString("pt-BR")}
          {registro.jantarCheckInOverride && " · autorização manual"}
        </p>
      )}

      {estado === "nao_autorizado" && (
        <div className="mt-3 w-full max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left">
          <p className="text-[13px] font-semibold text-red-800">Motivo:</p>
          <p className="mt-0.5 text-[13px] text-red-700">{motivoRecusa(registro)}</p>
        </div>
      )}

      {estado === "autorizado" && (
        <button
          onClick={onConfirm}
          disabled={registrando}
          className="mt-6 flex items-center gap-2 rounded-md bg-green-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
        >
          {registrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirmar Entrada
        </button>
      )}

      {/* Override: caso a regra não previu (passou mal, curso atrasou, erro de
          check-in). Fica sempre disponível para NÃO AUTORIZADO, mas exige
          motivo explícito e fica registrado com a flag override=true. */}
      {estado === "nao_autorizado" && !showOverride && (
        <button
          onClick={onAskOverride}
          className="mt-4 flex items-center gap-2 rounded-md border border-[#C9A84C] px-6 py-2.5 text-sm font-semibold text-[#8a6d1a] transition-colors hover:bg-[#C9A84C]/10"
        >
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          Autorizar manualmente
        </button>
      )}

      {estado === "nao_autorizado" && showOverride && (
        <div className="mt-4 w-full max-w-sm rounded-lg border border-[#C9A84C]/50 bg-[#C9A84C]/10 p-4 text-left">
          <label htmlFor="motivo-override" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[#8a6d1a]">
            Motivo da autorização manual
          </label>
          <textarea
            id="motivo-override"
            value={motivoOverride}
            onChange={(e) => onMotivoChange(e.target.value)}
            rows={2}
            placeholder="Ex: passou mal durante um curso, avisou a coordenação"
            className="w-full rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-[13px] outline-none focus:border-[#731111] focus:ring-1 focus:ring-[#731111]"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={onCancelOverride}
              disabled={registrando}
              className="flex-1 rounded-md border border-[#d9d9d9] px-4 py-2 text-[13px] font-medium text-[#6b6b6b] hover:border-[#731111] hover:text-[#731111] disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmOverride}
              disabled={registrando || !motivoOverride.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#8a6d1a] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#6d5514] disabled:opacity-60"
            >
              {registrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldAlert className="h-4 w-4" />}
              Confirmar Autorização
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="mt-3 flex items-center gap-2 rounded-md border border-[#d9d9d9] px-6 py-2.5 text-sm font-medium text-[#6b6b6b] transition-colors hover:border-[#731111] hover:text-[#731111]"
      >
        <RotateCcw className="h-4 w-4" />
        Próximo participante
      </button>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#f0eceb] py-1.5 last:border-0">
      <span className="text-[11px] uppercase tracking-wider text-[#6b6b6b]">{label}</span>
      <span className={`text-right text-[13px] font-medium text-[#1a1a1a] ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}
