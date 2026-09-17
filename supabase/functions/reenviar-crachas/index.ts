// ============================================================================
// COBEO CONNECT — Edge Function: reenviar-crachas
// ============================================================================
// Ação de admin: reenvio em lote do crachá (badge com QR) por e-mail para
// participantes com pagamento confirmado. Diferente de certificados (que nunca
// são reenviados), crachás podem ser reenviados multiplas vezes (ex: na
// véspera do evento). Só admin autenticado invoca: além do verify_jwt do
// gateway, a guarda exigirAdmin() confere que o token é de uma sessão de
// usuário de verdade (a chave publicável do site sozinha não passa).
//
// Idempotente e retomável: elegibilidade é sempre recalculada no servidor (via
// vw_crachas_reenvio — nunca confia no client) e cada inscrito é marcado em
// inscritos.cracha_reenviado_em apenas após sucesso do Resend. Processa em
// lotes (parâmetro `limite`) para não estourar o tempo da function; o client
// reinvoca até `restantes` chegar a zero.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { exigirAdmin } from "../_shared/authAdmin.ts";
import { gerarQrCodeBase64, montarCrachaHtml, EVENTO_INFO, CURSOS_INFO } from "../_shared/emailConfirmacao.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEY = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"];
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "COBEO <onboarding@resend.dev>";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://cobeo-connect-main.samuelroquetti.workers.dev";

const supabase = createClient(SUPABASE_URL, SECRET_KEY);

const LIMITE_PADRAO = 20;
const PAUSA_MS = 350;

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface CrachaReenvioRow {
  inscrito_id: string;
  codigo_inscricao: string;
  pedido_id: string;
  nome: string;
  email: string;
  jantar_opcao: string | null;
}

async function enviarUm(row: CrachaReenvioRow): Promise<boolean> {
  const { data: pedidoCursos, error: cursosErr } = await supabase
    .from("pedido_cursos")
    .select("curso_ref, curso_titulo")
    .eq("pedido_id", row.pedido_id);

  if (cursosErr || !pedidoCursos) {
    console.error("[reenviar-crachas] erro ao buscar cursos", row.pedido_id, cursosErr);
    return false;
  }

  // Monta as linhas de cursos (dia e horário)
  const linhasCursos = (pedidoCursos ?? [])
    .map((pc) => {
      const info = (CURSOS_INFO as Record<string, { titulo: string; dia: string; horario: string }>)[pc.curso_ref];
      return `<li style="margin-bottom:4px;">${pc.curso_titulo}${info ? ` — ${info.dia}, ${info.horario}` : ""}</li>`;
    })
    .join("");

  // Gera o QR
  const qrBase64 = await gerarQrCodeBase64(SITE_URL, row.codigo_inscricao);
  const qrContentId = "cracha-qrcode-reenvio";

  // Monta o crachá
  const crachaHtml = montarCrachaHtml({
    nome: row.nome,
    codigo: row.codigo_inscricao,
    linhasCursos,
    jantarOpcao: row.jantar_opcao,
    qrContentId,
    temQr: !!qrBase64,
    qrBase64,
  });

  // Monta o e-mail
  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; max-width: 560px;">
      <h2 style="color:#731111;">Seu crachá de acesso — II COBEO</h2>
      <p>Olá, ${row.nome}!</p>
      <p>Enviamos novamente seu crachá de acesso para o <strong>II COBEO — Congresso de Odontologia de Bebedouro</strong>.
      Guarde este e-mail (ou tire um print da tela) e apresente o código/QR na entrada das palestras.</p>
      ${crachaHtml}
      <hr />
      <p><strong>Evento:</strong> ${EVENTO_INFO.data} — ${EVENTO_INFO.local}.</p>
      <p style="font-size:12px;color:#6b6b6b;">Dúvidas: cobeounifafibe@gmail.com</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [row.email],
        subject: "Seu crachá de acesso — II COBEO",
        html,
        ...(qrBase64
          ? { attachments: [{ content: qrBase64, filename: "qrcode-cracha.png", content_id: qrContentId }] }
          : {}),
      }),
    });
    if (!res.ok) {
      console.error("[reenviar-crachas] Resend retornou erro", await res.text());
      return false;
    }
  } catch (e) {
    console.error("[reenviar-crachas] falha ao enviar via Resend", e);
    return false;
  }

  // Marca só após envio confirmado — deixa o inscrito na fila se falhar.
  const { error: updErr } = await supabase
    .from("inscritos")
    .update({ cracha_reenviado_em: new Date().toISOString() })
    .eq("id", row.inscrito_id);
  if (updErr) {
    // E-mail já foi — logar, mas contar como enviado.
    console.error("[reenviar-crachas] e-mail enviado mas falhou ao marcar", row.inscrito_id, updErr);
  }
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  // Ação de admin: exige sessão de usuário autenticado, não só uma credencial
  // do projeto (a chave publicável é pública — ver _shared/authAdmin.ts).
  const negado = await exigirAdmin(supabase, req);
  if (negado) return negado;

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  if (!RESEND_API_KEY) {
    return jsonResponse({ error: "RESEND_API_KEY não configurado." }, 500);
  }

  let limite = LIMITE_PADRAO;
  let desde: string | null = null;
  try {
    const body = await req.json();
    if (typeof body?.limite === "number" && body.limite > 0) limite = Math.min(body.limite, 100);
    if (typeof body?.desde === "string") desde = body.desde;
  } catch {
    // corpo vazio é válido — usa valores padrão
  }

  // Fila de reenvio: inscritos que ainda não receberam, ou que receberam
  // antes de `desde` (permite campanhas repetidas). Se `desde` não vier,
  // só pega quem nunca recebeu.
  const query = supabase
    .from("vw_crachas_reenvio")
    .select("inscrito_id, codigo_inscricao, pedido_id, nome, email, jantar_opcao");

  if (desde) {
    query.or(`cracha_reenviado_em.is.null,cracha_reenviado_em.lt.${desde}`);
  } else {
    query.is("cracha_reenviado_em", null);
  }

  const { data: pendentes, error: qErr } = await query.limit(limite);

  if (qErr) {
    console.error("[reenviar-crachas] erro ao consultar fila", qErr);
    return jsonResponse({ error: "Erro ao consultar fila." }, 500);
  }

  const fila = (pendentes ?? []) as CrachaReenvioRow[];

  let enviados = 0;
  let falhas = 0;
  for (const row of fila) {
    const ok = await enviarUm(row);
    if (ok) enviados++;
    else falhas++;
    await dormir(PAUSA_MS);
  }

  // Quantos ainda restam sem reenvio depois deste lote.
  const countQuery = supabase
    .from("vw_crachas_reenvio")
    .select("inscrito_id", { count: "exact", head: true });

  if (desde) {
    countQuery.or(`cracha_reenviado_em.is.null,cracha_reenviado_em.lt.${desde}`);
  } else {
    countQuery.is("cracha_reenviado_em", null);
  }

  const { count: restantes } = await countQuery;

  return jsonResponse({ enviados, falhas, restantes: restantes ?? 0 });
});
