// ============================================================================
// COBEO CONNECT — Site público: criação de pedidos (cursos + trabalho)
// ============================================================================
// IDs são gerados no cliente (crypto.randomUUID()) para não depender de
// RETURNING no insert — isso evitaria precisar de uma policy de SELECT pública
// em `pedidos`, que vazaria dados de outros pedidos. `valor_total` é sempre
// calculado pelo banco (GENERATED ALWAYS AS); nunca é enviado daqui.

import { supabase } from "@/lib/supabaseClient";
import { categorias, cursos, jantar, trabalho, type CategoriaId, type CursoId, type JantarOpcaoId } from "@/data/event";

export type MetodoPagamento = "pix" | "debito" | "credito";

export interface DadosComprador {
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
}

export interface CupomAplicado {
  codigo: string;
  tipo: "fixo" | "percentual";
  valor: number;
}

export interface PedidoCriado {
  pedidoId: string;
  mpReferenceId: string;
}

// ─── Estado de bloqueio (lido pelo formulário público) ───────────────────────
export interface EstadoInscricoes {
  inscricoesBloqueadas: boolean;
  jantarBloqueado: boolean;
  // curso_ref de cada curso bloqueado individualmente — some/desabilita a opção no site.
  // A garantia real (não pode ser burlada por uma chamada direta à API) é a trigger
  // trg_valida_curso_bloqueado em `pedido_cursos` (supabase/sql/005_bloqueio_cursos_individual.sql).
  cursosBloqueados: string[];
}

// Fail-open: se a leitura falhar (rede, etc.), não trava a inscrição por erro
// de infraestrutura — a validação real e definitiva está no banco (RLS + trigger).
export async function getEstadoInscricoes(): Promise<EstadoInscricoes> {
  try {
    const { data, error } = await supabase
      .from("configuracoes_evento")
      .select("inscricoes_bloqueadas, jantar_bloqueado, cursos_bloqueados")
      .eq("id", 1)
      .single();
    if (error) throw error;
    return {
      inscricoesBloqueadas: Boolean(data.inscricoes_bloqueadas),
      jantarBloqueado: Boolean(data.jantar_bloqueado),
      cursosBloqueados: data.cursos_bloqueados ?? [],
    };
  } catch (e) {
    console.error("[pedidos] Falha ao ler estado de inscrições (fail-open).", e);
    return { inscricoesBloqueadas: false, jantarBloqueado: false, cursosBloqueados: [] };
  }
}

// ─── Consulta de status (páginas de retorno do Mercado Pago) ─────────────────
// Categoria do último status bruto do MP visto pelo webhook (supabase/sql/
// 009_status_pagamento_detalhado.sql) — usada só para escolher a mensagem
// certa quando o pedido ainda está "pendente" no banco (recusado e "aguardando
// confirmação" têm a mesma pedidos.status, ver comentário na função SQL).
export type CategoriaStatusPagamento = "recusado" | "pendente" | "falha" | "aprovado" | null;

export interface StatusPedido {
  encontrado: boolean;
  status?: "pendente" | "pago" | "cancelado" | "reembolsado" | "expirado";
  valorTotal?: number;
  codigoInscricao?: string | null;
  metodoPagamento?: string | null;
  pagoEm?: string | null;
  ultimaCategoriaPagamento?: CategoriaStatusPagamento;
}

// Nunca confia na URL de retorno do MP — sempre lê o status real do banco via
// função SECURITY DEFINER (mesmo padrão de validar_cupom).
export async function consultarStatusPedido(mpReferenceId: string): Promise<StatusPedido> {
  const { data, error } = await supabase.rpc("consultar_status_pedido", {
    p_mp_reference_id: mpReferenceId,
  });
  if (error) throw error;
  if (!data?.encontrado) return { encontrado: false };
  return {
    encontrado: true,
    status: data.status,
    valorTotal: data.valor_total,
    codigoInscricao: data.codigo_inscricao,
    metodoPagamento: data.metodo_pagamento,
    pagoEm: data.pago_em,
    ultimaCategoriaPagamento: data.ultima_categoria_pagamento ?? null,
  };
}

// ─── Pedido de evento (cursos + jantar opcional) ──────────────────────────────
export interface CriarPedidoEventoInput extends DadosComprador {
  categoria: CategoriaId;
  cursosSelecionados: CursoId[];
  jantarOpcao: JantarOpcaoId | null;
  cupom: CupomAplicado | null;
  metodoPagamento: MetodoPagamento;
  consentimentoLgpd: boolean;
}

