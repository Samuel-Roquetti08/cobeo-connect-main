// ============================================================================
// COBEO CONNECT — Geração do PDF do certificado de participação
// ============================================================================
// Certificado tipográfico em A4 paisagem, desenhado com pdf-lib (JS puro, roda
// no Deno da Edge Function sem dependência nativa). As fontes padrão do PDF
// (Helvetica/Times) já cobrem os acentos do português via encoding WinAnsi —
// por isso não é preciso embutir fonte externa.
//
// CARGA HORÁRIA: é pendência do Fabiano (ver src/data/event.ts,
// CARGA_HORARIA_PENDENTE_LABEL). Enquanto os valores reais não chegam, todo
// curso aqui fica com cargaHoraria: null e cargaHorariaPendente() retorna true —
// a Edge Function usa isso para RECUSAR o envio, evitando mandar certificado com
// carga horária em branco para participante real. Quando o dado chegar, basta
// preencher os números neste mapa: nenhuma outra mudança de código é necessária.

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "npm:pdf-lib@1.17.1";

// Fonte de verdade real dos cursos é src/data/event.ts (frontend, decisão D13).
// Duplicado aqui em escala mínima porque Edge Functions não importam o bundle do
// front — mesmo padrão do CURSOS_INFO em webhook-mercadopago. Se os títulos ou a
// carga horária mudarem lá, atualizar aqui também.
export const CURSOS_CERT: Record<string, { titulo: string; cargaHoraria: number | null }> = {
  hmi: { titulo: "Protocolos Clínicos Inovadores para o Tratamento de HMI", cargaHoraria: null },
  estetica_cirurgia: { titulo: "Noções de Estética e Cirurgia Ortognática", cargaHoraria: null },
  handson_preparo_biomecanico: { titulo: "Hands-on: Preparo Biomecânico de Alta Performance — Sistemas Rotatórios de NiTi Tratados Termicamente", cargaHoraria: null },
  handson_traumatologia: { titulo: "Hands-on: Trauma de Mandíbula", cargaHoraria: null },
  handson_odontologia_esporte: { titulo: "Hands-on: Odontologia do Esporte — Protetores Bucais e Performance Esportiva", cargaHoraria: null },
  odontologia_hospitalar: { titulo: "Odontologia Hospitalar: Reabilitação de Fissura Labiopalatina e Cuidado Multiprofissional", cargaHoraria: null },
  handson_gengivodesign: { titulo: "Hands-on: Gengivodesign Suture — Introdução à Microsutura em Periodontia", cargaHoraria: null },
  handson_facetas: { titulo: "Hands-on: Facetas Estratificadas sem Resina Composta com Naturalidade", cargaHoraria: null },
  handson_implantodontia: { titulo: "Hands-on: Inovações na Implantodontia", cargaHoraria: null },
  handson_harmonizacao_labial: { titulo: "Hands-on: Harmonização com Preenchimento Labial", cargaHoraria: null },
  odontologia_legal: { titulo: "Odontologia Legal: Campos de Atuação, Mercado de Trabalho e Casuística", cargaHoraria: null },
  fluxo_digital_implantodontia: { titulo: "Fluxo Digital na Implantodontia: Da Teoria à Prática Clínica", cargaHoraria: null },
  dor_nao_odontogenica: { titulo: "Odontologia Além dos Dentes: Quando a Dor não é Odontogênica", cargaHoraria: null },
  alinhadores_ortodonticos: { titulo: "Alinhadores Ortodônticos: Indicações, Limitações e Estratégias Clínicas para a Classe II", cargaHoraria: null },
};

export const EVENTO_CERT = {
  nome: "II COBEO — Congresso de Odontologia de Bebedouro",
  subtitulo: "Congresso de Odontologia de Bebedouro",
  data: "7 a 9 de outubro de 2026",
  local: "Centro Universitário UNIFAFIBE — Bebedouro/SP",
  cidade: "Bebedouro/SP",
};

const BRAND = rgb(0x73 / 255, 0x11 / 255, 0x11 / 255); // #731111
const TINTA = rgb(0x1a / 255, 0x1a / 255, 0x1a / 255); // #1a1a1a
const CINZA = rgb(0x6b / 255, 0x6b / 255, 0x6b / 255); // #6b6b6b

export interface CursoCertificado {
  cursoRef: string;
  titulo: string; // snapshot vindo de pedido_cursos.curso_titulo (fallback)
}

// true se QUALQUER curso da lista ainda não tem carga horária definida no mapa
// acima. A Edge Function trava o envio enquanto isto for true.
export function cargaHorariaPendente(cursos: CursoCertificado[]): boolean {
  return cursos.some((c) => {
    const info = CURSOS_CERT[c.cursoRef];
    return !info || info.cargaHoraria == null;
  });
}

