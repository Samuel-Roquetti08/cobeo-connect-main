// ============================================================================
// COBEO CONNECT — Geração do PDF do certificado de participação
// ============================================================================
// Reproduz o modelo oficial enviado pelo Fabiano (Word, A4 paisagem): arte de
// fundo da UNIFAFIBE, texto "Certificamos que / NOME / participou do...", lista
// de cursos assistidos, data e duas assinaturas (Coordenador e Pró-Reitor).
// Posições em cm copiadas das caixas de texto/imagens do .docx original.
//
// A ARTE (fundo + imagens de assinatura) NÃO fica no código: o repositório é
// público e imagem de assinatura não pode ficar baixável no GitHub. Ela vive no
// bucket PRIVADO `certificado-arte` do Supabase Storage e chega aqui como bytes
// (ver enviar-certificados). Trocar a arte = subir outro arquivo com o mesmo
// nome no bucket, sem mudar código nem fazer deploy.
//
// Fonte: o modelo usa Calibri, que não é fonte padrão do PDF; usamos Helvetica
// (padrão, sem embutir arquivo de fonte) — cobre os acentos do português via
// WinAnsi.
//
// CARGA HORÁRIA: definida pelo Fabiano em 21/09/2026 — 2h uniformes para todos
// os 14 cursos (padronização de certificado; "Fluxo Digital na Implantodontia"
// dura 1h15 na grade e ainda assim certifica 2h). A trava cargaHorariaPendente()
// continua ativa de propósito: se um curso novo entrar aqui sem carga horária, a
// Edge Function volta a recusar o lote com 422 em vez de emitir certificado com
// carga em branco. Fonte de verdade do conteúdo continua src/data/event.ts (D13).

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFImage, RGB } from "npm:pdf-lib@1.17.1";

// Fonte de verdade real dos cursos é src/data/event.ts (frontend, decisão D13).
// Duplicado aqui em escala mínima porque Edge Functions não importam o bundle do
// front. A ORDEM deste mapa é a ordem da grade — é nela que os cursos aparecem
// listados no certificado.
export const CURSOS_CERT: Record<string, { titulo: string; cargaHoraria: number | null }> = {
  hmi: { titulo: "Protocolos Clínicos Inovadores para o Tratamento de HMI", cargaHoraria: 2 },
  estetica_cirurgia: { titulo: "Noções de Estética e Cirurgia Ortognática", cargaHoraria: 2 },
  handson_preparo_biomecanico: { titulo: "Hands-on: Preparo Biomecânico de Alta Performance — Sistemas Rotatórios de NiTi Tratados Termicamente", cargaHoraria: 2 },
  handson_traumatologia: { titulo: "Hands-on: Trauma de Mandíbula", cargaHoraria: 2 },
  handson_odontologia_esporte: { titulo: "Hands-on: Odontologia do Esporte — Protetores Bucais e Performance Esportiva", cargaHoraria: 2 },
  odontologia_hospitalar: { titulo: "Da UTI ao Centro de Referência: Odontologia Hospitalar — Reabilitação de Fissura Labiopalatina e Cuidado Multiprofissional", cargaHoraria: 2 },
  handson_gengivodesign: { titulo: "Hands-on: Gengivodesign Suture — Introdução à Microsutura em Periodontia", cargaHoraria: 2 },
  handson_facetas: { titulo: "Hands-on: Facetas Estratificadas sem Resina Composta com Naturalidade", cargaHoraria: 2 },
  handson_implantodontia: { titulo: "Hands-on: Inovações na Implantodontia", cargaHoraria: 2 },
  handson_harmonizacao_labial: { titulo: "Hands-on: Harmonização com Preenchimento Labial", cargaHoraria: 2 },
  odontologia_legal: { titulo: "Odontologia Legal: Campos de Atuação, Mercado de Trabalho e Casuística", cargaHoraria: 2 },
  fluxo_digital_implantodontia: { titulo: "Fluxo Digital na Implantodontia: Da Teoria à Prática Clínica", cargaHoraria: 2 },
  dor_nao_odontogenica: { titulo: "Odontologia Além dos Dentes: Quando a Dor não é Odontogênica", cargaHoraria: 2 },
  alinhadores_ortodonticos: { titulo: "Alinhadores Ortodônticos: Indicações, Limitações e Estratégias Clínicas para a Classe II", cargaHoraria: 2 },
};

