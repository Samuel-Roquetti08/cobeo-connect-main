// ============================================================================
// COBEO CONNECT — Edge Function: criar-preferencia
// ============================================================================
// Recebe um pedidoId de um pedido `pendente` já gravado no banco e gera uma
// preferência de pagamento no Mercado Pago. O valor cobrado vem sempre do
// `valor_total` do banco (GENERATED ALWAYS AS) — nunca do que o cliente envia.
// Serve tanto pedidos de evento quanto de trabalho: esta function não sabe (nem
// precisa saber) qual é qual, só lê o pedido pelo id.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const SITE_URL = Deno.env.get("SITE_URL")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  let pedidoId: string | undefined;
  try {
    const body = await req.json();
    pedidoId = body?.pedidoId;
  } catch {
    return jsonResponse({ error: "Corpo da requisição inválido." }, 400);
  }

  if (!pedidoId) {
    return jsonResponse({ error: "pedidoId é obrigatório." }, 400);
  }

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .select("id, nome, email, status, valor_total, mp_reference_id, tem_inscricao, tem_trabalho")
    .eq("id", pedidoId)
    .maybeSingle();

  if (pedidoError) {
    console.error("[criar-preferencia] erro ao buscar pedido", pedidoError);
    return jsonResponse({ error: "Erro ao consultar o pedido." }, 500);
  }
  if (!pedido) {
    return jsonResponse({ error: "Pedido não encontrado." }, 404);
  }
  if (pedido.status === "pago") {
    return jsonResponse({ error: "Este pedido já foi pago." }, 409);
  }
  if (!pedido.valor_total || pedido.valor_total <= 0) {
    return jsonResponse({ error: "Pedido com valor inválido." }, 422);
  }

  const titulo = pedido.tem_trabalho && !pedido.tem_inscricao
    ? "Submissão de trabalho — II COBEO"
    : "Inscrição — II COBEO";

  // O Mercado Pago rejeita auto_return quando back_urls não é uma URL pública
  // válida (ex.: localhost, durante desenvolvimento). Sem auto_return, o
  // usuário ainda volta ao site clicando no link "voltar" do checkout.
  const isPublicUrl = !/localhost|127\.0\.0\.1/.test(SITE_URL);

  const preferencePayload: Record<string, unknown> = {
    items: [
      {
        title: titulo,
        quantity: 1,
        unit_price: Number(pedido.valor_total),
        currency_id: "BRL",
      },
    ],
    payer: { name: pedido.nome, email: pedido.email },
    external_reference: pedido.mp_reference_id,
    back_urls: {
      success: `${SITE_URL}/inscricao/sucesso?ref=${pedido.mp_reference_id}`,
      pending: `${SITE_URL}/inscricao/pendente?ref=${pedido.mp_reference_id}`,
      failure: `${SITE_URL}/inscricao/falha?ref=${pedido.mp_reference_id}`,
    },
    notification_url: `${SUPABASE_URL}/functions/v1/webhook-mercadopago`,
  };
  if (isPublicUrl) {
    preferencePayload.auto_return = "approved";
  }

  try {
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("[criar-preferencia] erro do Mercado Pago", mpData);
      return jsonResponse({ error: "Não foi possível criar a preferência de pagamento." }, 502);
    }

    return jsonResponse({
      initPoint: mpData.init_point ?? mpData.sandbox_init_point,
      mpReferenceId: pedido.mp_reference_id,
    });
  } catch (e) {
    console.error("[criar-preferencia] falha de rede ao chamar o Mercado Pago", e);
    return jsonResponse({ error: "Falha de comunicação com o Mercado Pago." }, 502);
  }
});