// Quebra um texto em linhas que cabem em `maxWidth`, medindo com a própria fonte.
function quebrarLinhas(texto: string, fonte: PDFFont, tamanho: number, maxWidth: number): string[] {
  const palavras = texto.split(/\s+/);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (fonte.widthOfTextAtSize(tentativa, tamanho) <= maxWidth) {
      atual = tentativa;
    } else {
      if (atual) linhas.push(atual);
      atual = p;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

function textoCentralizado(page: PDFPage, texto: string, y: number, fonte: PDFFont, tamanho: number, cor = TINTA) {
  const largura = fonte.widthOfTextAtSize(texto, tamanho);
  page.drawText(texto, { x: (page.getWidth() - largura) / 2, y, size: tamanho, font: fonte, color: cor });
}

export interface DadosCertificado {
  nome: string;
  codigoInscricao: string;
  cursos: CursoCertificado[];
  dataEmissao: Date;
}

// Gera o PDF do certificado e devolve os bytes. Pressupõe que a carga horária já
// está preenchida (a Edge Function garante isso via cargaHorariaPendente antes de
// chamar aqui) — mas ainda assim cai no rótulo pendente se algum vier null, para
// nunca lançar exceção no meio de um lote.
export async function gerarCertificadoPdf(dados: DadosCertificado): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificado — ${dados.nome} — II COBEO`);
  pdf.setAuthor(EVENTO_CERT.nome);

  // A4 paisagem (pontos)
  const W = 841.89;
  const H = 595.28;
  const page = pdf.addPage([W, H]);

  const serif = await pdf.embedFont(StandardFonts.TimesRoman);
  const serifBold = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sans = await pdf.embedFont(StandardFonts.Helvetica);
  const sansBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  // Moldura dupla
  page.drawRectangle({ x: 24, y: 24, width: W - 48, height: H - 48, borderColor: BRAND, borderWidth: 3 });
  page.drawRectangle({ x: 34, y: 34, width: W - 68, height: H - 68, borderColor: BRAND, borderWidth: 1 });

  // Cabeçalho
  textoCentralizado(page, EVENTO_CERT.nome.toUpperCase(), H - 92, sansBold, 15, BRAND);
  textoCentralizado(page, `${EVENTO_CERT.data} · ${EVENTO_CERT.local}`, H - 112, sans, 10, CINZA);

  // Título
  textoCentralizado(page, "CERTIFICADO", H - 168, serifBold, 40, BRAND);

  // Corpo
  const margem = 90;
  const larguraUtil = W - margem * 2;
  let y = H - 220;

  textoCentralizado(page, "Certificamos que", y, serif, 13, TINTA);
  y -= 34;
  textoCentralizado(page, dados.nome, y, serifBold, 24, TINTA);
  y -= 12;
  // filete sob o nome
  const larguraNome = serifBold.widthOfTextAtSize(dados.nome, 24);
  page.drawLine({
    start: { x: (W - Math.max(larguraNome, 240)) / 2, y },
    end: { x: (W + Math.max(larguraNome, 240)) / 2, y },
    thickness: 0.5,
    color: CINZA,
  });
  y -= 30;

  const cargaTotal = dados.cursos.reduce((soma, c) => soma + (CURSOS_CERT[c.cursoRef]?.cargaHoraria ?? 0), 0);
  const temTodasCargas = !cargaHorariaPendente(dados.cursos);
  const fraseCarga = temTodasCargas ? `, totalizando ${cargaTotal} horas de atividades,` : ",";
  const paragrafo =
    `participou do ${EVENTO_CERT.nome}, realizado de ${EVENTO_CERT.data} no ${EVENTO_CERT.local}` +
    `${fraseCarga} tendo comparecido às seguintes atividades científicas:`;

  for (const linha of quebrarLinhas(paragrafo, serif, 12, larguraUtil)) {
    textoCentralizado(page, linha, y, serif, 12, TINTA);
    y -= 18;
  }
  y -= 8;

  // Lista de cursos
  for (const curso of dados.cursos) {
    const info = CURSOS_CERT[curso.cursoRef];
    const titulo = info?.titulo ?? curso.titulo;
    const carga = info?.cargaHoraria != null ? ` (${info.cargaHoraria}h)` : "";
    const item = `•  ${titulo}${carga}`;
    // Se o título é longo, quebra mantendo recuo do bullet
    const linhas = quebrarLinhas(item, sans, 10.5, larguraUtil - 20);
    for (const linha of linhas) {
      page.drawText(linha, { x: margem + 10, y, size: 10.5, font: sans, color: TINTA });
      y -= 15;
    }
  }

  // Rodapé: data + assinatura
  const yAssinatura = 96;
  const dataFmt = dados.dataEmissao.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  textoCentralizado(page, `${EVENTO_CERT.cidade}, ${dataFmt}.`, yAssinatura + 46, serif, 11, CINZA);

  const larguraLinha = 260;
  const xLinha = (W - larguraLinha) / 2;
  page.drawLine({ start: { x: xLinha, y: yAssinatura }, end: { x: xLinha + larguraLinha, y: yAssinatura }, thickness: 0.8, color: TINTA });
  textoCentralizado(page, "Comissão Organizadora", yAssinatura - 16, sansBold, 11, TINTA);
  textoCentralizado(page, EVENTO_CERT.nome, yAssinatura - 30, sans, 9, CINZA);

  // Autenticidade (código de inscrição) — canto inferior
  page.drawText(`Código de inscrição: ${dados.codigoInscricao}`, {
    x: 44,
    y: 44,
    size: 8,
    font: sans,
    color: CINZA,
  });

  return await pdf.save();
}