export const EVENTO_CERT = {
  nomeOficial: "II CONGRESSO DE ODONTOLOGIA DE BEBEDOURO-UNIFAFIBE",
  periodo: "7 a 9 de outubro de 2026",
  // O modelo data o certificado no último dia do evento, não no dia do envio.
  localData: "Bebedouro, 9 de outubro de 2026.",
};

export const SIGNATARIOS = {
  coordenador: { nome: "Prof. Dr. Fabiano Jeremias", cargo: "Coordenador do Curso de Odontologia" },
  proReitor: { nome: "Prof. Me. Rafael Catani Lima", cargo: "Pró-Reitor Acadêmico" },
};

// Nomes dos arquivos no bucket privado `certificado-arte`.
export const ARQUIVOS_ARTE = {
  fundo: "fundo.png",
  assinaturaCoordenador: "assinatura-coordenador.jpg",
  assinaturaProReitor: "assinatura-pro-reitor.jpg",
} as const;

export interface ArteCertificado {
  fundo: Uint8Array;
  assinaturaCoordenador: Uint8Array;
  assinaturaProReitor: Uint8Array;
}

export interface CursoCertificado {
  cursoRef: string;
  titulo: string; // snapshot vindo de pedido_cursos.curso_titulo (fallback)
}

export interface DadosCertificado {
  nome: string;
  codigoInscricao: string;
  cursos: CursoCertificado[];
}

// true se QUALQUER curso da lista ainda não tem carga horária definida no mapa
// acima. A Edge Function trava o envio enquanto isto for true.
export function cargaHorariaPendente(cursos: CursoCertificado[]): boolean {
  return cursos.some((c) => {
    const info = CURSOS_CERT[c.cursoRef];
    return !info || info.cargaHoraria == null;
  });
}

// ─── Geometria (cm, medidos a partir do topo esquerdo, como no Word) ─────────
const CM = 72 / 2.54;
const W = 29.7 * CM;
const H = 21.0 * CM;

const CORPO = { x: 6.554, largura: 20.962, topo: 4.557 };
// Conteúdo do corpo precisa terminar antes das assinaturas (topo em 17,14 cm).
const CORPO_LIMITE = 16.9;
const RECUO_MARCADOR = 0.635;
const RECUO_ITEM = 1.27;

const ASSINATURAS = [
  {
    chave: "assinaturaCoordenador" as const,
    imagem: { x: 7.78, topo: 17.28, largura: 6.32, altura: 2.37 },
    texto: { centro: 11.95, topo: 19.017 },
    signatario: SIGNATARIOS.coordenador,
  },
  {
    chave: "assinaturaProReitor" as const,
    imagem: { x: 18.05, topo: 17.14, largura: 9.16, altura: 2.15 },
    texto: { centro: 20.935, topo: 19.057 },
    signatario: SIGNATARIOS.proReitor,
  },
];

const PRETO = rgb(0, 0, 0);
const CINZA_LISTA = rgb(0x33 / 255, 0x33 / 255, 0x33 / 255); // #333333, igual ao modelo
const CINZA_CODIGO = rgb(0x80 / 255, 0x80 / 255, 0x80 / 255);

// Espaçamento do "Normal" do modelo: 8 pt depois de cada parágrafo.
const DEPOIS = 8;
const ENTRELINHA = 1.35;
const ENTRELINHA_LISTA = 1.2;

// Helvetica padrão só codifica WinAnsi. Nome é digitado pelo participante e pode
// trazer caractere fora dela (ex.: "Nguyễn"), o que faria o pdf-lib lançar exceção
// e o certificado daquela pessoa nunca sair. Troca pelo caractere-base sem acento
// e, em último caso, remove.
function textoSeguro(texto: string, fonte: PDFFont): string {
  const suportados = new Set(fonte.getCharacterSet());
  let saida = "";
  for (const ch of texto) {
    if (suportados.has(ch.codePointAt(0)!)) { saida += ch; continue; }
    const base = ch.normalize("NFD").replace(/\p{M}/gu, "");
    if (base && [...base].every((b) => suportados.has(b.codePointAt(0)!))) saida += base;
  }
  return saida;
}

