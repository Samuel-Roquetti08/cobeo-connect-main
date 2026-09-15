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
import { enviarEmailConfirmacao } from "../_shared/emailConfirmacao.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// SUPABASE_SECRET_KEYS é injetado como dicionário JSON (permite rotação de
// chaves) — a entrada "default" é a chave sb_secret_ ativa no momento.
const SECRET_KEY = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS")!)["default"];
const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const SITE_URL = Deno.env.get("SITE_URL")!;
// Usados só no caminho de pedido gratuito (cupom 100%), para reaproveitar o
// e-mail de confirmação com crachá do fluxo pago.
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM = Deno.env.get("RESEND_FROM") ?? "COBEO <onboarding@resend.dev>";

const supabase = createClient(SUPABASE_URL, SECRET_KEY);

interface PedidoPreferencia {
  id: string;
  nome: string;
  email: string;
  status: string;
  valor_total: number;
  mp_reference_id: string;
  tem_inscricao: boolean;
  tem_trabalho: boolean;
  jantar_opcao: string | null;
  valor_jantar: number | null;
  cupom_codigo: string | null;
}

// Pedido gratuito: o Mercado Pago não cria preferência de R$ 0,00. Em vez de
// barrar (o que impedia inscrição por cupom cortesia de 100%), confirmamos o
// pedido aqui — MAS só quando um cupom PERCENTUAL de 100% e DISPONÍVEL justifica
// o zero, revalidado no servidor via validar_cupom (nunca confia no client).
// Qualquer outro total 0 (sem esse cupom) continua barrado, para não abrir
// brecha de valor manipulado (valor_cursos/desconto vêm do insert do cliente —
// ver incidente "valor_total manipulável"). Idempotente e à prova de corrida:
// só um confirma, marca pago, consome o cupom e dispara o e-mail.
async function confirmarPedidoGratuito(pedido: PedidoPreferencia): Promise<Response> {
  if (!pedido.cupom_codigo) {
    return jsonResponse({ error: "Pedido com valor inválido." }, 422);
  }

  const { data: cupomValidacao, error: cupomErr } = await supabase.rpc("validar_cupom", {
    p_codigo: pedido.cupom_codigo,
  });
  if (cupomErr) {
    console.error("[criar-preferencia] erro ao validar cupom do pedido gratuito", cupomErr);
    return jsonResponse({ error: "Erro ao validar o cupom." }, 500);
  }
  const v = cupomValidacao as { valido?: boolean; tipo?: string; valor?: number } | null;
  const cupomZeraLegitimo = Boolean(v?.valido) && v?.tipo === "percentual" && Number(v?.valor) >= 100;
  if (!cupomZeraLegitimo) {
    // total 0 sem um cupom 100% válido = não confiável (cupom já usado/expirado,
    // fixo, ou valores manipulados no insert). Barra como antes.
    return jsonResponse({ error: "Pedido com valor inválido." }, 422);
  }

  // Marca pago de forma idempotente (só se ainda pendente). O .select() devolve
  // as linhas afetadas — 0 significa que outra chamada já confirmou (corrida).
  const { data: atualizados, error: updErr } = await supabase
    .from("pedidos")
    .update({ status: "pago", pago_em: new Date().toISOString(), mp_payment_id: "GRATUITO_CUPOM_100" })
    .eq("id", pedido.id)
    .eq("status", "pendente")
    .select("id");
  if (updErr) {
    console.error("[criar-preferencia] falha ao confirmar pedido gratuito", updErr);
    return jsonResponse({ error: "Não foi possível confirmar a inscrição." }, 500);
  }
  if ((atualizados?.length ?? 0) === 0) {
    // Outra chamada confirmou primeiro — não reprocessa cupom nem e-mail.
    return jsonResponse({ gratuito: true, mpReferenceId: pedido.mp_reference_id, jaProcessado: true });
  }

  // Consome o cupom (usar_cupom só age em cupom disponível) e vincula cupom_id —
  // mesmo padrão do webhook. Falha aqui não desfaz a inscrição já confirmada.
  const { error: cupomUsoErr } = await supabase.rpc("usar_cupom", {
    p_codigo: pedido.cupom_codigo,
    p_pedido_id: pedido.id,
  });
  if (cupomUsoErr) {
    console.error("[criar-preferencia] falha ao marcar cupom como utilizado", cupomUsoErr);
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

  await enviarEmailConfirmacao(
    supabase,
    { siteUrl: SITE_URL, resendApiKey: RESEND_API_KEY, resendFrom: RESEND_FROM },
    {
      id: pedido.id,
      nome: pedido.nome,
      email: pedido.email,
      valor_total: 0,
      tem_inscricao: pedido.tem_inscricao,
      tem_trabalho: pedido.tem_trabalho,
      jantar_opcao: pedido.jantar_opcao,
      valor_jantar: Number(pedido.valor_jantar ?? 0),
    },
  );

  return jsonResponse({ gratuito: true, mpReferenceId: pedido.mp_reference_id });
}

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
    .select("id, nome, email, status, valor_total, mp_reference_id, tem_inscricao, tem_trabalho, jantar_opcao, valor_jantar, cupom_codigo")
    .eq("id", pedidoId)
    .maybeSingle<PedidoPreferencia>();

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

  const valorTotal = Number(pedido.valor_total);
  // Pedido gratuito (cupom 100%): confirma sem passar pelo Mercado Pago.
  if (valorTotal === 0) {
    return await confirmarPedidoGratuito(pedido);
  }
  // Negativo é impossível pelo cálculo do banco (desconto travado no valor base);
  // se aparecer, é sinal de manipulação — barra.
  if (valorTotal < 0) {
    return jsonResponse({ error: "Pedido com valor inválido." }, 422);
  }

  // Doc 2 (unificação): um pedido pode ter inscrição e trabalho juntos —
  // esta function não decide isso, só lê o pedido e nomeia o item de acordo.
  const titulo = pedido.tem_inscricao && pedido.tem_trabalho
    ? "Inscrição + Trabalho Acadêmico — II COBEO"
    : pedido.tem_trabalho
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