function calcularDescontoCupom(cupom: CupomAplicado | null, valorCursos: number): number {
  if (!cupom) return 0;
  const bruto = cupom.tipo === "percentual" ? valorCursos * (cupom.valor / 100) : cupom.valor;
  // Desconto nunca deixa o valor dos cursos negativo.
  return Math.round(Math.min(bruto, valorCursos) * 100) / 100;
}

export async function criarPedidoEvento(input: CriarPedidoEventoInput): Promise<PedidoCriado> {
  if (!input.consentimentoLgpd) {
    throw new Error("É necessário aceitar a política de privacidade para continuar.");
  }
  if (input.cursosSelecionados.length === 0) {
    throw new Error("Selecione ao menos um curso.");
  }

  const categoriaInfo = categorias.find((c) => c.id === input.categoria);
  if (!categoriaInfo) throw new Error("Categoria inválida.");

  const cursosInfo = input.cursosSelecionados.map((id) => {
    const c = cursos.find((c) => c.id === id);
    if (!c) throw new Error(`Curso inválido: ${id}`);
    return c;
  });

  // Checagem amigável, lida na hora (não confia no estado carregado quando a
  // página abriu — um curso pode ter sido bloqueado nesse meio-tempo). Isso é
  // só UX: a garantia real é a trigger trg_valida_curso_bloqueado no banco,
  // que rejeita o insert em `pedido_cursos` de qualquer forma.
  const { data: configRow } = await supabase
    .from("configuracoes_evento")
    .select("cursos_bloqueados")
    .eq("id", 1)
    .single();
  const cursosBloqueados: string[] = configRow?.cursos_bloqueados ?? [];
  const cursoBloqueado = cursosInfo.find((c) => cursosBloqueados.includes(c.id));
  if (cursoBloqueado) {
    throw new Error(`O curso "${cursoBloqueado.titulo}" não está mais disponível para inscrição.`);
  }

  const valorCursos = cursosInfo.length * categoriaInfo.valorCurso;

  let valorJantar = 0;
  if (input.jantarOpcao) {
    if (cursosInfo.length < jantar.minimosCursos) {
      throw new Error(`O jantar exige a compra de pelo menos ${jantar.minimosCursos} cursos.`);
    }
    const opcao = jantar.opcoes.find((o) => o.id === input.jantarOpcao);
    if (!opcao) throw new Error("Opção de jantar inválida.");
    valorJantar = opcao.valor;
  }

  const descontoCupom = calcularDescontoCupom(input.cupom, valorCursos);

  const pedidoId = crypto.randomUUID();
  const mpReferenceId = `COBEO-EVT-${pedidoId.slice(0, 8).toUpperCase()}`;

  const { error: pedidoError } = await supabase.from("pedidos").insert({
    id: pedidoId,
    nome: input.nome,
    email: input.email,
    telefone: input.telefone,
    whatsapp: input.whatsapp,
    tem_inscricao: true,
    tem_trabalho: false,
    categoria: input.categoria,
    valor_cursos: valorCursos,
    valor_jantar: valorJantar,
    valor_trabalho: 0,
    desconto_cupom: descontoCupom,
    jantar_opcao: input.jantarOpcao,
    cupom_codigo: input.cupom?.codigo ?? null,
    status: "pendente",
    mp_reference_id: mpReferenceId,
    metodo_pagamento: input.metodoPagamento,
    consentimento_lgpd_em: new Date().toISOString(),
  });
  // Se a policy de RLS rejeitar (ex.: inscrições bloqueadas), o erro sobe daqui —
  // essa é a revalidação server-side exigida: esconder o formulário é só UX.
  if (pedidoError) throw pedidoError;

  const { error: inscritoError } = await supabase.from("inscritos").insert({
    id: crypto.randomUUID(),
    pedido_id: pedidoId,
  });
  if (inscritoError) throw inscritoError;

  const pedidoCursosRows = cursosInfo.map((c) => ({
    pedido_id: pedidoId,
    curso_ref: c.id,
    curso_titulo: c.titulo,
    valor: categoriaInfo.valorCurso,
  }));
  const { error: cursosError } = await supabase.from("pedido_cursos").insert(pedidoCursosRows);
  if (cursosError) throw cursosError;

  return { pedidoId, mpReferenceId };
}

// ─── Pedido de trabalho acadêmico (upload primeiro, depois o pedido) ─────────
const EXTENSOES_PERMITIDAS = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB

export function validarArquivoTrabalho(file: File): string | null {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (!EXTENSOES_PERMITIDAS.includes(ext)) {
    return `Formato não permitido. Use: ${EXTENSOES_PERMITIDAS.join(", ")}.`;
  }
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    return "O arquivo excede o limite de 10 MB.";
  }
  return null;
}