// widthOfTextAtSize das fontes padrão do pdf-lib desconta kerning (ex.: "Tr",
// "P,"), mas drawText desenha SEM kerning — medir por ele faz palavras com esses
// pares saírem mais largas que o medido e "comerem" o espaço seguinte. Soma
// glifo a glifo, que é exatamente o que é desenhado.
function medir(texto: string, fonte: PDFFont, tamanho: number): number {
  let soma = 0;
  for (const ch of texto) soma += fonte.widthOfTextAtSize(ch, tamanho);
  return soma;
}

interface Fragmento { texto: string; negrito?: boolean }
interface Peca { texto: string; fonte: PDFFont }
// `colada`: continua a palavra anterior sem espaço (sobra de uma quebra em hífen,
// ex.: "BEBEDOURO-" + "UNIFAFIBE,"). Pode ir para a linha seguinte, mas na mesma
// linha é desenhada grudada e não recebe folga da justificação.
interface Palavra { pecas: Peca[]; largura: number; colada: boolean }

interface Fontes { regular: PDFFont; negrito: PDFFont }

function palavrasDe(frags: Fragmento[], fontes: Fontes, tamanho: number): Palavra[] {
  const palavras: Palavra[] = [];
  let atual: Peca[] = [];
  let colada = false;
  const fechar = (proximaColada: boolean) => {
    if (atual.length) {
      palavras.push({ pecas: atual, largura: atual.reduce((s, p) => s + medir(p.texto, p.fonte, tamanho), 0), colada });
      atual = [];
    }
    colada = proximaColada;
  };
  for (const f of frags) {
    const fonte = f.negrito ? fontes.negrito : fontes.regular;
    for (const parte of textoSeguro(f.texto, fonte).split(/(\s+)/)) {
      if (!parte) continue;
      if (/^\s+$/.test(parte)) { fechar(false); continue; }
      const silabas = parte.split(/(?<=-)(?=.)/);
      silabas.forEach((s, i) => {
        atual.push({ texto: s, fonte });
        if (i < silabas.length - 1) fechar(true);
      });
    }
  }
  fechar(false);
  return palavras;
}

function quebrarEmLinhas(palavras: Palavra[], espaco: number, largura: number): Palavra[][] {
  const linhas: Palavra[][] = [];
  let linha: Palavra[] = [];
  let ocupado = 0;
  for (const p of palavras) {
    const extra = linha.length ? (p.colada ? 0 : espaco) + p.largura : p.largura;
    if (linha.length && ocupado + extra > largura) {
      linhas.push(linha);
      linha = [p];
      ocupado = p.largura;
    } else {
      linha.push(p);
      ocupado += extra;
    }
  }
  if (linha.length) linhas.push(linha);
  return linhas;
}

// Um parágrafo já medido: sabe sua altura e se desenha a partir de um topo (pt).
interface Bloco { altura: number; desenhar: (page: PDFPage, topo: number) => void }

