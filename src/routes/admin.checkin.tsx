import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState, useRef, useEffect } from "react";
import {
  QrCode, Search, CheckCircle2, XCircle,
  Clock, Ticket, Calendar, Mic2, RotateCcw,
} from "lucide-react";
import {
  inscritos, INGRESSO_LABELS,
  type Inscrito,
} from "@/data/mockAdmin";
import { palestrasAvulsas, diasEvento } from "@/data/event";
import { StatusBadge } from "@/components/admin/StatusBadge";

export const Route = createFileRoute("/admin/checkin")({
  head: () => ({ meta: [{ title: "Check-in · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <CheckinPage />
    </AdminShell>
  ),
});

type CheckinResult = "autorizado" | "negado_pagamento" | "negado_ja_presente" | null;

function resolveDetalheIngresso(ins: Inscrito): string {
  if (ins.tipoIngresso === "palestra" && ins.palestraId) {
    const p = palestrasAvulsas.find((x) => x.id === ins.palestraId);
    return p ? `${p.titulo} — ${p.dia} às ${p.hora}` : ins.palestraId;
  }
  if (ins.tipoIngresso === "dia" && ins.diaId) {
    const d = diasEvento.find((x) => x.id === ins.diaId);
    return d ? d.label : ins.diaId;
  }
  return "Todos os dias (15, 16 e 17/08)";
}

function CheckinPage() {
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<Inscrito | null>(null);
  const [result, setResult] = useState<CheckinResult>(null);
  const [checkedIn, setCheckedIn] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function buscar(q: string) {
    const term = q.trim().toUpperCase();
    if (!term) return;
    const ins = inscritos.find(
      (i) =>
        i.codigoInscricao.toUpperCase() === term ||
        i.nome.toUpperCase().includes(term) ||
        i.email.toUpperCase().includes(term)
    );
    setFound(ins ?? null);
    setResult(null);
  }

  function fazerCheckin() {
    if (!found) return;
    if (found.status !== "Confirmado") {
      setResult("negado_pagamento");
      return;
    }
    if (checkedIn.has(found.id)) {
      setResult("negado_ja_presente");
      return;
    }
    setCheckedIn((prev) => new Set([...prev, found.id]));
    setResult("autorizado");
  }

  function resetar() {
    setQuery("");
    setFound(null);
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  const detalhe = found ? resolveDetalheIngresso(found) : "";
  const jaPresente = found ? checkedIn.has(found.id) : false;

  // Estatísticas rápidas
  const totalConfirmados = inscritos.filter((i) => i.status === "Confirmado").length;
  const totalPresentes = checkedIn.size;

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Confirmados", value: totalConfirmados, color: "#2d7a3a" },
          { label: "Check-in feito", value: totalPresentes, color: "#731111" },
          { label: "Aguardando", value: totalConfirmados - totalPresentes, color: "#C9A84C" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[#d9d9d9] bg-white p-4 text-center"
            style={{ borderTop: `3px solid ${s.color}` }}
          >
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: "Raleway", color: s.color }}
            >
              {s.value}
            </div>
            <div className="mt-0.5 text-[11px] text-[#6b6b6b]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Painel principal */}
      <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">

        {/* Busca */}
        <div className="border-b border-[#f0eceb] p-6">
          <label
            htmlFor="checkin-search"
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-[#6b6b6b]"
          >
            Código de inscrição, nome ou e-mail
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCode
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]"
                aria-hidden="true"
              />
              <input
                id="checkin-search"
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && buscar(query)}
                placeholder="Ex: COBEO-0001 ou Ana Souza"
                className="w-full rounded-md border border-[#d9d9d9] bg-white py-2.5 pl-9 pr-3 font-mono text-sm uppercase tracking-wider outline-none transition-colors focus:border-[#731111] focus:ring-1 focus:ring-[#731111]"
                autoComplete="off"
                autoCapitalize="characters"
              />
            </div>
            <button
              onClick={() => buscar(query)}
              className="flex items-center gap-2 rounded-md bg-[#731111] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#8a1515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Buscar
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[#6b6b6b]">
            Cole o código do QR Code do crachá ou busque pelo nome. Pressione Enter para buscar.
          </p>
        </div>

        {/* Resultado — inscrito encontrado */}
        {found && result === null && (
          <div className="p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#1a1a1a]" style={{ fontFamily: "Raleway" }}>
                  {found.nome}
                </h2>
                <p className="text-[13px] text-[#6b6b6b]">{found.email}</p>
              </div>
              <StatusBadge status={found.status} />
            </div>

            {/* Detalhes da compra */}
            <div className="mb-5 space-y-2 rounded-lg bg-[#f9f6f4] p-4">
              <DetailRow
                icon={<Ticket className="h-4 w-4 text-[#731111]" />}
                label="Tipo de ingresso"
                value={INGRESSO_LABELS[found.tipoIngresso]}
              />
              <DetailRow
                icon={
                  found.tipoIngresso === "palestra"
                    ? <Mic2 className="h-4 w-4 text-[#731111]" />
                    : <Calendar className="h-4 w-4 text-[#731111]" />
                }
                label={found.tipoIngresso === "palestra" ? "Palestra" : "Cobertura"}
                value={detalhe}
              />
              <DetailRow
                icon={<QrCode className="h-4 w-4 text-[#731111]" />}
                label="Código"
                value={found.codigoInscricao}
                mono
              />
            </div>

            {/* Alerta se já fez check-in */}
            {jaPresente && (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3">
                <Clock className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
                <p className="text-[13px] font-medium text-amber-800">
                  Este participante já realizou check-in nesta sessão.
                </p>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3">
              <button
                onClick={fazerCheckin}
                disabled={found.status !== "Confirmado"}
                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#731111] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#8a1515] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Confirmar Presença
              </button>
              <button
                onClick={resetar}
                className="flex items-center gap-2 rounded-md border border-[#d9d9d9] px-4 py-3 text-sm font-medium text-[#6b6b6b] transition-colors hover:border-[#731111] hover:text-[#731111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#731111]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Resultado — não encontrado */}
        {query && found === null && result === null && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <XCircle className="h-10 w-10 text-[#d9d9d9]" aria-hidden="true" />
            <p className="font-semibold text-[#1a1a1a]">Nenhum inscrito encontrado</p>
            <p className="text-[13px] text-[#6b6b6b]">
              Verifique o código ou tente buscar pelo nome.
            </p>
            <button onClick={resetar} className="mt-2 text-sm font-semibold text-[#731111] underline">
              Tentar novamente
            </button>
          </div>
        )}

        {/* Resultado — AUTORIZADO */}
        {result === "autorizado" && found && (
          <ResultPanel
            type="autorizado"
            nome={found.nome}
            ingresso={INGRESSO_LABELS[found.tipoIngresso]}
            detalhe={detalhe}
            onReset={resetar}
          />
        )}

        {/* Resultado — NEGADO pagamento */}
        {result === "negado_pagamento" && found && (
          <ResultPanel
            type="negado"
            nome={found.nome}
            motivo={`Pagamento com status: ${found.status}. O acesso não é permitido sem confirmação de pagamento.`}
            ingresso={INGRESSO_LABELS[found.tipoIngresso]}
            detalhe={detalhe}
            onReset={resetar}
          />
        )}

        {/* Resultado — NEGADO já presente */}
        {result === "negado_ja_presente" && found && (
          <ResultPanel
            type="negado"
            nome={found.nome}
            motivo="Este participante já realizou check-in anteriormente nesta sessão."
            ingresso={INGRESSO_LABELS[found.tipoIngresso]}
            detalhe={detalhe}
            onReset={resetar}
          />
        )}

        {/* Estado vazio inicial */}
        {!found && result === null && !query && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f0ee]">
              <QrCode className="h-8 w-8 text-[#b5736f]" aria-hidden="true" />
            </div>
            <p className="font-semibold text-[#1a1a1a]">Aguardando leitura</p>
            <p className="max-w-xs text-[13px] text-[#6b6b6b]">
              Digite o código do crachá ou use um leitor de QR Code conectado ao teclado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────────────────────── */

function DetailRow({
  icon, label, value, mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0" aria-hidden="true">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6b6b]">
          {label}
        </div>
        <div
          className={`text-[13px] font-medium text-[#1a1a1a] ${mono ? "font-mono" : ""}`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ResultPanel({
  type, nome, ingresso, detalhe, motivo, onReset,
}: {
  type: "autorizado" | "negado";
  nome: string;
  ingresso: string;
  detalhe: string;
  motivo?: string;
  onReset: () => void;
}) {
  const isOk = type === "autorizado";

  return (
    <div
      className={`flex flex-col items-center p-8 text-center ${
        isOk ? "bg-green-50" : "bg-red-50"
      }`}
      role="status"
      aria-live="assertive"
    >
      {/* Ícone grande */}
      <div
        className={`mb-4 flex h-24 w-24 items-center justify-center rounded-full ${
          isOk ? "bg-green-100" : "bg-red-100"
        }`}
      >
        {isOk ? (
          <CheckCircle2 className="h-14 w-14 text-green-600" aria-hidden="true" />
        ) : (
          <XCircle className="h-14 w-14 text-red-600" aria-hidden="true" />
        )}
      </div>

      {/* Status */}
      <h2
        className={`text-3xl font-extrabold tracking-tight ${
          isOk ? "text-green-700" : "text-red-700"
        }`}
        style={{ fontFamily: "Raleway" }}
      >
        {isOk ? "AUTORIZADO" : "NÃO AUTORIZADO"}
      </h2>

      {/* Nome */}
      <p className="mt-2 text-[17px] font-semibold text-[#1a1a1a]">{nome}</p>

      {/* Detalhe do ingresso */}
      <div className="mt-3 rounded-lg border border-[#d9d9d9] bg-white px-4 py-3 text-left w-full max-w-sm">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#6b6b6b]">
          Ingresso
        </div>
        <div className="mt-0.5 text-[13px] font-semibold text-[#731111]">{ingresso}</div>
        <div className="mt-1 text-[12px] text-[#6b6b6b]">{detalhe}</div>
      </div>

      {/* Motivo da negação */}
      {!isOk && motivo && (
        <p className="mt-3 max-w-xs text-[13px] text-red-700">{motivo}</p>
      )}

      {/* Botão próximo */}
      <button
        onClick={onReset}
        className={`mt-6 flex items-center gap-2 rounded-md px-8 py-3 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 ${
          isOk
            ? "bg-green-700 hover:bg-green-800 focus-visible:ring-green-500"
            : "bg-red-700 hover:bg-red-800 focus-visible:ring-red-500"
        }`}
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Próximo participante
      </button>
    </div>
  );
}