export interface CriarPedidoTrabalhoInput extends DadosComprador {
  titulo: string;
  resumo: string;
  categoria: string;
  modalidade: "Presencial" | "Online";
  formato: "Oral" | "Pôster";
  coautores: string[];
  arquivos: File[];
  metodoPagamento: MetodoPagamento;
  consentimentoLgpd: boolean;
}

export async function criarPedidoTrabalho(input: CriarPedidoTrabalhoInput): Promise<PedidoCriado> {
  if (!input.consentimentoLgpd) {
    throw new Error("É necessário aceitar a política de privacidade para continuar.");
  }
  if (input.arquivos.length === 0) {
    throw new Error("Selecione ao menos um arquivo do trabalho.");
  }
  for (const arquivo of input.arquivos) {
    const erroArquivo = validarArquivoTrabalho(arquivo);
    if (erroArquivo) throw new Error(`${arquivo.name}: ${erroArquivo}`);
  }

  const pedidoId = crypto.randomUUID();
  const mpReferenceId = `COBEO-TRB-${pedidoId.slice(0, 8).toUpperCase()}`;

  // Upload primeiro: se algum falhar, nenhum pedido é criado (nenhum lixo no
  // banco — os arquivos já enviados ficam órfãos no Storage, mesmo trade-off
  // que já existia para 1 arquivo só). Nome nunca é o original — evita
  // colisão e path traversal.
  const arquivosParaGravar: { path: string; nome: string; tipo: string }[] = [];
  for (const arquivo of input.arquivos) {
    const ext = arquivo.name.slice(arquivo.name.lastIndexOf(".")).toLowerCase();
    const arquivoPath = `${pedidoId}/${crypto.randomUUID()}${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("trabalhos-pdfs")
      .upload(arquivoPath, arquivo, { contentType: arquivo.type, upsert: false });
    if (uploadError) throw uploadError;
    arquivosParaGravar.push({ path: arquivoPath, nome: arquivo.name, tipo: arquivo.type });
  }

  const { error: pedidoError } = await supabase.from("pedidos").insert({
    id: pedidoId,
    nome: input.nome,
    email: input.email,
    telefone: input.telefone,
    whatsapp: input.whatsapp,
    tem_inscricao: false,
    tem_trabalho: true,
    valor_cursos: 0,
    valor_jantar: 0,
    valor_trabalho: trabalho.valor,
    desconto_cupom: 0,
    status: "pendente",
    mp_reference_id: mpReferenceId,
    metodo_pagamento: input.metodoPagamento,
    consentimento_lgpd_em: new Date().toISOString(),
  });
  if (pedidoError) throw pedidoError;

  const trabalhoId = crypto.randomUUID();
  const { error: trabalhoError } = await supabase.from("trabalhos").insert({
    id: trabalhoId,
    pedido_id: pedidoId,
    titulo: input.titulo,
    resumo: input.resumo,
    categoria: input.categoria,
    modalidade: input.modalidade,
    formato: input.formato,
  });
  if (trabalhoError) throw trabalhoError;

  // N arquivos por trabalho — mesmo padrão relacional de `coautores`
  // (supabase/sql/010_trabalho_arquivos.sql).
  const { error: arquivosError } = await supabase.from("trabalho_arquivos").insert(
    arquivosParaGravar.map((a) => ({
      trabalho_id: trabalhoId,
      arquivo_path: a.path,
      arquivo_nome: a.nome,
      arquivo_tipo: a.tipo,
    }))
  );
  if (arquivosError) throw arquivosError;

  const coautoresValidos = input.coautores.map((n) => n.trim()).filter(Boolean);
  if (coautoresValidos.length > 0) {
    const rows = coautoresValidos.map((nome) => ({ trabalho_id: trabalhoId, nome }));
    const { error: coautoresError } = await supabase.from("coautores").insert(rows);
    if (coautoresError) throw coautoresError;
  }

  return { pedidoId, mpReferenceId };
}

// ─── Pedido unificado (Doc 2) — inscrição e/ou trabalho num pedido só ────────
// criarPedidoEvento/criarPedidoTrabalho acima ficam mantidas como referência/
// fallback (regra do Doc 2: não apagar o código antigo até o novo estar
// testado) — não são mais chamadas pelo front a partir desta mudança.
export interface CriarPedidoUnificadoInput extends DadosComprador {
  metodoPagamento: MetodoPagamento;
  consentimentoLgpd: boolean;

  // Inscrição — omitir ou deixar cursosSelecionados vazio para "sem inscrição".
  categoria?: CategoriaId;
  cursosSelecionados?: CursoId[];
  jantarOpcao?: JantarOpcaoId | null;
  cupom?: CupomAplicado | null;
  // RA/instituição externa: obrigatórios para aluno_unifafibe (RA) e
  // aluno_externo (RA + instituição), a pedido do Fabiano — validados abaixo.
  // Campo exibido depende da categoria — ver Inscricoes.tsx.
  ra?: string;
  instituicaoExterna?: string;

  // Trabalho — omitir para "sem trabalho".
  trabalho?: {
    titulo: string;
    resumo: string;
    categoria: string;
    modalidade: "Presencial" | "Online";
    formato: "Oral" | "Pôster";
    coautores: string[];
    arquivos: File[];
  };
}

// Cupom agora incide sobre o total combinado (cursos + jantar + trabalho) —
// decisão registrada no Doc 2, pendente de validação do Fabiano antes de
// produção (o desconto real fica maior do que quando incidia só sobre cursos).
function calcularDescontoCupomTotal(cupom: CupomAplicado | null, valorBase: number): number {
  if (!cupom) return 0;
  const bruto = cupom.tipo === "percentual" ? valorBase * (cupom.valor / 100) : cupom.valor;
  return Math.round(Math.min(bruto, valorBase) * 100) / 100;
}

export async function criarPedidoUnificado(input: CriarPedidoUnificadoInput): Promise<PedidoCriado> {
  if (!input.consentimentoLgpd) {
    throw new Error("É necessário aceitar a política de privacidade para continuar.");
  }

  const temInscricao = Boolean(input.cursosSelecionados && input.cursosSelecionados.length > 0);
  const temTrabalho = Boolean(input.trabalho);

  if (!temInscricao && !temTrabalho) {
    throw new Error("Selecione ao menos um curso ou preencha a submissão de trabalho.");
  }

  // ── Validações e cálculos da parte de inscrição (mesma lógica de
  // criarPedidoEvento, só que sem criar nada ainda) ──────────────────────────
  let categoriaInfo: (typeof categorias)[number] | undefined;
  let cursosInfo: (typeof cursos)[number][] = [];
  let valorCursos = 0;
  let valorJantar = 0;

  if (temInscricao) {
    if (!input.categoria) throw new Error("Categoria inválida.");
    categoriaInfo = categorias.find((c) => c.id === input.categoria);
    if (!categoriaInfo) throw new Error("Categoria inválida.");

    cursosInfo = input.cursosSelecionados!.map((id) => {
      const c = cursos.find((c) => c.id === id);
      if (!c) throw new Error(`Curso inválido: ${id}`);
      return c;
    });

    // Checagem amigável (a garantia real é a trigger no banco) — mesmo padrão
    // de criarPedidoEvento.
    const { data: configRow } = await supabase
      .from("configuracoes_evento")
      .select("cursos_bloqueados")
      .eq("id", 1)
      .single();
    const cursosBloqueados: string[] = configRow?.cursos_bloqueados ?? [];
    const cursoBloqueado = cursosInfo.find((c) => cursosBloqueados.includes(c.id));
    if (cursoBloqueado) {
      throw new Error(`O curso "${cursoBloqueado.titulo}" não está mais disponível para inscrição.`);
    }

    if (input.categoria === "aluno_unifafibe" && !input.ra?.trim()) {
      throw new Error("Informe seu RA para continuar.");
    }
    if (input.categoria === "aluno_externo" && (!input.ra?.trim() || !input.instituicaoExterna?.trim())) {
      throw new Error("Informe RA e instituição de ensino para continuar.");
    }

    valorCursos = cursosInfo.length * categoriaInfo.valorCurso;

    if (input.jantarOpcao) {
      if (cursosInfo.length < jantar.minimosCursos) {
        throw new Error(`O jantar exige a compra de pelo menos ${jantar.minimosCursos} cursos.`);
      }
      const opcao = jantar.opcoes.find((o) => o.id === input.jantarOpcao);
      if (!opcao) throw new Error("Opção de jantar inválida.");
      valorJantar = opcao.valor;
    }
  }

  // ── Validação da parte de trabalho (mesma lógica de criarPedidoTrabalho) ──
  const valorTrabalho = temTrabalho ? trabalho.valor : 0;
  if (temTrabalho) {
    if (input.trabalho!.arquivos.length === 0) {
      throw new Error("Selecione ao menos um arquivo do trabalho.");
    }
    for (const arquivo of input.trabalho!.arquivos) {
      const erroArquivo = validarArquivoTrabalho(arquivo);
      if (erroArquivo) throw new Error(`${arquivo.name}: ${erroArquivo}`);
    }
  }

  // Cupom incide sobre o total combinado — não só sobre cursos (mudança do Doc 2).
  const valorBaseCupom = valorCursos + valorJantar + valorTrabalho;
  const descontoCupom = calcularDescontoCupomTotal(input.cupom ?? null, valorBaseCupom);

  const pedidoId = crypto.randomUUID();
  const prefixo = temInscricao && temTrabalho ? "CMB" : temTrabalho ? "TRB" : "EVT";
  const mpReferenceId = `COBEO-${prefixo}-${pedidoId.slice(0, 8).toUpperCase()}`;

  // Upload primeiro: se algum arquivo falhar, nenhum pedido é criado (padrão
  // já usado em criarPedidoTrabalho — evita pedido órfão).
  const arquivosParaGravar: { path: string; nome: string; tipo: string }[] = [];
  if (temTrabalho) {
    for (const arquivo of input.trabalho!.arquivos) {
      const ext = arquivo.name.slice(arquivo.name.lastIndexOf(".")).toLowerCase();
      const arquivoPath = `${pedidoId}/${crypto.randomUUID()}${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("trabalhos-pdfs")
        .upload(arquivoPath, arquivo, { contentType: arquivo.type, upsert: false });
      if (uploadError) throw uploadError;
      arquivosParaGravar.push({ path: arquivoPath, nome: arquivo.name, tipo: arquivo.type });
    }
  }

  const { error: pedidoError } = await supabase.from("pedidos").insert({
    id: pedidoId,
    nome: input.nome,
    email: input.email,
    telefone: input.telefone,
    whatsapp: input.whatsapp,
    tem_inscricao: temInscricao,
    tem_trabalho: temTrabalho,
    categoria: temInscricao ? input.categoria : null,
    valor_cursos: valorCursos,
    valor_jantar: valorJantar,
    valor_trabalho: valorTrabalho,
    desconto_cupom: descontoCupom,
    jantar_opcao: temInscricao ? input.jantarOpcao ?? null : null,
    cupom_codigo: input.cupom?.codigo ?? null,
    status: "pendente",
    mp_reference_id: mpReferenceId,
    metodo_pagamento: input.metodoPagamento,
    consentimento_lgpd_em: new Date().toISOString(),
  });
  // Se a policy de RLS rejeitar (ex.: inscrições bloqueadas), o erro sobe daqui.
  if (pedidoError) throw pedidoError;

  if (temInscricao) {
    const { error: inscritoError } = await supabase.from("inscritos").insert({
      id: crypto.randomUUID(),
      pedido_id: pedidoId,
      ra: input.ra?.trim() || null,
      instituicao_externa: input.instituicaoExterna?.trim() || null,
    });
    if (inscritoError) throw inscritoError;

    const pedidoCursosRows = cursosInfo.map((c) => ({
      pedido_id: pedidoId,
      curso_ref: c.id,
      curso_titulo: c.titulo,
      valor: categoriaInfo!.valorCurso,
    }));
    const { error: cursosError } = await supabase.from("pedido_cursos").insert(pedidoCursosRows);
    if (cursosError) throw cursosError;
  }

  if (temTrabalho) {
    const t = input.trabalho!;
    const trabalhoId = crypto.randomUUID();
    const { error: trabalhoError } = await supabase.from("trabalhos").insert({
      id: trabalhoId,
      pedido_id: pedidoId,
      titulo: t.titulo,
      resumo: t.resumo,
      categoria: t.categoria,
      modalidade: t.modalidade,
      formato: t.formato,
    });
    if (trabalhoError) throw trabalhoError;

    const { error: arquivosError } = await supabase.from("trabalho_arquivos").insert(
      arquivosParaGravar.map((a) => ({
        trabalho_id: trabalhoId,
        arquivo_path: a.path,
        arquivo_nome: a.nome,
        arquivo_tipo: a.tipo,
      }))
    );
    if (arquivosError) throw arquivosError;

    const coautoresValidos = t.coautores.map((n) => n.trim()).filter(Boolean);
    if (coautoresValidos.length > 0) {
      const rows = coautoresValidos.map((nome) => ({ trabalho_id: trabalhoId, nome }));
      const { error: coautoresError } = await supabase.from("coautores").insert(rows);
      if (coautoresError) throw coautoresError;
    }
  }

  return { pedidoId, mpReferenceId };
}