function paragrafo(
  frags: Fragmento[],
  opts: {
    fontes: Fontes; tamanho: number; cor: RGB; alinhamento: "centro" | "direita" | "justificado";
    x: number; largura: number; entrelinha: number; depois: number; marcador?: { x: number };
  },
): Bloco {
  const palavras = palavrasDe(frags, opts.fontes, opts.tamanho);
  const espaco = opts.fontes.regular.widthOfTextAtSize(" ", opts.tamanho);
  const linhas = quebrarEmLinhas(palavras, espaco, opts.largura);
  const alturaLinha = opts.tamanho * opts.entrelinha;
  return {
    altura: Math.max(linhas.length, 1) * alturaLinha + opts.depois,
    desenhar(page, topo) {
      linhas.forEach((linha, i) => {
        const base = H - (topo + (i + 1) * alturaLinha - alturaLinha * 0.28);
        const soma = linha.reduce((s, p) => s + p.largura, 0);
        const lacunas = linha.filter((p, j) => j > 0 && !p.colada).length;
        const natural = soma + espaco * lacunas;
        const ultima = i === linhas.length - 1;
        let lacuna = espaco;
        let x = opts.x;
        if (opts.alinhamento === "justificado" && !ultima && lacunas > 0) {
          const esticada = (opts.largura - soma) / lacunas;
          // Linha com palavra longa demais sobrando: esticar abriria "rios" de
          // espaço. Acima de 4× o espaço normal, fica alinhada à esquerda.
          if (esticada <= espaco * 4) lacuna = esticada;
        } else if (opts.alinhamento === "centro") {
          x = opts.x + (opts.largura - natural) / 2;
        } else if (opts.alinhamento === "direita") {
          x = opts.x + opts.largura - natural;
        }
        if (i === 0 && opts.marcador) {
          page.drawText("•", { x: opts.marcador.x, y: base, size: opts.tamanho, font: opts.fontes.regular, color: opts.cor });
        }
        linha.forEach((palavra, j) => {
          if (j > 0 && !palavra.colada) x += lacuna;
          for (const peca of palavra.pecas) {
            page.drawText(peca.texto, { x, y: base, size: opts.tamanho, font: peca.fonte, color: opts.cor });
            x += medir(peca.texto, peca.fonte, opts.tamanho);
          }
        });
      });
    },
  };
}

function montarCorpo(dados: DadosCertificado, fontes: Fontes, escala: number): Bloco[] {
  const x = CORPO.x * CM;
  const largura = CORPO.largura * CM;
  const t = (pt: number) => pt * escala;

  const ordem = Object.keys(CURSOS_CERT);
  const cursos = [...dados.cursos].sort((a, b) => {
    const ia = ordem.indexOf(a.cursoRef);
    const ib = ordem.indexOf(b.cursoRef);
    return (ia < 0 ? ordem.length : ia) - (ib < 0 ? ordem.length : ib);
  });
  const horas = cursos.reduce((s, c) => s + (CURSOS_CERT[c.cursoRef]?.cargaHoraria ?? 0), 0);

  // Nome em caixa alta como no modelo; encolhe até caber numa linha.
  const nome = textoSeguro(dados.nome.trim().toLocaleUpperCase("pt-BR"), fontes.negrito);
  let tamNome = t(18);
  while (tamNome > 10 && medir(nome, fontes.negrito, tamNome) > largura) tamNome -= 0.5;

  const blocos: Bloco[] = [
    paragrafo([{ texto: "Certificamos que" }], {
      fontes, tamanho: t(18), cor: PRETO, alinhamento: "centro", x, largura, entrelinha: ENTRELINHA, depois: t(DEPOIS),
    }),
    paragrafo([{ texto: nome, negrito: true }], {
      fontes, tamanho: tamNome, cor: PRETO, alinhamento: "centro", x, largura, entrelinha: ENTRELINHA, depois: t(DEPOIS),
    }),
    paragrafo(
      [
        { texto: "participou do " },
        { texto: EVENTO_CERT.nomeOficial, negrito: true },
        {
          texto: `, promovido pelo Curso de Odontologia do Centro Universitário Unifafibe, de Bebedouro-SP, ` +
            `no período de ${EVENTO_CERT.periodo}, perfazendo a carga horária de `,
        },
        { texto: String(horas), negrito: true },
        { texto: `${horas === 1 ? " hora" : " horas"}. ${cursos.length === 1 ? "Curso assistido:" : "Cursos assistidos:"}` },
      ],
      // 16 pt no modelo (Calibri); Helvetica é ~10% mais larga, e em 15,5 pt o
      // nome do congresso cabe inteiro na 1ª linha, como no Word.
      { fontes, tamanho: t(15.5), cor: PRETO, alinhamento: "justificado", x, largura, entrelinha: ENTRELINHA, depois: t(DEPOIS) },
    ),
    ...cursos.map((c, i) =>
      paragrafo([{ texto: CURSOS_CERT[c.cursoRef]?.titulo ?? c.titulo }], {
        fontes, tamanho: t(11), cor: CINZA_LISTA, alinhamento: "justificado",
        x: x + RECUO_ITEM * CM, largura: largura - RECUO_ITEM * CM, entrelinha: ENTRELINHA_LISTA,
        depois: i === cursos.length - 1 ? t(DEPOIS) : 0,
        marcador: { x: x + RECUO_MARCADOR * CM },
      })
    ),
    // Linha em branco antes da data, como no modelo.
    { altura: t(12) * ENTRELINHA + t(DEPOIS), desenhar: () => {} },
    paragrafo([{ texto: EVENTO_CERT.localData }], {
      fontes, tamanho: t(16), cor: PRETO, alinhamento: "direita", x, largura, entrelinha: ENTRELINHA, depois: 0,
    }),
  ];
  return blocos;
}

