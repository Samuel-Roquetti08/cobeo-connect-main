// ============================================================================
// COBEO CONNECT — Edge Function: enviar-certificados
// ============================================================================
// Ação de admin: gera o PDF do certificado e envia por e-mail (Resend, anexo)
// para os participantes elegíveis que AINDA NÃO receberam. Protegida por JWT do
// Supabase (deploy sem --no-verify-jwt) — só admin autenticado invoca.
//
// Idempotente e retomável: elegibilidade é sempre recalculada no servidor (via
// vw_elegiveis_certificado — nunca confia no client) e cada inscrito é marcado
// em inscritos.certificado_enviado_em no sucesso. Processa em lotes (parâmetro
// `limite`) para não estourar o tempo da function; o client reinvoca até
// `restantes` chegar a zero. Reexecutar nunca reenvia para quem já recebeu.
//
// TRAVA DE CARGA HORÁRIA: enquanto a carga horária dos cursos for pendência do
// Fabiano (todos null em _shared/certificado.ts), a function recusa o envio com
// 422 — evita mandar certificado com carga horária em branco. Quando o dado for
// preenchido naquele mapa, o envio passa a funcionar sem mudança aqui.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { gerarCertificadoPdf, cargaHorariaPendente, CursoCertificado } from "../_shared/certificado.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SECRET_KEY = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"];
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "COBEO <onboarding@resend.dev>";

const supabase = createClient(SUPABASE_URL, SECRET_KEY);

// Lote padrão por invocação — conservador para caber no tempo da Edge Function
// (gera PDF + chama o Resend por participante). O client reinvoca até zerar.
const LIMITE_PADRAO = 20;
// Pausa entre envios para respeitar o rate limit do Resend.
const PAUSA_MS = 350;

const dormir = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Uint8Array -> base64 (formato que o Resend espera no campo `content` do anexo).
// Feito em blocos para não estourar o stack em PDFs maiores.
function bytesParaBase64(bytes: Uint8Array): string {
  let binario = "";
  const bloco = 0x8000;
  for (let i = 0; i < bytes.length; i += bloco) {
    binario += String.fromCharCode(...bytes.subarray(i, i + bloco));
  }
  return btoa(binario);
}

interface ElegivelRow {
  inscrito_id: string;
  codigo_inscricao: string;
  pedido_id: string;
  nome: string;
  email: string;
}

