// ============================================================================
// COBEO CONNECT — Tradução do status/status_detail do Mercado Pago
// ============================================================================
// Só usado no admin, pra explicar por que um pedido está "pendente" (ver
// admin.inscritos.tsx). Read-only: não influencia em nada a lógica que decide
// se um pedido vira "pago" — isso continua só em webhook-mercadopago/index.ts.
// Valores de status_detail vêm da documentação pública do Mercado Pago
// (checkout). Código não mapeado nunca é escondido — mostra o texto cru do MP
// como fallback, nunca inventa um motivo.

const STATUS_LABELS: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  in_process: "Em análise",
  rejected: "Recusado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  charged_back: "Estornado (chargeback)",
  authorized: "Autorizado (aguardando captura)",
  in_mediation: "Em mediação",
};

const STATUS_DETAIL_LABELS: Record<string, string> = {
  // Recusas de cartão
  cc_rejected_bad_filled_card_number: "Número do cartão incorreto",
  cc_rejected_bad_filled_date: "Data de validade incorreta",
  cc_rejected_bad_filled_other: "Dados do cartão preenchidos incorretamente",
  cc_rejected_bad_filled_security_code: "Código de segurança (CVV) incorreto",
  cc_rejected_blacklist: "Cartão recusado pela operadora",
  cc_rejected_call_for_authorize: "Pagamento requer autorização do titular junto ao banco emissor",
  cc_rejected_card_disabled: "Cartão desabilitado — cliente precisa contatar o banco emissor",
  cc_rejected_card_error: "Não foi possível processar o pagamento (erro no cartão)",
  cc_rejected_duplicated_payment: "Recusado como pagamento duplicado (já existe um igual recente)",
  cc_rejected_high_risk: "Recusado pela análise de risco do Mercado Pago",
  cc_rejected_insufficient_amount: "Saldo ou limite insuficiente no cartão",
  cc_rejected_invalid_installments: "Número de parcelas inválido para esse cartão",
  cc_rejected_max_attempts: "Número máximo de tentativas de pagamento excedido",
  cc_rejected_other_reason: "Recusado pelo banco emissor (motivo não detalhado pelo MP)",
  cc_rejected_time_out: "Tempo esgotado ao processar o pagamento",
  // Pendências (PIX/boleto/transferência/análise)
  pending_contingency: "Pagamento em processamento pelo Mercado Pago",
  pending_review_manual: "Pagamento em análise manual do Mercado Pago",
  pending_waiting_payment: "Aguardando o pagamento (boleto/PIX gerado, ainda não pago)",
  pending_waiting_transfer: "Aguardando confirmação da transferência/PIX",
  // Expiração
  expired: "Prazo de pagamento expirado (boleto/PIX vencido sem pagamento)",
};

export interface MotivoPagamento {
  statusMp: string | null;
  statusDetailMp: string | null;
  resumo: string;
}

// Nunca lança — se algo vier em formato inesperado, cai no fallback com o
// texto cru, pra sempre mostrar alguma coisa útil ao admin.
export function traduzirMotivoPagamento(statusMp: string | null, statusDetailMp: string | null): MotivoPagamento {
  const statusLabel = statusMp ? (STATUS_LABELS[statusMp] ?? statusMp) : "Status desconhecido";
  const detailLabel = statusDetailMp ? (STATUS_DETAIL_LABELS[statusDetailMp] ?? null) : null;

  const resumo = detailLabel
    ? `${statusLabel} — ${detailLabel}`
    : statusDetailMp
      ? `${statusLabel} (código do MP: ${statusDetailMp})`
      : statusLabel;

  return { statusMp, statusDetailMp, resumo };
}
