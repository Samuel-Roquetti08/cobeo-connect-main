// ============================================================================
// COBEO CONNECT — Edge Function: webhook-mercadopago
// ============================================================================
// Endpoint PÚBLICO (--no-verify-jwt, o MP não envia JWT do Supabase). Por isso:
// NUNCA confia no payload recebido — só usa o payment_id de lá para consultar a
// API do MP com o access token e descobrir o status real. Processa "pago" uma
// única vez (idempotente: só age se o pedido ainda estiver `pendente`), porque o
// MP reenvia notificações e reprocessar duplicaria e-mail e consumo de cupom.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "COBEO <onboarding@resend.dev>";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Fonte de verdade real é src/data/event.ts (frontend). Duplicado aqui em
// escala mínima só para compor o e-mail — Edge Functions não importam o
// bundle do frontend. Se a grade mudar, atualizar os dois lugares.
const CURSOS_INFO: Record<string, { titulo: string; dia: string; horario: string }> = {
  hmi: { titulo: "Protocolos Clínicos Inovadores para o Tratamento da HMI", dia: "07/10", horario: "14h–15h45" },
  estetica_cirurgia: { titulo: "Noções de Estética e Cirurgia Ortognática", dia: "07/10", horario: "16h–18h" },
  hof_ortodontia: { titulo: "HOF ou Ortodontia", dia: "07/10", horario: "19h–21h" },
  odontologia_hospitalar: { titulo: "Odontologia Hospitalar", dia: "08/10", horario: "14h–15h45" },
  estetica_periodontal: { titulo: "Estética Periodontal", dia: "08/10", horario: "16h–18h" },
  odontologia_legal: { titulo: "Odontologia Legal", dia: "08/10", horario: "19h–21h" },
  dor_nao_odontogenica: { titulo: "Odontologia Além dos Dentes", dia: "09/10", horario: "14h–15h45" },
  endodontia: { titulo: "Endodontia", dia: "09/10", horario: "16h–18h" },
};

const JANTAR_LABELS: Record<string, string> = {
  com_restricao: "Com restrição de bebidas",
  sem_restricao: "Sem restrição de bebidas",
};

function extrairPaymentId(body: Record<string, unknown> | null, url: URL): string | null {
  const data = body?.data as { id?: string } | undefined;
  if (data?.id) return String(data.id);
  if (body?.["id"] && body?.["type"] === "payment") return String(body["id"]);
  const fromQuery = url.searchParams.get("data.id") ?? url.searchParams.get("id");
  return fromQuery;
}

function ehNotificacaoDePagamento(body: Record<string, unknown> | null, url: URL): boolean {
  const type = (body?.["type"] as string) ?? (body?.["topic"] as string) ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  return type === "payment";
}

async function registrarLog(referenceId: string | null, payload: unknown, processado: boolean) {
  const { error } = await supabase.from("webhook_logs").insert({
    reference_id: referenceId,
    payload,
    processado,
  });
  if (error) console.error("[webhook-mercadopago] falha ao gravar webhook_logs", error);
}

