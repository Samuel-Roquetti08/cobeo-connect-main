import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState, useRef } from "react";
import { Search, Download, Printer, BadgeCheck, QrCode, PrinterCheck } from "lucide-react";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { inscritos } from "@/data/mockAdmin";

export const Route = createFileRoute("/admin/crachas")({
  head: () => ({ meta: [{ title: "Crachás · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <CrachasPage />
    </AdminShell>
  ),
});

// Gera QR Code como SVG simples (placeholder — em produção usar biblioteca qrcode)
function QRCodePlaceholder({ value, size = 80 }: { value: string; size?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded bg-white"
      style={{ width: size, height: size, border: "1px solid #e5e7eb" }}
      title={`QR Code: ${value}`}
      aria-label={`QR Code para inscrição ${value}`}
    >
      <QrCode className="text-[#731111]" style={{ width: size * 0.6, height: size * 0.6 }} />
    </div>
  );
}

// Preview do crachá — design institucional
function CrachaPreview({
  nome,
  email,
  codigo,
  mini = false,
}: {
  nome: string;
  email: string;
  codigo: string;
  mini?: boolean;
}) {
  const scale = mini ? 0.38 : 1;
  const W = 320;
  const H = 200;

  return (
    <div
      style={{
        width: W * scale,
        height: H * scale,
        transformOrigin: "top left",
        overflow: "hidden",
        borderRadius: 8 * scale,
      }}
    >
      <div
        style={{
          width: W,
          height: H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          fontFamily: "Poppins, sans-serif",
          background: "#fff",
          border: "2px solid #731111",
          borderRadius: 8,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header vinho */}
        <div
          style={{
            background: "#731111",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                color: "#C9A84C",
                fontSize: 8,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              UNIFAFIBE · Odontologia
            </div>
            <div
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                fontFamily: "Raleway, sans-serif",
              }}
            >
              II COBEO 2026
            </div>
          </div>
          {/* Selo dourado */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              border: "2px solid #C9A84C",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#C9A84C",
              fontSize: 9,
              fontWeight: 700,
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            II<br />ED.
          </div>
        </div>

        {/* Corpo */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            gap: 14,
          }}
        >
          {/* Dados do inscrito */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 7,
                color: "#6b6b6b",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 3,
              }}
            >
              Participante
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#1a1a1a",
                fontFamily: "Raleway, sans-serif",
                lineHeight: 1.2,
                marginBottom: 4,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {nome}
            </div>
            <div
              style={{
                fontSize: 9,
                color: "#6b6b6b",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {email}
            </div>
            {/* Código */}
            <div
              style={{
                marginTop: 10,
                display: "inline-block",
                background: "#f9f6f4",
                border: "1px solid #d9d9d9",
                borderRadius: 4,
                padding: "2px 8px",
                fontFamily: "monospace",
                fontSize: 10,
                color: "#731111",
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              {codigo}
            </div>
          </div>

          {/* QR Code */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <QRCodePlaceholder value={codigo} size={72} />
            <div style={{ fontSize: 7, color: "#6b6b6b", textAlign: "center" }}>
              Check-in
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: "1px solid #f0eceb",
            padding: "5px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 7, color: "#b5736f" }}>
            Bebedouro · SP · Agosto 2026
          </div>
          <div
            style={{
              width: 20,
              height: 2,
              background: "#C9A84C",
              borderRadius: 2,
            }}
          />
          <div style={{ fontSize: 7, color: "#b5736f" }}>
            scientia ad vitam
          </div>
        </div>
      </div>
    </div>
  );
}

function CrachasPage() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Filtra apenas inscritos confirmados
  const confirmados = inscritos.filter((i) => i.status === "Confirmado");
  const filtered = confirmados.filter(
    (i) =>
      !q ||
      i.nome.toLowerCase().includes(q.toLowerCase()) ||
      i.email.toLowerCase().includes(q.toLowerCase())
  );

  const inscritoSelecionado = confirmados.find((i) => i.id === selected);

  function handlePrintAll() {
    // Gera o HTML de todos os crachás da lista filtrada atual
    const crachasHTML = filtered.map((inscrito) => {
      const codigo = `COBEO-${inscrito.id.replace("ins-", "").padStart(4, "0")}`;
      // Reutiliza o mesmo design do CrachaPreview renderizado como string HTML inline
      return `
        <div style="
          width:320px; height:200px; border:2px solid #731111; border-radius:8px;
          overflow:hidden; display:flex; flex-direction:column;
          font-family:Poppins,sans-serif; background:#fff;
          page-break-inside:avoid; margin-bottom:16px;
        ">
          <!-- Header -->
          <div style="background:#731111;padding:10px 16px;display:flex;align-items:center;justify-content:space-between;">
            <div>
              <div style="color:#C9A84C;font-size:8px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">
                UNIFAFIBE · Odontologia
              </div>
              <div style="color:#fff;font-size:13px;font-weight:800;font-family:Raleway,sans-serif;">
                II COBEO 2026
              </div>
            </div>
            <div style="width:36px;height:36px;border-radius:50%;border:2px solid #C9A84C;display:flex;align-items:center;justify-content:center;color:#C9A84C;font-size:9px;font-weight:700;text-align:center;line-height:1.1;">
              II<br/>ED.
            </div>
          </div>
          <!-- Corpo -->
          <div style="flex:1;display:flex;align-items:center;padding:12px 16px;gap:14px;">
            <div style="flex:1;min-width:0;">
              <div style="font-size:7px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px;">Participante</div>
              <div style="font-size:15px;font-weight:700;color:#1a1a1a;font-family:Raleway,sans-serif;line-height:1.2;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${inscrito.nome}
              </div>
              <div style="font-size:9px;color:#6b6b6b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${inscrito.email}
              </div>
              <div style="margin-top:10px;display:inline-block;background:#f9f6f4;border:1px solid #d9d9d9;border-radius:4px;padding:2px 8px;font-family:monospace;font-size:10px;color:#731111;font-weight:700;letter-spacing:0.08em;">
                ${codigo}
              </div>
            </div>
            <!-- QR Code placeholder -->
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;">
              <div style="width:72px;height:72px;border:1px solid #e5e7eb;border-radius:4px;background:#fff;display:flex;align-items:center;justify-content:center;">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#731111" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/>
                  <path d="M17 17h4v4h-4z"/><path d="M14 17v4"/><path d="M17 14h4"/>
                </svg>
              </div>
              <div style="font-size:7px;color:#6b6b6b;text-align:center;">Check-in</div>
            </div>
          </div>
          <!-- Footer -->
          <div style="border-top:1px solid #f0eceb;padding:5px 16px;display:flex;justify-content:space-between;align-items:center;">
            <div style="font-size:7px;color:#b5736f;">Bebedouro · SP · Agosto 2026</div>
            <div style="width:20px;height:2px;background:#C9A84C;border-radius:2px;"></div>
            <div style="font-size:7px;color:#b5736f;">scientia ad vitam</div>
          </div>
        </div>
      `;
    }).join("");

    const janela = window.open("", "_blank", "width=900,height=700");
    if (!janela) return;
    janela.document.write(`
      <html>
        <head>
          <title>Crachás · II COBEO · ${filtered.length} participantes</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@700;800&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Poppins, sans-serif; background: #f9f6f4; padding: 24px; }
            .header {
              display: flex; align-items: center; justify-content: space-between;
              margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #731111;
            }
            .header h1 { font-family: Raleway, sans-serif; font-size: 20px; color: #731111; }
            .header p { font-size: 12px; color: #6b6b6b; margin-top: 2px; }
            .grid {
              display: grid;
              grid-template-columns: repeat(auto-fill, 320px);
              gap: 16px;
              justify-content: center;
            }
            .print-btn {
              background: #731111; color: white; border: none; border-radius: 6px;
              padding: 10px 24px; font-family: Poppins, sans-serif; font-size: 13px;
              font-weight: 600; cursor: pointer;
            }
            .print-btn:hover { background: #8a1515; }
            @media print {
              .header .print-btn { display: none; }
              body { background: white; padding: 8px; }
              .grid { gap: 8px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>II COBEO 2026 — Crachás</h1>
              <p>${filtered.length} participante(s) confirmado(s)</p>
            </div>
            <button class="print-btn" onclick="window.print()">🖨️ Imprimir todos</button>
          </div>
          <div class="grid">
            ${crachasHTML}
          </div>
        </body>
      </html>
    `);
    janela.document.close();
    janela.focus();
  }

  function handlePrint() {
    if (!printRef.current) return;
    const conteudo = printRef.current.innerHTML;
    const janela = window.open("", "_blank", "width=400,height=300");
    if (!janela) return;
    janela.document.write(`
      <html>
        <head>
          <title>Crachá · ${inscritoSelecionado?.nome}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link href="https://fonts.googleapis.com/css2?family=Raleway:wght@700;800&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
          <style>
            body { margin: 0; padding: 24px; font-family: Poppins, sans-serif; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${conteudo}</body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    setTimeout(() => { janela.print(); janela.close(); }, 500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Coluna esquerda — lista */}
      <div className="space-y-4">
        {/* Barra de ações — topo */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[#d9d9d9] bg-white p-4">
          <div>
            <p className="text-[14px] font-semibold text-[#1a1a1a]">
              {filtered.length === confirmados.length
                ? `${confirmados.length} crachás disponíveis`
                : `${filtered.length} de ${confirmados.length} crachás (filtrado)`}
            </p>
            <p className="text-[11px] text-[#6b6b6b]">
              Apenas inscritos com pagamento confirmado
            </p>
          </div>
          <button
            onClick={handlePrintAll}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8a1515] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
          >
            <PrinterCheck className="h-4 w-4" aria-hidden="true" />
            Imprimir Todos
          </button>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Confirmados", value: confirmados.length, color: "#2d7a3a" },
            { label: "Crachás gerados", value: confirmados.length, color: "#731111" },
            { label: "Pendentes", value: inscritos.filter(i => i.status === "Pendente").length, color: "#C9A84C" },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-[#d9d9d9] bg-white p-4"
              style={{ borderLeft: `4px solid ${s.color}` }}
            >
              <div className="text-[12px] text-[#6b6b6b]">{s.label}</div>
              <div
                className="mt-1 text-2xl font-bold text-[#1a1a1a]"
                style={{ fontFamily: "Raleway" }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Busca */}
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar inscrito confirmado..."
              aria-label="Buscar inscrito"
              className="w-full rounded-md border border-[#d9d9d9] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#731111] focus:ring-1 focus:ring-[#731111]"
            />
          </div>
          <p className="mt-2 text-[11px] text-[#6b6b6b]">
            Exibindo apenas inscritos com pagamento confirmado.
          </p>
        </div>

        {/* Tabela */}
        <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="grid" aria-label="Lista de inscritos confirmados">
              <thead className="bg-[#f3f0ee]">
                <tr>
                  {["#", "Nome", "Código", "Status", "Crachá"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((inscrito, idx) => {
                  // Código simulado baseado no ID
                  const codigo = `COBEO-${inscrito.id.replace("ins-", "").padStart(4, "0")}`;
                  const isSelected = selected === inscrito.id;
                  return (
                    <tr
                      key={inscrito.id}
                      className={`border-t border-[#f0eceb] transition-colors ${
                        isSelected ? "bg-[#fff8f8]" : "hover:bg-[#faf8f7]"
                      }`}
                    >
                      <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#1a1a1a]">{inscrito.nome}</div>
                        <div className="text-[11px] text-[#6b6b6b]">{inscrito.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <code className="rounded bg-[#f3f0ee] px-2 py-0.5 font-mono text-[11px] text-[#731111]">
                          {codigo}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inscrito.status} />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelected(isSelected ? null : inscrito.id)}
                          aria-pressed={isSelected}
                          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#731111] ${
                            isSelected
                              ? "bg-[#731111] text-white"
                              : "border border-[#d9d9d9] text-[#6b6b6b] hover:border-[#731111] hover:text-[#731111]"
                          }`}
                        >
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          {isSelected ? "Selecionado" : "Visualizar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-sm text-[#6b6b6b]"
                    >
                      Nenhum inscrito confirmado encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Coluna direita — preview do crachá */}
      <aside aria-label="Preview e impressão do crachá" className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-[#1a1a1a]">
            Preview do Crachá
          </h2>

          {inscritoSelecionado ? (
            <>
              {/* Preview em tamanho real */}
              <div ref={printRef} className="flex justify-center">
                <CrachaPreview
                  nome={inscritoSelecionado.nome}
                  email={inscritoSelecionado.email}
                  codigo={`COBEO-${inscritoSelecionado.id.replace("ins-", "").padStart(4, "0")}`}
                />
              </div>

              {/* Info do inscrito */}
              <div className="mt-4 space-y-2 rounded-lg bg-[#f9f6f4] p-3 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-[#6b6b6b]">Nome</span>
                  <span className="font-medium text-[#1a1a1a]">{inscritoSelecionado.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6b6b6b]">Status</span>
                  <StatusBadge status={inscritoSelecionado.status} />
                </div>
              </div>

              {/* Ações */}
              <div className="mt-4 flex flex-col gap-2">
                <button
                  onClick={handlePrint}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-[#731111] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8a1515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84C]"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  Imprimir Crachá
                </button>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-[#d9d9d9] px-4 py-2.5 text-sm font-medium text-[#6b6b6b] transition-colors hover:border-[#731111] hover:text-[#731111] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#731111]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Baixar PDF
                </button>
              </div>
            </>
          ) : (
            /* Estado vazio */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f0ee]">
                <BadgeCheck className="h-7 w-7 text-[#b5736f]" aria-hidden="true" />
              </div>
              <p className="text-[13px] font-medium text-[#1a1a1a]">
                Nenhum crachá selecionado
              </p>
              <p className="mt-1 text-[11px] text-[#6b6b6b]">
                Clique em "Visualizar" em um inscrito confirmado para ver o preview.
              </p>
            </div>
          )}
        </div>

        {/* Card de instrução */}
        <div className="rounded-xl border border-[#C9A84C]/40 bg-[#fff8f4] p-4">
          <h3 className="mb-2 text-[13px] font-semibold text-[#1a1a1a]">
            Sobre os Crachás
          </h3>
          <ul className="space-y-1.5 text-[12px] text-[#6b6b6b]">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#C9A84C]">•</span>
              Cada crachá contém um QR Code único vinculado ao código de inscrição.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#C9A84C]">•</span>
              O QR Code será usado para controle de presença na entrada do evento.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[#C9A84C]">•</span>
              Apenas inscritos com pagamento confirmado têm crachá disponível.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}