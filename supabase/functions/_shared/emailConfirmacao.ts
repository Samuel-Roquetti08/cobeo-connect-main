// ============================================================================
// COBEO CONNECT — E-mail de confirmação de pagamento (com crachá + QR)
// ============================================================================
// Extraído de webhook-mercadopago para ser reusado também pelo caminho de
// pedido gratuito (cupom 100%) em criar-preferencia — a inscrição confirmada
// por cupom total recebe exatamente o mesmo crachá/QR de uma paga.
//
// Fonte de verdade real dos dados do evento é src/data/event.ts (frontend,
// decisão D13). Duplicado aqui em escala mínima porque Edge Functions não
// importam o bundle do front. Se esses dados mudarem lá, atualizar aqui também.

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import QRCode from "npm:qrcode@1.5.4";

export const EVENTO_INFO = {
  nome: "II COBEO — Congresso de Odontologia de Bebedouro",
  data: "7 a 9 de outubro de 2026",
  local: "Centro Universitário UNIFAFIBE — Bebedouro/SP",
};

export const CURSOS_INFO: Record<string, { titulo: string; dia: string; horario: string }> = {
  hmi: { titulo: "Protocolos Clínicos Inovadores para o Tratamento da HMI", dia: "07/10", horario: "14h–15h45" },
  estetica_cirurgia: { titulo: "Noções de Estética e Cirurgia Ortognática", dia: "07/10", horario: "16h–18h" },
  hof_ortodontia: { titulo: "HOF ou Ortodontia", dia: "07/10", horario: "19h–21h" },
  odontologia_hospitalar: { titulo: "Odontologia Hospitalar", dia: "08/10", horario: "14h–15h45" },
  estetica_periodontal: { titulo: "Estética Periodontal", dia: "08/10", horario: "16h–18h" },
  odontologia_legal: { titulo: "Odontologia Legal", dia: "08/10", horario: "19h–21h" },
  dor_nao_odontogenica: { titulo: "Odontologia Além dos Dentes", dia: "09/10", horario: "14h–15h45" },
  endodontia: { titulo: "Endodontia", dia: "09/10", horario: "16h–18h" },
};

export const JANTAR_LABELS: Record<string, string> = {
  com_restricao: "Com restrição de bebidas",
  sem_restricao: "Sem restrição de bebidas",
};

export interface EmailConfig {
  siteUrl: string;
  resendApiKey: string | undefined;
  resendFrom: string;
}

export interface PedidoConfirmacao {
  id: string;
  nome: string;
  email: string;
  valor_total: number;
  tem_inscricao: boolean;
  tem_trabalho: boolean;
  jantar_opcao: string | null;
  valor_jantar: number;
}

// Gera o QR do crachá como PNG em base64, pronto pra ir como anexo inline
// (CID) do Resend. Aponta pra /admin/checkin?codigo=X. Nunca lança — falha na
// geração do QR não pode impedir o e-mail (o código em texto já é o fallback).
export async function gerarQrCodeBase64(siteUrl: string, codigo: string): Promise<string | null> {
  try {
    const url = `${siteUrl}/admin/checkin?codigo=${encodeURIComponent(codigo)}`;
    const buffer: Uint8Array = await QRCode.toBuffer(url, {
      width: 240,
      margin: 1,
      color: { dark: "#731111", light: "#ffffff" },
    });
    let binario = "";
    for (let i = 0; i < buffer.length; i++) binario += String.fromCharCode(buffer[i]);
    return btoa(binario);
  } catch (e) {
    console.error("[emailConfirmacao] falha ao gerar QR code do crachá", e);
    return null;
  }
}

export interface MontarCrachaHtmlParams {
  nome: string;
  codigo: string;
  linhasCursos: string;
  jantarOpcao: string | null;
  qrContentId: string;
  temQr: boolean;
  qrBase64: string | null;
}