async function enviarUm(row: ElegivelRow): Promise<boolean> {
  const { data: pedidoCursos, error: cursosErr } = await supabase
    .from("pedido_cursos")
    .select("curso_ref, curso_titulo")
    .eq("pedido_id", row.pedido_id);

  if (cursosErr || !pedidoCursos || pedidoCursos.length === 0) {
    console.error("[enviar-certificados] sem cursos para o pedido", row.pedido_id, cursosErr);
    return false;
  }

  const cursos: CursoCertificado[] = pedidoCursos.map((pc) => ({
    cursoRef: pc.curso_ref,
    titulo: pc.curso_titulo,
  }));

  let pdfBytes: Uint8Array;
  try {
    pdfBytes = await gerarCertificadoPdf({
      nome: row.nome,
      codigoInscricao: row.codigo_inscricao,
      cursos,
      dataEmissao: new Date(),
    });
  } catch (e) {
    console.error("[enviar-certificados] falha ao gerar PDF", row.inscrito_id, e);
    return false;
  }

  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; max-width: 560px;">
      <h2 style="color:#731111;">Seu certificado — II COBEO</h2>
      <p>Olá, ${row.nome}!</p>
      <p>Obrigado por participar do <strong>II COBEO — Congresso de Odontologia de Bebedouro</strong>.
      Seu certificado de participação está anexado a este e-mail em PDF.</p>
      <p>Guarde o arquivo — ele contém seu código de inscrição (${row.codigo_inscricao}) para
      fins de autenticidade.</p>
      <hr />
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
        subject: "Seu certificado de participação — II COBEO",
        html,
        attachments: [
          {
            content: bytesParaBase64(pdfBytes),
            filename: `certificado-cobeo-${row.codigo_inscricao}.pdf`,
          },
        ],
      }),
    });
    if (!res.ok) {
      console.error("[enviar-certificados] Resend retornou erro", await res.text());
      return false;
    }
  } catch (e) {
    console.error("[enviar-certificados] falha ao enviar via Resend", e);
    return false;
  }

  // Marca só após o envio confirmado — assim uma falha deixa o inscrito na fila
  // para a próxima passada (idempotência real).
  const { error: updErr } = await supabase
    .from("inscritos")
    .update({ certificado_enviado_em: new Date().toISOString() })
    .eq("id", row.inscrito_id);
  if (updErr) {
    // E-mail já foi — logar, mas contar como enviado para não reenviar. O
    // reenvio duplicado é pior que um marcador atrasado (que pode ser corrigido
    // manualmente no banco se necessário).
    console.error("[enviar-certificados] e-mail enviado mas falhou ao marcar", row.inscrito_id, updErr);
  }
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }
  if (!RESEND_API_KEY) {
    return jsonResponse({ error: "RESEND_API_KEY não configurado." }, 500);
  }

  let limite = LIMITE_PADRAO;
  try {
    const body = await req.json();
    if (typeof body?.limite === "number" && body.limite > 0) limite = Math.min(body.limite, 100);
  } catch {
    // corpo vazio é válido — usa o limite padrão
  }

  // Elegíveis que ainda não receberam, mais antigos primeiro.
  const { data: pendentes, error: qErr } = await supabase
    .from("vw_elegiveis_certificado")
    .select("inscrito_id, codigo_inscricao, pedido_id, nome, email")
    .eq("elegivel", true)
    .is("certificado_enviado_em", null)
    .limit(limite);

  if (qErr) {
    console.error("[enviar-certificados] erro ao consultar elegíveis", qErr);
    return jsonResponse({ error: "Erro ao consultar elegíveis." }, 500);
  }

  const fila = (pendentes ?? []) as ElegivelRow[];

  // Trava de carga horária: se algum curso comprado por alguém da fila ainda não
  // tem carga horária, recusa o lote inteiro com mensagem clara — nada é enviado.
  for (const row of fila) {
    const { data: pc } = await supabase
      .from("pedido_cursos")
      .select("curso_ref, curso_titulo")
      .eq("pedido_id", row.pedido_id);
    const cursos: CursoCertificado[] = (pc ?? []).map((c) => ({ cursoRef: c.curso_ref, titulo: c.curso_titulo }));
    if (cursos.length > 0 && cargaHorariaPendente(cursos)) {
      return jsonResponse(
        {
          error: "carga_horaria_pendente",
          mensagem:
            "Carga horária dos cursos ainda não definida (pendência do Fabiano). " +
            "Preencha os valores em supabase/functions/_shared/certificado.ts (CURSOS_CERT) antes de enviar.",
        },
        422,
      );
    }
  }

  let enviados = 0;
  let falhas = 0;
  for (const row of fila) {
    const ok = await enviarUm(row);
    if (ok) enviados++;
    else falhas++;
    await dormir(PAUSA_MS);
  }

  // Quantos elegíveis ainda restam sem certificado depois deste lote.
  const { count: restantes } = await supabase
    .from("vw_elegiveis_certificado")
    .select("inscrito_id", { count: "exact", head: true })
    .eq("elegivel", true)
    .is("certificado_enviado_em", null);

  const restam = restantes ?? 0;

  // Marca o carimbo global na primeira vez que a fila zera (compatível com a UI
  // existente, que usa configuracoes_evento.certificados_enviados_em).
  if (restam === 0 && enviados > 0) {
    await supabase
      .from("configuracoes_evento")
      .update({ certificados_enviados_em: new Date().toISOString() })
      .eq("id", 1)
      .is("certificados_enviados_em", null);
  }

  return jsonResponse({ enviados, falhas, restantes: restam });
});
