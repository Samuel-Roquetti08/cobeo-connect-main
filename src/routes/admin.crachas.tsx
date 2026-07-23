import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { useState, useEffect } from "react";
import { Search, Printer, QrCode as QrIcon, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useInscritosCracha } from "@/lib/api/adminHooks";
import { type CrachaInscrito } from "@/lib/api/adminData";
import { CATEGORIA_LABELS } from "@/lib/api/adminTypes";
import { normalizarBusca } from "@/lib/utils";
import QRCode from "qrcode";

export const Route = createFileRoute("/admin/crachas")({
  head: () => ({ meta: [{ title: "Crachás · Admin · II COBEO" }] }),
  component: () => (
    <AdminShell>
      <CrachasPage />
    </AdminShell>
  ),
});

// URL base do check-in — o QR Code aponta para cá, abrindo direto no participante
function checkinUrl(codigo: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/admin/checkin?codigo=${encodeURIComponent(codigo)}`;
}

// Hook que gera o data URL do QR Code para um código
function useQRCode(codigo: string): string | null {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(checkinUrl(codigo), { width: 240, margin: 1, color: { dark: "#731111", light: "#ffffff" } })
      .then((url: string) => { if (active) setDataUrl(url); })
      .catch(() => { if (active) setDataUrl(null); });
    return () => { active = false; };
  }, [codigo]);
  return dataUrl;
}

function CrachaPreview({ inscrito, mini = false }: { inscrito: CrachaInscrito; mini?: boolean }) {
  const qr = useQRCode(inscrito.codigoInscricao);
  const scale = mini ? 0.5 : 1;

  return (
    <div
      style={{
        width: 320 * scale, height: 200 * scale,
        border: `${2 * scale}px solid #731111`, borderRadius: 8 * scale,
        overflow: "hidden", fontFamily: "Poppins, sans-serif", background: "#fff",
      }}
      className="flex flex-col"
    >
      <div style={{ background: "#731111", color: "#fff", padding: `${8 * scale}px ${12 * scale}px` }}>
        <div style={{ fontSize: 13 * scale, fontWeight: 700, fontFamily: "Raleway" }}>II COBEO 2026</div>
        <div style={{ fontSize: 8 * scale, opacity: 0.85 }}>Congresso de Odontologia de Bebedouro</div>
      </div>
      <div className="flex flex-1" style={{ padding: 12 * scale }}>
        <div className="flex flex-1 flex-col justify-between">
          <div>
            <div style={{ fontSize: 15 * scale, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.1 }}>{inscrito.nome}</div>
            <div style={{ fontSize: 9 * scale, color: "#6b6b6b", marginTop: 2 * scale }}>{inscrito.email}</div>
          </div>
          <div>
            <div style={{ fontSize: 8 * scale, color: "#6b6b6b", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {inscrito.categoria ? CATEGORIA_LABELS[inscrito.categoria] : "Participante"}
            </div>
            <div style={{ fontSize: 11 * scale, fontWeight: 700, color: "#731111", fontFamily: "monospace" }}>
              {inscrito.codigoInscricao}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center" style={{ width: 72 * scale }}>
          {qr ? (
            <img src={qr} alt={`QR ${inscrito.codigoInscricao}`} style={{ width: 72 * scale, height: 72 * scale }} />
          ) : (
            <div className="flex items-center justify-center" style={{ width: 72 * scale, height: 72 * scale }}>
              <QrIcon className="text-[#731111]" style={{ width: 36 * scale, height: 36 * scale }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CrachasPage() {
  const { data: inscritos, isLoading, isError, error, refetch } = useInscritosCracha();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const all = inscritos ?? [];
  const filtered = all.filter((i) => !q || normalizarBusca(i.nome).includes(normalizarBusca(q)) || normalizarBusca(i.email).includes(normalizarBusca(q)));
  const inscritoSelecionado = all.find((i) => i.inscritoId === selected) ?? null;

  // Imprime todos os crachás filtrados — gera QR Codes e abre janela de impressão
  async function handlePrintAll() {
    if (filtered.length === 0) return;
    const partes = await Promise.all(filtered.map(async (i) => {
      const qr = await QRCode.toDataURL(checkinUrl(i.codigoInscricao), { width: 200, margin: 1, color: { dark: "#731111", light: "#ffffff" } });
      const cat = i.categoria ? CATEGORIA_LABELS[i.categoria] : "Participante";
      return `
        <div style="width:320px;height:200px;border:2px solid #731111;border-radius:8px;overflow:hidden;display:flex;flex-direction:column;font-family:Poppins,sans-serif;background:#fff;page-break-inside:avoid;margin:8px;">
          <div style="background:#731111;color:#fff;padding:8px 12px;">
            <div style="font-size:13px;font-weight:700;">II COBEO 2026</div>
            <div style="font-size:8px;opacity:.85;">Congresso de Odontologia de Bebedouro</div>
          </div>
          <div style="display:flex;flex:1;padding:12px;">
            <div style="display:flex;flex:1;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="font-size:15px;font-weight:700;color:#1a1a1a;">${i.nome}</div>
                <div style="font-size:9px;color:#6b6b6b;margin-top:2px;">${i.email}</div>
              </div>
              <div>
                <div style="font-size:8px;color:#6b6b6b;text-transform:uppercase;">${cat}</div>
                <div style="font-size:11px;font-weight:700;color:#731111;font-family:monospace;">${i.codigoInscricao}</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;justify-content:center;width:72px;">
              <img src="${qr}" style="width:72px;height:72px;" />
            </div>
          </div>
        </div>`;
    }));

    const janela = window.open("", "_blank");
    if (!janela) return;
    janela.document.write(`
      <html><head><title>Crachás II COBEO</title>
      <style>
        body{margin:0;padding:16px;display:flex;flex-wrap:wrap;gap:0;font-family:Poppins,sans-serif;}
        .print-btn{position:fixed;top:16px;right:16px;background:#731111;color:#fff;border:none;padding:10px 18px;border-radius:6px;cursor:pointer;font-size:14px;}
        @media print{.print-btn{display:none;}}
      </style></head>
      <body>
        <button class="print-btn" onclick="window.print()">Imprimir todos</button>
        ${partes.join("")}
      </body></html>`);
    janela.document.close();
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#6b6b6b]">
        <Loader2 className="h-8 w-8 animate-spin text-[#731111]" />
        <p className="text-sm">Carregando inscritos...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <p className="font-semibold text-[#1a1a1a]">Não foi possível carregar os crachás</p>
        <p className="max-w-md text-[13px] text-[#6b6b6b]">{(error as Error)?.message}</p>
        <button onClick={() => refetch()} className="mt-2 flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515]">
          <RefreshCw className="h-4 w-4" /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b6b6b]" />
              <input
                type="search" value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar inscrito confirmado..."
                className="w-full rounded-md border border-[#d9d9d9] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#731111]"
              />
            </div>
            <button
              onClick={handlePrintAll}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 rounded-md bg-[#731111] px-4 py-2 text-sm font-medium text-white hover:bg-[#8a1515] disabled:opacity-50"
            >
              <Printer className="h-4 w-4" /> Imprimir todos ({filtered.length})
            </button>
          </div>
          <p className="mt-2 text-[11px] text-[#6b6b6b]">Exibindo apenas inscritos com pagamento confirmado.</p>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#d9d9d9] bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[#f3f0ee] text-left text-[10px] font-semibold uppercase tracking-[0.05em] text-[#6b6b6b]">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Crachá</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-[#6b6b6b]">Nenhum inscrito confirmado.</td></tr>
              ) : filtered.map((i, idx) => (
                <tr key={i.inscritoId} className="border-t border-[#f0eceb] hover:bg-[#faf8f7]">
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{idx + 1}</td>
                  <td className="px-4 py-3 font-medium text-[#1a1a1a]">{i.nome}</td>
                  <td className="px-4 py-3"><code className="rounded bg-[#f3f0ee] px-2 py-0.5 font-mono text-[11px] text-[#731111]">{i.codigoInscricao}</code></td>
                  <td className="px-4 py-3 text-[12px] text-[#6b6b6b]">{i.categoria ? CATEGORIA_LABELS[i.categoria] : "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setSelected(i.inscritoId)} className="rounded p-1.5 text-[#6b6b6b] hover:bg-[#f3f0ee] hover:text-[#731111]">
                      <QrIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview lateral */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-[#d9d9d9] bg-white p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-[#1a1a1a]">Pré-visualização</h2>
          {inscritoSelecionado ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <CrachaPreview inscrito={inscritoSelecionado} />
              </div>
              <button
                onClick={() => {
                  const original = [q];
                  setQ(inscritoSelecionado.nome);
                  setTimeout(() => { handlePrintAll(); setQ(original[0]); }, 100);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-[#731111] px-4 py-2 text-sm font-medium text-[#731111] hover:bg-[#731111] hover:text-white"
              >
                <Printer className="h-4 w-4" /> Imprimir este crachá
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f3f0ee]">
                <QrIcon className="h-7 w-7 text-[#b5736f]" />
              </div>
              <p className="text-[13px] text-[#6b6b6b]">Selecione um inscrito para ver o crachá.</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
