import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState, useRef, useEffect, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode, Search, CheckCircle2, XCircle, Clock, RotateCcw, Loader2, BookOpen, X, CameraOff,
} from "lucide-react";
import { buscarParaCheckin, registrarPresenca, type InscritoCheckin } from "@/lib/api/adminData";
import { cursos as cursosEvento } from "@/data/event";
import { useAdminAuth } from "@/lib/adminAuth";
import { CATEGORIA_LABELS, type PedidoCurso } from "@/lib/api/adminTypes";
import { toast } from "sonner";

// Região do DOM onde o html5-qrcode injeta o preview da câmera
const QR_REGION_ID = "checkin-qr-region";

export const Route = createFileRoute("/admin/checkin")({
  head: () => ({ meta: [{ title: "Check-in · Admin · II COBEO" }] }),
  validateSearch: (search: Record<string, unknown>): { codigo?: string } => {
    return typeof search.codigo === "string" ? { codigo: search.codigo } : {};
  },
  component: () => (
    <AdminShell>
      <CheckinPage />
    </AdminShell>
  ),
});

// Três estados possíveis do check-in por curso
type EstadoCurso = "autorizado" | "ja_confirmado" | "sem_autorizacao";

function CheckinPage() {
  const search = useSearch({ from: "/admin/checkin" });
  const { user } = useAdminAuth();

  // Curso que o fiscal seleciona antes de começar a ler QR Codes
  const [cursoRef, setCursoRef] = useState<string>(cursosEvento[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<InscritoCheckin | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrando, setRegistrando] = useState(false);
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
    try {
      const res = await buscarParaCheckin(term);
      if (res) setFound(res);
      else setNotFound(true);
    } catch (e) {
      toast.error("Erro na busca", { description: (e as Error)?.message });
    } finally {
      setLoading(false);
    }
  }, []);

  // Se veio ?codigo= na URL (do QR Code do crachá), busca automaticamente
  useEffect(() => {
    if (search.codigo) {
      setQuery(search.codigo);
      buscar(search.codigo);
    } else {
      inputRef.current?.focus();
    }
  }, [search.codigo, buscar]);

  // Câmera do QR Code: a leitura só extrai o código e alimenta a MESMA busca
  // já existente (buscar) — não há lógica de autorização aqui, fonte única
  // de verdade continua em getEstado/registrarPresenca.
  // Requer HTTPS (ou localhost) — ver nota no botão "Ler QR Code".
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

  // Determina o estado do inscrito para o curso selecionado
  function getEstado(ins: InscritoCheckin): EstadoCurso {
    const temCurso = ins.cursos.some((c) => c.curso_ref === cursoRef);
    if (!temCurso) return "sem_autorizacao";
    const jaConfirmado = ins.presencas.some((p) => p.curso_ref === cursoRef);
    if (jaConfirmado) return "ja_confirmado";
    return "autorizado";
  }

  async function confirmarPresenca() {
    if (!found || !user) return;
    setRegistrando(true);
    try {
      await registrarPresenca(found.inscritoId, cursoRef, user.email);
      // Atualiza o estado local para refletir a confirmação
      setFound({
        ...found,
        presencas: [...found.presencas, { curso_ref: cursoRef, confirmado_em: new Date().toISOString() }],
      });
      toast.success("Presença confirmada", { description: found.nome });
    } catch (e) {
      const msg = (e as Error)?.message ?? "";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        toast.error("Já confirmado", { description: "Este participante já fez check-in neste curso." });
      } else {
        toast.error("Erro ao confirmar", { description: msg });
      }
    } finally {
      setRegistrando(false);
    }
  }

  function resetar() {
    setQuery("");
    setFound(null);
    setNotFound(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const cursoSelecionado = cursosEvento.find((c) => c.id === cursoRef);
  const estado = found ? getEstado(found) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Seletor de curso — o fiscal escolhe qual sessão está acontecendo */}
      <div className="rounded-xl border border-[#d9d9d9] bg-white p-5">
        <label htmlFor="curso-select" className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b]">
          <BookOpen className="h-3.5 w-3.5" /> Curso / Palestra em andamento
        </label>
        <select
          id="curso-select"
          value={cursoRef}
          onChange={(e) => { setCursoRef(e.target.value); resetar(); }}
          className="w-full rounded-md border border-[#d9d9d9] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#731111]"
        >
          {cursosEvento.map((c) => (
            <option key={c.id} value={c.id}>{c.dia} · {c.horario} — {c.titulo}</option>
          ))}
        </select>
        <p className="mt-2 text-[11px] text-[#6b6b6b]">
          Selecione o curso antes de ler os QR Codes. O check-in será registrado para esta sessão.
        </p>
      </div>

      {/* Painel principal */}
      <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
        {/* Busca */}
        <div className="border-b border-[#f0eceb] p-6">
          <label htmlFor="checkin-search" className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b]">
            Código de inscrição, nome ou e-mail
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" aria-hidden="true" />
              <input
                id="checkin-search"
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

        {/* Resultado por estado */}
        {found && estado && (
          <ResultPanel
            estado={estado}
            nome={found.nome}
            email={found.email}
            codigo={found.codigoInscricao}
            categoria={found.categoria ? CATEGORIA_LABELS[found.categoria] : "—"}
            cursoTitulo={cursoSelecionado?.titulo ?? ""}
            statusPagamento={found.status}
            cursosPermitidos={found.cursos}
            onConfirm={confirmarPresenca}
            onReset={resetar}
            registrando={registrando}
          />
        )}

        {/* Não encontrado */}
        {notFound && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <XCircle className="h-10 w-10 text-[#d9d9d9]" />
            <p className="font-semibold text-[#1a1a1a]">Nenhum inscrito encontrado</p>
            <p className="text-[13px] text-[#6b6b6b]">Verifique o código ou busque pelo nome.</p>
            <button onClick={resetar} className="mt-2 text-sm font-semibold text-[#731111] underline">Tentar novamente</button>
          </div>
        )}

        {/* Estado inicial */}
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
  estado, nome, email, codigo, categoria, cursoTitulo, statusPagamento,
  cursosPermitidos, onConfirm, onReset, registrando,
}: {
  estado: EstadoCurso;
  nome: string; email: string; codigo: string; categoria: string;
  cursoTitulo: string; statusPagamento: string;
  cursosPermitidos: PedidoCurso[];
  onConfirm: () => void; onReset: () => void; registrando: boolean;
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
    sem_autorizacao: {
      bg: "bg-red-50", iconBg: "bg-red-100", iconColor: "text-red-600",
      titleColor: "text-red-700", title: "SEM AUTORIZAÇÃO", icon: XCircle,
    },
  }[estado];

  const Icon = config.icon;
  // Bloqueio extra: mesmo autorizado, se o pagamento não está pago, alerta
  const pagamentoPendente = statusPagamento !== "pago";

  return (
    <div className={`flex flex-col items-center p-8 text-center ${config.bg}`} role="status" aria-live="assertive">
      <div className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full ${config.iconBg}`}>
        <Icon className={`h-14 w-14 ${config.iconColor}`} aria-hidden="true" />
      </div>
      <h2 className={`text-3xl font-extrabold tracking-tight ${config.titleColor}`} style={{ fontFamily: "Raleway" }}>
        {config.title}
      </h2>
      <p className="mt-2 text-[17px] font-semibold text-[#1a1a1a]">{nome}</p>
      <p className="text-[13px] text-[#6b6b6b]">{email}</p>

      <div className="mt-3 w-full max-w-sm rounded-lg border border-[#d9d9d9] bg-white px-4 py-3 text-left">
        <Row label="Código" value={codigo} mono />
        <Row label="Categoria" value={categoria} />
        <Row label="Curso desta sessão" value={cursoTitulo} />
      </div>

      {estado === "sem_autorizacao" && (
        <div className="mt-4 w-full max-w-sm rounded-lg border border-red-200 bg-white px-4 py-4 text-left">
          <p className="text-[13px] font-semibold text-[#1a1a1a]">Este participante tem direito a:</p>
          {cursosPermitidos.length === 0
            ? <p className="mt-2 text-[13px] text-[#6b6b6b]">Nenhum curso comprado.</p>
            : (
              <ul className="mt-2 space-y-2">
                {cursosPermitidos.map((c) => {
                  const evento = cursosEvento.find((ce) => ce.id === c.curso_ref);
                  return (
                    <li key={c.id} className="text-[15px] font-medium text-[#1a1a1a]">
                      • {c.curso_titulo}
                      {evento && <span className="block text-[13px] font-normal text-[#6b6b6b]">{evento.dia} · {evento.horario}</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          <p className="mt-3 text-[11px] text-[#6b6b6b]">O curso tentado não faz parte do ingresso dele.</p>
        </div>
      )}

      {estado === "autorizado" && pagamentoPendente && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-[13px] text-amber-800">
          <Clock className="h-4 w-4 shrink-0" />
          Atenção: pagamento com status "{statusPagamento}".
        </div>
      )}

      {estado === "autorizado" && (
        <button
          onClick={onConfirm}
          disabled={registrando}
          className="mt-6 flex items-center gap-2 rounded-md bg-green-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
        >
          {registrando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Confirmar Presença
        </button>
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