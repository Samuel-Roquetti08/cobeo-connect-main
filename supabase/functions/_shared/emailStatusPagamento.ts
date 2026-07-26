// ============================================================================
// COBEO CONNECT — Textos dos e-mails de status de pagamento não aprovado
// ============================================================================
// Centraliza as mensagens específicas por status (PLANO_COBEO_doc1, T1).
// Não inclui o e-mail de "aprovado" — esse continua no webhook-mercadopago
// (já existente, com o crachá anexado).

export type CategoriaStatusPagamento = "recusado" | "pendente" | "falha";

// Classifica o status bruto do Mercado Pago (ou a ausência dele, quando a
// consulta à API do MP falhou) numa das 3 categorias de comunicação com o
// usuário. Não decide se o pedido está pago — só como falar sobre o que
// aconteceu. Espelhada em supabase/sql/009_status_pagamento_detalhado.sql
// para uso no lado do banco (página de status do site).
export function classificarStatusPagamento(mpStatus: string | null | undefined, temErroTecnico: boolean): CategoriaStatusPagamento {
  if (temErroTecnico) return "falha";
  if (mpStatus === "rejected" || mpStatus === "cancelled") return "recusado";
  if (mpStatus === "pending" || mpStatus === "in_process" || mpStatus === "authorized" || mpStatus === "in_mediation") return "pendente";
  return "falha";
}

interface ConteudoEmailStatus {
  subject: string;
  titulo: string;
  corpoHtml: string;
}

const BOTAO_TENTAR_NOVAMENTE = (siteUrl: string) => `
  <p style="margin:20px 0;">
    <a href="${siteUrl}/#inscricoes" style="display:inline-block;background-color:#731111;color:#ffffff;padding:12px 24px;border-radius:6px;font-weight:bold;text-decoration:none;">
      Tentar novamente
    </a>
  </p>
`;

export function conteudoEmailStatus(categoria: CategoriaStatusPagamento, nome: string, siteUrl: string): ConteudoEmailStatus {
  switch (categoria) {
    case "recusado":
      return {
        subject: "Pagamento não aprovado — II COBEO",
        titulo: "Seu pagamento não foi aprovado",
        corpoHtml: `
          <p>Olá, ${nome}!</p>
          <p>Seu pagamento não foi aprovado pela operadora do cartão (ou pelo meio de pagamento escolhido).
          Sua inscrição <strong>não está confirmada</strong> — nenhum valor foi debitado.</p>
          <p>Você pode tentar novamente com o mesmo cartão, outro cartão, ou outro meio de pagamento.</p>
          ${BOTAO_TENTAR_NOVAMENTE(siteUrl)}
        `,
      };
    case "pendente":
      return {
        subject: "Recebemos seu pedido — aguardando pagamento — II COBEO",
        titulo: "Recebemos seu pedido",
        corpoHtml: `
          <p>Olá, ${nome}!</p>
          <p>Recebemos seu pedido e estamos aguardando a confirmação do seu pagamento
          (isso é comum em PIX ou boleto, que podem levar alguns minutos para compensar).</p>
          <p>Você receberá um novo e-mail assim que o pagamento for confirmado. Não é necessário
          fazer nada — só aguarde.</p>
        `,
      };
    case "falha":
      return {
        subject: "Problema ao processar seu pagamento — II COBEO",
        titulo: "Houve um problema ao processar seu pagamento",
        corpoHtml: `
          <p>Olá, ${nome}!</p>
          <p>Houve um problema técnico ao processar seu pagamento. <strong>Nenhum valor foi cobrado.</strong></p>
          <p>Por favor, tente novamente. Se o problema persistir, entre em contato pelo e-mail
          cobeounifafibe@gmail.com.</p>
          ${BOTAO_TENTAR_NOVAMENTE(siteUrl)}
        `,
      };
  }
}

export function montarHtmlEmailStatus(categoria: CategoriaStatusPagamento, nome: string, siteUrl: string): { subject: string; html: string } {
  const { subject, titulo, corpoHtml } = conteudoEmailStatus(categoria, nome, siteUrl);
  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; max-width: 560px;">
      <h2 style="color:#731111;">${titulo}</h2>
      ${corpoHtml}
      <hr />
      <p style="font-size:12px;color:#6b6b6b;">Dúvidas: cobeounifafibe@gmail.com</p>
    </div>
  `;
  return { subject, html };
}