async function embutirImagem(pdf: PDFDocument, bytes: Uint8Array): Promise<PDFImage> {
  const ehPng = bytes[0] === 0x89 && bytes[1] === 0x50;
  return ehPng ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);
}

// Gera o PDF do certificado e devolve os bytes. Pressupõe que a carga horária já
// está preenchida (a Edge Function garante isso via cargaHorariaPendente antes de
// chamar aqui).
export async function gerarCertificadoPdf(dados: DadosCertificado, arte: ArteCertificado): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Certificado — ${dados.nome} — II COBEO`);
  pdf.setAuthor("Centro Universitário UNIFAFIBE");
  const page = pdf.addPage([W, H]);

  const fontes: Fontes = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    negrito: await pdf.embedFont(StandardFonts.HelveticaBold),
  };

  page.drawImage(await embutirImagem(pdf, arte.fundo), { x: 0, y: 0, width: W, height: H });

  // Imagens de assinatura primeiro: o nome do signatário é desenhado por cima,
  // como no modelo (o traço da assinatura cruza a linha do nome).
  for (const a of ASSINATURAS) {
    const img = await embutirImagem(pdf, arte[a.chave]);
    const caixa = a.imagem;
    const escala = Math.min((caixa.largura * CM) / img.width, (caixa.altura * CM) / img.height);
    const w = img.width * escala;
    const h = img.height * escala;
    page.drawImage(img, {
      x: caixa.x * CM + (caixa.largura * CM - w) / 2,
      y: H - caixa.topo * CM - (caixa.altura * CM + h) / 2,
      width: w,
      height: h,
    });
  }
  for (const a of ASSINATURAS) {
    const largura = 8 * CM;
    const x = a.texto.centro * CM - largura / 2;
    const nome = paragrafo([{ texto: a.signatario.nome, negrito: true }], {
      fontes, tamanho: 12, cor: PRETO, alinhamento: "centro", x, largura, entrelinha: 1.22, depois: DEPOIS,
    });
    const cargo = paragrafo([{ texto: a.signatario.cargo }], {
      fontes, tamanho: 12, cor: PRETO, alinhamento: "centro", x, largura, entrelinha: 1.22, depois: 0,
    });
    const topo = a.texto.topo * CM;
    nome.desenhar(page, topo);
    cargo.desenhar(page, topo + nome.altura);
  }

  // Corpo: se muitos cursos com títulos longos empurrarem a data para cima das
  // assinaturas, reduz tudo proporcionalmente até caber.
  let escala = 1;
  let blocos = montarCorpo(dados, fontes, escala);
  const altura = (bs: Bloco[]) => bs.reduce((s, b) => s + b.altura, 0);
  const disponivel = (CORPO_LIMITE - CORPO.topo) * CM;
  while (altura(blocos) > disponivel && escala > 0.7) {
    escala -= 0.03;
    blocos = montarCorpo(dados, fontes, escala);
  }
  let topo = CORPO.topo * CM;
  for (const b of blocos) {
    b.desenhar(page, topo);
    topo += b.altura;
  }

  // Autenticidade: o e-mail de envio cita o código de inscrição como prova de
  // autenticidade do documento.
  const codigo = `Código de inscrição: ${dados.codigoInscricao}`;
  page.drawText(codigo, {
    x: W - 0.8 * CM - medir(codigo, fontes.regular, 7),
    y: 0.45 * CM,
    size: 7,
    font: fontes.regular,
    color: CINZA_CODIGO,
  });

  return await pdf.save();
}