// Monta o HTML do crachá (tabela do badge). Usado em e-mail de confirmação
// (enviarEmailConfirmacao) e em reenvio (reenviar-crachas).
export function montarCrachaHtml(params: MontarCrachaHtmlParams): string {
  const linhaJantarCracha = params.jantarOpcao
    ? `<div style="margin-top:8px;font-size:12px;color:#1a1a1a;"><strong>Jantar de Encerramento:</strong> ${JANTAR_LABELS[params.jantarOpcao] ?? params.jantarOpcao}</div>`
    : "";

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:460px;margin:16px 0;border:2px solid #731111;border-radius:8px;border-collapse:separate;overflow:hidden;">
      <tr>
        <td style="background-color:#731111;padding:12px 16px;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:14px;font-weight:bold;color:#ffffff;">${EVENTO_INFO.nome}</div>
          <div style="font-size:11px;color:#ffffff;opacity:0.85;">${EVENTO_INFO.data} · ${EVENTO_INFO.local}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:16px;font-family:Arial,Helvetica,sans-serif;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="vertical-align:top;">
                <div style="font-size:16px;font-weight:bold;color:#1a1a1a;">${params.nome}</div>
                <div style="margin-top:10px;font-size:10px;color:#6b6b6b;text-transform:uppercase;">Código de inscrição</div>
                <div style="font-size:18px;font-weight:bold;color:#731111;font-family:'Courier New',monospace;">${params.codigo}</div>
                ${params.linhasCursos ? `<div style="margin-top:10px;font-size:10px;color:#6b6b6b;text-transform:uppercase;">Cursos</div><ul style="margin:4px 0 0;padding-left:18px;font-size:12px;color:#1a1a1a;">${params.linhasCursos}</ul>` : ""}
                ${linhaJantarCracha}
              </td>
              <td style="width:130px;text-align:center;vertical-align:top;">
                ${params.qrBase64
                  ? `<img src="cid:${params.qrContentId}" width="120" height="120" alt="QR code de check-in do código ${params.codigo}" style="display:block;margin:0 auto;border:0;" />`
                  : ""}
              </td>
            </tr>
          </table>
          <p style="margin:12px 0 0;font-size:11px;color:#6b6b6b;">
            Apresente este código na entrada do evento${params.qrBase64 ? " (ou peça pro fiscal ler o QR acima)" : ""}. Se o QR não aparecer, o código em texto já basta.
          </p>
        </td>
      </tr>
    </table>
  `;
}

// Monta e envia o e-mail de confirmação (crachá + QR). Segue o mesmo contrato
// do webhook: nunca lança — falha do Resend só é logada, nunca derruba quem
// chamou (o pedido já está pago).
export async function enviarEmailConfirmacao(
  supabase: SupabaseClient,
  cfg: EmailConfig,
  pedido: PedidoConfirmacao,
): Promise<void> {
  if (!cfg.resendApiKey) {
    console.warn("[emailConfirmacao] RESEND_API_KEY não configurado, pulando e-mail.");
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
      return `<li style="margin-bottom:4px;">${pc.curso_titulo}${info ? ` — ${info.dia}, ${info.horario}` : ""}</li>`;
    })
    .join("");

  const linhaTrabalho = trabalhoRow?.titulo
    ? `<p><strong>Trabalho submetido:</strong> ${trabalhoRow.titulo}</p>`
    : "";

  // Crachá: só existe pra quem tem inscrição (check-in é por curso, não por
  // trabalho). QR é anexo inline (CID) — Gmail bloqueia data: URI em <img>.
  const codigo = inscrito?.codigo_inscricao ?? null;
  const qrBase64 = codigo ? await gerarQrCodeBase64(cfg.siteUrl, codigo) : null;
  const qrContentId = "cracha-qrcode";

  const crachaHtml = codigo
    ? montarCrachaHtml({
        nome: pedido.nome,
        codigo,
        linhasCursos,
        jantarOpcao: pedido.jantar_opcao,
        qrContentId,
        temQr: !!qrBase64,
        qrBase64,
      })
    : "";

  const html = `
    <div style="font-family: sans-serif; color: #1a1a1a; max-width: 560px;">
      <h2 style="color:#731111;">Pagamento confirmado — II COBEO</h2>
      <p>Olá, ${pedido.nome}! Seu pagamento foi confirmado com sucesso.</p>
      ${crachaHtml}
      ${linhaTrabalho}
      <p><strong>Valor total pago:</strong> R$ ${pedido.valor_total.toFixed(2)}</p>
      <hr />
      <p><strong>Evento:</strong> ${EVENTO_INFO.data} — ${EVENTO_INFO.local}.</p>
      <p><strong>Política de reembolso:</strong> até 30/09/2026, 50% do valor pago; após essa data, sem reembolso.
      Solicitações via cobeounifafibe@gmail.com.</p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.resendApiKey}`,
        "Content-Type": "application/json",
      },
      // TODO: trocar por domínio verificado antes do lançamento — enquanto isso,
      // o Resend só entrega para o e-mail dono da conta (onboarding@resend.dev).
      body: JSON.stringify({
        from: cfg.resendFrom,
        to: [pedido.email],
        subject: "Pagamento confirmado — II COBEO",
        html,
        ...(qrBase64
          ? { attachments: [{ content: qrBase64, filename: "qrcode-cracha.png", content_id: qrContentId }] }
          : {}),
      }),
    });
    if (!res.ok) {
      console.error("[emailConfirmacao] Resend retornou erro", await res.text());
    }
  } catch (e) {
    // Falha de e-mail nunca derruba quem chamou — o pedido já está pago.
    console.error("[emailConfirmacao] falha ao enviar e-mail via Resend", e);
  }
}
