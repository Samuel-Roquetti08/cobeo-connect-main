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
import { classificarStatusPagamento, montarHtmlEmailStatus } from "../_shared/emailStatusPagamento.ts";
import { enviarEmailConfirmacao } from "../_shared/emailConfirmacao.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// SUPABASE_SECRET_KEYS é injetado como dicionário JSON (permite rotação de
// chaves) — a entrada "default" é a chave sb_secret_ ativa no momento.
const SECRET_KEY = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"];
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
// Override só para teste local (PLANO_COBEO_teste_webhook_isolado) — sem a
// variável definida, produção usa exatamente a mesma URL de sempre.
const MP_API_BASE_URL = Deno.env.get("MP_API_BASE_URL") ?? "https://api.mercadopago.com";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "COBEO <onboarding@resend.dev>";
// URL pública do site — monta o link do QR do crachá, no mesmo formato que
// admin.crachas.tsx gera no client (/admin/checkin?codigo=X), só que lá usa
// window.location.origin (não existe aqui, roda no servidor). Trocar este
// default quando o domínio do Registro.br substituir o workers.dev.
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://cobeo-connect-main.samuelroquetti.workers.dev";

const supabase = createClient(SUPABASE_URL, SECRET_KEY);

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

// enviarEmailConfirmacao (crachá + QR) vive em _shared/emailConfirmacao.ts —
// reusado por este webhook e pelo caminho de pedido gratuito (cupom 100%) em
// criar-preferencia, para não duplicar o HTML do crachá nem a geração do QR.

// E-mail específico por status não aprovado (recusado/pendente/falha — T1 do
// doc de correções). Preserva o mesmo padrão de try/catch da confirmação:
// falha do Resend nunca derruba o webhook.
async function enviarEmailStatus(pedido: { nome: string; email: string }, categoria: ReturnType<typeof classificarStatusPagamento>) {
  if (!RESEND_API_KEY) {
    console.warn("[webhook-mercadopago] RESEND_API_KEY não configurado, pulando e-mail de status.");
    return;
  }
  const { subject, html } = montarHtmlEmailStatus(categoria, pedido.nome, SITE_URL);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: RESEND_FROM, to: [pedido.email], subject, html }),
    });
    if (!res.ok) {
      console.error("[webhook-mercadopago] Resend retornou erro (e-mail de status)", await res.text());
    }
  } catch (e) {
    console.error("[webhook-mercadopago] falha ao enviar e-mail de status via Resend", e);
  }
}

// Idempotência dos e-mails de status: reaproveita webhook_logs (sem coluna
// nova) — se já existe um log `processado=true` cuja notificação classifica
// na mesma categoria, o e-mail dessa categoria já foi enviado antes.
async function categoriaJaComunicada(referenceId: string, categoria: ReturnType<typeof classificarStatusPagamento>): Promise<boolean> {
  const { data } = await supabase
    .from("webhook_logs")
    .select("payload")
    .eq("reference_id", referenceId)
    .eq("processado", true);
  return (data ?? []).some((log) => {
    const payload = log.payload as { status?: string } | null;
    return classificarStatusPagamento(payload?.status ?? null, false) === categoria;
  });
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
    const mpRes = await fetch(`${MP_API_BASE_URL}/v1/payments/${paymentId}`, {
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
    // pending/in_process/rejected/etc: pedido continua pendente, cupom não é
    // tocado — essa decisão não muda. Só adiciona comunicação ao usuário.
    const categoria = classificarStatusPagamento(mpStatus, false);
    const jaComunicado = await categoriaJaComunicada(mpReferenceId, categoria);
    if (!jaComunicado) {
      await enviarEmailStatus(pedido, categoria);
    }
    // processado=true aqui marca "e-mail desta categoria já enviado" (não
    // "pedido pago") — é assim que a idempotência acima reconhece notificações
    // repetidas do MP para o mesmo status.
    await registrarLog(mpReferenceId, payment, !jaComunicado);
    return jsonResponse({ ok: true, statusMp: mpStatus, categoria, emailEnviado: !jaComunicado });
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

  await enviarEmailConfirmacao(
    supabase,
    { siteUrl: SITE_URL, resendApiKey: RESEND_API_KEY, resendFrom: RESEND_FROM },
    {
      id: pedido.id,
      nome: pedido.nome,
      email: pedido.email,
      valor_total: Number(pedido.valor_total),
      tem_inscricao: pedido.tem_inscricao,
      tem_trabalho: pedido.tem_trabalho,
      jantar_opcao: pedido.jantar_opcao,
      valor_jantar: Number(pedido.valor_jantar ?? 0),
    },
  );

  await registrarLog(mpReferenceId, payment, true);

  return jsonResponse({ ok: true, processado: true });
});