async function enviarEmailConfirmacao(pedido: {
  id: string;
  nome: string;
  email: string;
  valor_total: number;
  tem_inscricao: boolean;
  tem_trabalho: boolean;
  jantar_opcao: string | null;
  valor_jantar: number;
}) {
  if (!RESEND_API_KEY) {
    console.warn("[webhook-mercadopago] RESEND_API_KEY não configurado, pulando e-mail.");
    return;
  }

  const { data: inscrito } = pedido.tem_inscricao
    ? await supabase.from("inscritos").select("codigo_inscricao").eq("pedido_id", pedido.id).maybeSingle()
    : { data: null };

  const { data: pedidoCursos } = pedido.tem_inscricao
    ? await supabase.from("pedido_cursos").select("curso_ref, curso_titulo").eq("pedido_id", pedido.id)
    : { data: [] };

  const { data: trabalhoRow } = pedido.tem_trabalho
    ? await supabase.from("trabalhos").select("titulo").eq("pedido_id", pedido.id).maybeSingle()
    : { data: null };

  const linhasCursos = (pedidoCursos ?? [])
    .map((pc) => {
      const info = CURSOS_INFO[pc.curso_ref];
      return `<li>${pc.curso_titulo}${info ? ` — ${info.dia}, ${info.horario}` : ""}</li>`;
    })
    .join("");

  const linhaJantar = pedido.jantar_opcao
    ? `<p><strong>Jantar de Encerramento:</strong> ${JANTAR_LABELS[pedido.jantar_opcao] ?? pedido.jantar_opcao} — R$ ${pedido.valor_jantar.toFixed(2)}</p>`
    : "";

  const linhaCodigo = inscrito?.codigo_inscricao
    ? `<p><strong>Código de inscrição:</strong> ${inscrito.codigo_inscricao} — apresente-o no check-in.</p>`
    : "";

  const linhaTrabalho = trabalhoRow?.titulo
    ? `<p><strong>Trabalho submetido:</strong> ${trabalhoRow.titulo}</p>`
    : "";

  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; max-width: 560px;">
      <h2 style="color:#731111;">Pagamento confirmado — II COBEO</h2>
      <p>Olá, ${pedido.nome}! Seu pagamento foi confirmado com sucesso.</p>
      ${linhaCodigo}
      ${linhasCursos ? `<p><strong>Cursos:</strong></p><ul>${linhasCursos}</ul>` : ""}
      ${linhaJantar}
      ${linhaTrabalho}
      <p><strong>Valor total pago:</strong> R$ ${pedido.valor_total.toFixed(2)}</p>
      <hr />
      <p><strong>Evento:</strong> 7 a 9 de outubro de 2026 — Anfiteatro 1, Centro Universitário UNIFAFIBE, Bebedouro/SP.</p>
      <p><strong>Política de reembolso:</strong> até 10/09/2026, 50% do valor pago; após essa data, sem reembolso.
      Solicitações via cobeounifafibe@gmail.com.</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      // TODO: trocar por domínio verificado antes do lançamento — enquanto isso,
      // o Resend só entrega para o e-mail dono da conta (onboarding@resend.dev).
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [pedido.email],
        subject: "Pagamento confirmado — II COBEO",
        html,
      }),
    });
    if (!res.ok) {
      console.error("[webhook-mercadopago] Resend retornou erro", await res.text());
    }
  } catch (e) {
    // Falha de e-mail nunca derruba o webhook — o pedido já está pago.
    console.error("[webhook-mercadopago] falha ao enviar e-mail via Resend", e);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  let body: Record<string, unknown> | null = null;
  try {
    body = req.method === "POST" ? await req.json() : null;
  } catch {
    body = null;
  }

  if (!ehNotificacaoDePagamento(body, url)) {
    // Outros tipos de notificação (merchant_order, etc.) — confirma recebimento, ignora.
    return jsonResponse({ ok: true, ignorado: true });
  }

  const paymentId = extrairPaymentId(body, url);
  if (!paymentId) {
    return jsonResponse({ ok: true, ignorado: true, motivo: "sem payment_id" });
  }

  // Nunca confia no payload: consulta a API do MP com o access token.
  let payment: Record<string, unknown>;
  try {
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    });
    if (!mpRes.ok) {
      await registrarLog(null, { paymentId, erro: "falha ao consultar API do MP", status: mpRes.status }, false);
      return jsonResponse({ ok: false, erro: "pagamento não encontrado na API do MP" }, 200);
    }
    payment = await mpRes.json();
  } catch (e) {
    console.error("[webhook-mercadopago] falha de rede ao consultar o MP", e);
    return jsonResponse({ ok: false }, 200);
  }

  const mpReferenceId = payment.external_reference as string | undefined;
  const mpStatus = payment.status as string | undefined;

  if (!mpReferenceId) {
    await registrarLog(null, payment, false);
    return jsonResponse({ ok: true, ignorado: true, motivo: "sem external_reference" });
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("id, nome, email, status, valor_total, tem_inscricao, tem_trabalho, jantar_opcao, valor_jantar, cupom_codigo")
    .eq("mp_reference_id", mpReferenceId)
    .maybeSingle();

  if (pedidoError || !pedido) {
    await registrarLog(mpReferenceId, payment, false);
    return jsonResponse({ ok: true, ignorado: true, motivo: "pedido não encontrado" });
  }

  // Idempotência: só processa se ainda estiver pendente (evita duplicar e-mail/cupom).
  if (pedido.status !== "pendente") {
    await registrarLog(mpReferenceId, payment, true);
    return jsonResponse({ ok: true, jaProcessado: true });
  }

  if (mpStatus !== "approved") {
    // pending/in_process/rejected/etc: pedido continua pendente, cupom não é tocado.
    await registrarLog(mpReferenceId, payment, false);
    return jsonResponse({ ok: true, statusMp: mpStatus });
  }

  const { error: updateError } = await supabase
    .from("pedidos")
    .update({
      status: "pago",
      mp_payment_id: String(payment.id ?? paymentId),
      pago_em: new Date().toISOString(),
    })
    .eq("id", pedido.id)
    .eq("status", "pendente"); // dupla checagem contra corrida entre notificações simultâneas

  if (updateError) {
    console.error("[webhook-mercadopago] falha ao marcar pedido como pago", updateError);
    await registrarLog(mpReferenceId, payment, false);
    return jsonResponse({ ok: false }, 200);
  }

  if (pedido.cupom_codigo) {
    const { error: cupomError } = await supabase.rpc("usar_cupom", {
      p_codigo: pedido.cupom_codigo,
      p_pedido_id: pedido.id,
    });
    if (cupomError) {
      console.error("[webhook-mercadopago] falha ao marcar cupom como utilizado", cupomError);
    } else {
      const { data: cupomRow } = await supabase
        .from("cupons")
        .select("id")
        .eq("codigo", pedido.cupom_codigo.toUpperCase())
        .maybeSingle();
      if (cupomRow) {
        await supabase.from("pedidos").update({ cupom_id: cupomRow.id }).eq("id", pedido.id);
      }
    }
  }

  await enviarEmailConfirmacao({
    id: pedido.id,
    nome: pedido.nome,
    email: pedido.email,
    valor_total: Number(pedido.valor_total),
    tem_inscricao: pedido.tem_inscricao,
    tem_trabalho: pedido.tem_trabalho,
    jantar_opcao: pedido.jantar_opcao,
    valor_jantar: Number(pedido.valor_jantar ?? 0),
  });

  await registrarLog(mpReferenceId, payment, true);

  return jsonResponse({ ok: true, processado: true });
});
