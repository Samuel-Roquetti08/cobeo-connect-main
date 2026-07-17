// ============================================================================
// COBEO CONNECT — Camada de acesso a dados do admin (Supabase)
// ============================================================================
// Funções puras que leem/escrevem no Supabase e devolvem os tipos de
// adminTypes.ts. As páginas do admin NÃO chamam o supabase diretamente —
// passam por aqui. Isso centraliza queries, facilita manutenção e mantém a
// UI desacoplada do formato do banco.
//
// Por que uma view + queries separadas:
//   - `vw_inscricoes_completas` já faz o join pedido+inscrito+trabalho+cupom,
//     mas NÃO traz os cursos (que são N por pedido). Por isso buscamos os
//     cursos em separado e montamos o agregado no cliente.

import { supabase } from "../supabaseClient";
import type {
  Inscrito,
  Trabalho,
  Cupom,
  ConfiguracoesEvento,
  PedidoCurso,
  StatusPagamento,
  CategoriaParticipante,
  JantarOpcao,
  CupomCategoria,
  ElegivelCertificado,
  ElegivelJantar,
} from "./adminTypes";

// ─── INSCRITOS ───────────────────────────────────────────────────────────────
export async function getInscritos(): Promise<Inscrito[]> {
  // 1. Busca todos os pedidos que têm inscrição (cursos/jantar)
  const { data: pedidos, error: errPedidos } = await supabase
    .from("pedidos")
    .select(`
      id, nome, email, telefone, whatsapp, categoria,
      tem_inscricao, tem_trabalho,
      valor_cursos, valor_jantar, valor_trabalho, desconto_cupom, valor_total,
      jantar_opcao, status, metodo_pagamento, pago_em, created_at
    `)
    .eq("tem_inscricao", true)
    .order("created_at", { ascending: false });

  if (errPedidos) throw errPedidos;
  if (!pedidos || pedidos.length === 0) return [];

  const pedidoIds = pedidos.map((p) => p.id);

  // 2. Busca inscritos (codigo_inscricao, presença) desses pedidos
  const { data: inscritos, error: errInscritos } = await supabase
    .from("inscritos")
    .select("id, pedido_id, codigo_inscricao, presenca, primeiro_checkin_em")
    .in("pedido_id", pedidoIds);
  if (errInscritos) throw errInscritos;

  // 3. Busca os cursos comprados desses pedidos
  const { data: cursos, error: errCursos } = await supabase
    .from("pedido_cursos")
    .select("id, pedido_id, curso_ref, curso_titulo, valor")
    .in("pedido_id", pedidoIds);
  if (errCursos) throw errCursos;

  // 4. Busca cupons vinculados (para exibir o código usado)
  const { data: cupons, error: errCupons } = await supabase
    .from("cupons")
    .select("codigo, pedido_id")
    .in("pedido_id", pedidoIds);
  if (errCupons) throw errCupons;

  // 5. Monta os agregados no cliente (mapas para O(1) lookup)
  const inscritoPorPedido = new Map(
    (inscritos ?? []).map((i) => [i.pedido_id, i]),
  );
  const cursosPorPedido = new Map<string, PedidoCurso[]>();
  for (const c of cursos ?? []) {
    const arr = cursosPorPedido.get(c.pedido_id) ?? [];
    arr.push({ id: c.id, curso_ref: c.curso_ref, curso_titulo: c.curso_titulo, valor: Number(c.valor) });
    cursosPorPedido.set(c.pedido_id, arr);
  }
  const cupomPorPedido = new Map(
    (cupons ?? []).map((c) => [c.pedido_id, c.codigo]),
  );

  return pedidos.map((p) => {
    const ins = inscritoPorPedido.get(p.id);
    return {
      pedidoId: p.id,
      inscritoId: ins?.id ?? null,
      nome: p.nome,
      email: p.email,
      telefone: p.telefone,
      whatsapp: p.whatsapp,
      categoria: (p.categoria as CategoriaParticipante) ?? null,
      codigoInscricao: ins?.codigo_inscricao ?? null,
      cursos: cursosPorPedido.get(p.id) ?? [],
      jantarOpcao: (p.jantar_opcao as JantarOpcao) ?? null,
      temTrabalho: p.tem_trabalho,
      cupomCodigo: cupomPorPedido.get(p.id) ?? null,
      descontoCupom: Number(p.desconto_cupom),
      valorCursos: Number(p.valor_cursos),
      valorJantar: Number(p.valor_jantar),
      valorTrabalho: Number(p.valor_trabalho),
      valorTotal: Number(p.valor_total),
      status: p.status as StatusPagamento,
      metodoPagamento: p.metodo_pagamento ?? null,
      pagoEm: p.pago_em ?? null,
      createdAt: p.created_at,
      presenca: ins?.presenca ?? false,
      primeiroCheckinEm: ins?.primeiro_checkin_em ?? null,
    };
  });
}

// ─── TRABALHOS ───────────────────────────────────────────────────────────────
export async function getTrabalhos(): Promise<Trabalho[]> {
  const { data: trabalhos, error } = await supabase
    .from("trabalhos")
    .select(`
      id, pedido_id, titulo, resumo, categoria, modalidade, formato,
      arquivo_path, arquivo_nome,
      pedidos!inner ( nome, email, status )
    `)
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!trabalhos || trabalhos.length === 0) return [];

  const ids = trabalhos.map((t) => t.id);
  const { data: coautores, error: errCo } = await supabase
    .from("coautores")
    .select("trabalho_id, nome")
    .in("trabalho_id", ids);
  if (errCo) throw errCo;

  const coautoresPorTrabalho = new Map<string, string[]>();
  for (const c of coautores ?? []) {
    const arr = coautoresPorTrabalho.get(c.trabalho_id) ?? [];
    arr.push(c.nome);
    coautoresPorTrabalho.set(c.trabalho_id, arr);
  }

  return trabalhos.map((t) => {
    // o join vem como objeto (inner). normaliza para um único registro
    const pedido = Array.isArray(t.pedidos) ? t.pedidos[0] : t.pedidos;
    return {
      id: t.id,
      pedidoId: t.pedido_id,
      responsavel: pedido?.nome ?? "—",
      responsavelEmail: pedido?.email ?? "—",
      titulo: t.titulo,
      resumo: t.resumo,
      categoria: t.categoria,
      modalidade: t.modalidade,
      formato: t.formato,
      coautores: coautoresPorTrabalho.get(t.id) ?? [],
      arquivoPath: t.arquivo_path ?? null,
      arquivoNome: t.arquivo_nome ?? null,
      status: (pedido?.status as StatusPagamento) ?? "pendente",
      createdAt: (t as { created_at?: string }).created_at ?? new Date().toISOString(),
    };
  });
}

// Gera uma URL assinada temporária para baixar o PDF de um trabalho.
// O bucket é privado — a URL expira (default 60s) e nunca é pública.
export async function getTrabalhoDownloadUrl(arquivoPath: string): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from("trabalhos-pdfs")
    .createSignedUrl(arquivoPath, 60);
  if (error) throw error;
  return data.signedUrl;
}

// ─── CUPONS ──────────────────────────────────────────────────────────────────
export async function getCupons(): Promise<Cupom[]> {
  const { data, error } = await supabase
    .from("cupons")
    .select("id, codigo, titular, categoria, tipo, valor, status, usado_em, pedido_id, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((c) => ({
    id: c.id,
    codigo: c.codigo,
    titular: c.titular,
    categoria: c.categoria as CupomCategoria,
    tipo: c.tipo as "fixo" | "percentual",
    valor: Number(c.valor),
    status: c.status as Cupom["status"],
    usadoEm: c.usado_em ?? null,
    pedidoId: c.pedido_id ?? null,
    createdAt: c.created_at,
  }));
}

export async function createCupom(input: {
  codigo: string;
  titular: string;
  categoria: CupomCategoria;
  tipo: "fixo" | "percentual";
  valor: number;
}): Promise<Cupom> {
  const { data, error } = await supabase
    .from("cupons")
    .insert({
      codigo: input.codigo.toUpperCase(),
      titular: input.titular,
      categoria: input.categoria,
      tipo: input.tipo,
      valor: input.valor,
      status: "disponivel",
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    codigo: data.codigo,
    titular: data.titular,
    categoria: data.categoria,
    tipo: data.tipo,
    valor: Number(data.valor),
    status: data.status,
    usadoEm: data.usado_em ?? null,
    pedidoId: data.pedido_id ?? null,
    createdAt: data.created_at,
  };
}

export async function deleteCupom(id: string): Promise<void> {
  const { error } = await supabase.from("cupons").delete().eq("id", id);
  if (error) throw error;
}

// ─── CONFIGURAÇÕES DO EVENTO ─────────────────────────────────────────────────
export async function getConfiguracoes(): Promise<ConfiguracoesEvento> {
  const { data, error } = await supabase
    .from("configuracoes_evento")
    .select("inscricoes_bloqueadas, jantar_bloqueado, certificados_enviados_em")
    .eq("id", 1)
    .single();
  if (error) throw error;
  return {
    inscricoesBloqueadas: data.inscricoes_bloqueadas,
    jantarBloqueado: data.jantar_bloqueado,
    certificadosEnviadosEm: data.certificados_enviados_em ?? null,
  };
}

export async function updateConfiguracoes(
  patch: Partial<{ inscricoesBloqueadas: boolean; jantarBloqueado: boolean }>,
): Promise<void> {
  const dbPatch: Record<string, boolean> = {};
  if (patch.inscricoesBloqueadas !== undefined) dbPatch.inscricoes_bloqueadas = patch.inscricoesBloqueadas;
  if (patch.jantarBloqueado !== undefined) dbPatch.jantar_bloqueado = patch.jantarBloqueado;
  const { error } = await supabase
    .from("configuracoes_evento")
    .update(dbPatch)
    .eq("id", 1);
  if (error) throw error;
}

// ─── CERTIFICADOS ────────────────────────────────────────────────────────────
// Elegível = pedido pago E presença registrada em todos os cursos comprados
// (a agregação é feita no banco via vw_elegiveis_certificado — mais barato e
// correto do que puxar tudo e contar em JavaScript).
export async function getElegiveisCertificado(): Promise<ElegivelCertificado[]> {
  const { data, error } = await supabase
    .from("vw_elegiveis_certificado")
    .select("inscrito_id, codigo_inscricao, pedido_id, nome, email, total_cursos, cursos_presentes, elegivel");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    inscritoId: r.inscrito_id,
    codigoInscricao: r.codigo_inscricao,
    pedidoId: r.pedido_id,
    nome: r.nome,
    email: r.email,
    totalCursos: r.total_cursos,
    cursosPresentes: r.cursos_presentes,
    elegivel: r.elegivel,
  }));
}

// Ação em massa e irreversível: grava o timestamp de envio (usado pela UI para
// desabilitar o botão e evitar reenvio/duplicação de e-mails).
export async function marcarCertificadosEnviados(): Promise<void> {
  const { error } = await supabase
    .from("configuracoes_evento")
    .update({ certificados_enviados_em: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw error;
}

// ─── CHECK-IN ────────────────────────────────────────────────────────────────
// Busca um inscrito pelo código (COBEO-XXXX), nome ou e-mail, trazendo seus
// cursos e as presenças já registradas. Usado na tela de check-in por curso.
export interface InscritoCheckin {
  inscritoId: string;
  pedidoId: string;
  nome: string;
  email: string;
  codigoInscricao: string;
  status: StatusPagamento;
  categoria: CategoriaParticipante | null;
  cursos: PedidoCurso[];
  presencas: { curso_ref: string; confirmado_em: string }[];
}

export async function buscarParaCheckin(termo: string): Promise<InscritoCheckin | null> {
  const t = termo.trim();
  if (!t) return null;

  // Tenta primeiro por código exato (caso mais comum — vem do QR Code)
  let pedidoId: string | null = null;
  let inscritoRow: { id: string; pedido_id: string; codigo_inscricao: string } | null = null;

  const { data: byCode } = await supabase
    .from("inscritos")
    .select("id, pedido_id, codigo_inscricao")
    .ilike("codigo_inscricao", t)
    .maybeSingle();

  if (byCode) {
    inscritoRow = byCode;
    pedidoId = byCode.pedido_id;
  } else {
    // Busca por nome ou e-mail no pedido
    const { data: pedidoMatch } = await supabase
      .from("pedidos")
      .select("id")
      .eq("tem_inscricao", true)
      .or(`nome.ilike.%${t}%,email.ilike.%${t}%`)
      .limit(1)
      .maybeSingle();
    if (!pedidoMatch) return null;
    pedidoId = pedidoMatch.id;
    const { data: ins } = await supabase
      .from("inscritos")
      .select("id, pedido_id, codigo_inscricao")
      .eq("pedido_id", pedidoId)
      .maybeSingle();
    if (!ins) return null;
    inscritoRow = ins;
  }

  if (!inscritoRow || !pedidoId) return null;

  // Dados do pedido
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("nome, email, status, categoria")
    .eq("id", pedidoId)
    .single();

  // Cursos comprados
  const { data: cursos } = await supabase
    .from("pedido_cursos")
    .select("id, curso_ref, curso_titulo, valor")
    .eq("pedido_id", pedidoId);

  // Presenças já registradas
  const { data: presencas } = await supabase
    .from("presencas")
    .select("curso_ref, confirmado_em")
    .eq("inscrito_id", inscritoRow.id);

  return {
    inscritoId: inscritoRow.id,
    pedidoId,
    nome: pedido?.nome ?? "—",
    email: pedido?.email ?? "—",
    codigoInscricao: inscritoRow.codigo_inscricao,
    status: (pedido?.status as StatusPagamento) ?? "pendente",
    categoria: (pedido?.categoria as CategoriaParticipante) ?? null,
    cursos: (cursos ?? []).map((c) => ({ id: c.id, curso_ref: c.curso_ref, curso_titulo: c.curso_titulo, valor: Number(c.valor) })),
    presencas: (presencas ?? []).map((p) => ({ curso_ref: p.curso_ref, confirmado_em: p.confirmado_em })),
  };
}

// Registra presença de um inscrito em um curso específico.
// O trigger do banco atualiza inscritos.presenca = true automaticamente.
export async function registrarPresenca(
  inscritoId: string, cursoRef: string, confirmadoPor: string,
): Promise<void> {
  const { error } = await supabase
    .from("presencas")
    .insert({ inscrito_id: inscritoId, curso_ref: cursoRef, confirmado_por: confirmadoPor });
  if (error) throw error;
}

// ─── CHECK-IN DO JANTAR (T5) ───────────────────────────────────────────────────
// Busca via vw_elegiveis_jantar (supabase/sql/002_checkin_jantar.sql), que já
// traz comprado x presente calculado no banco. Mesmo padrão de busca de
// buscarParaCheckin: código exato primeiro, depois nome/e-mail.
function mapElegivelJantar(r: Record<string, unknown>): ElegivelJantar {
  return {
    inscritoId: r.inscrito_id as string,
    codigoInscricao: r.codigo_inscricao as string,
    pedidoId: r.pedido_id as string,
    nome: r.nome as string,
    email: r.email as string,
    comprouJantar: r.comprou_jantar as boolean,
    opcaoJantar: r.opcao_jantar as JantarOpcao,
    cursosComprados: r.cursos_comprados as number,
    cursosPresentes: r.cursos_presentes as number,
    cursosFaltantes: (r.cursos_faltantes as string[]) ?? [],
    elegivelJantar: r.elegivel_jantar as boolean,
    jantarCheckInEm: r.jantar_check_in_em as string | null,
    jantarCheckInPor: r.jantar_check_in_por as string | null,
    jantarCheckInOverride: r.jantar_check_in_override as boolean,
    jantarCheckInMotivo: r.jantar_check_in_motivo as string | null,
  };
}

export async function buscarParaCheckinJantar(termo: string): Promise<ElegivelJantar | null> {
  const t = termo.trim();
  if (!t) return null;

  const { data: byCode } = await supabase
    .from("vw_elegiveis_jantar")
    .select("*")
    .ilike("codigo_inscricao", t)
    .maybeSingle();
  if (byCode) return mapElegivelJantar(byCode);

  const { data: byNomeOuEmail } = await supabase
    .from("vw_elegiveis_jantar")
    .select("*")
    .or(`nome.ilike.%${t}%,email.ilike.%${t}%`)
    .limit(1)
    .maybeSingle();
  if (byNomeOuEmail) return mapElegivelJantar(byNomeOuEmail);

  return null;
}

// Idempotente por natureza: o `.is("jantar_check_in_em", null)` faz o UPDATE
// não afetar nenhuma linha se já houver check-in — dois cliques (ou dois
// fiscais) não sobrescrevem o registro original. Retorna null se não havia
// check-in prévio pra fazer (já confirmado — a UI trata isso antes de chamar).
export async function registrarCheckinJantar(
  inscritoId: string,
  confirmadoPor: string,
  override: boolean,
  motivo: string | null,
): Promise<void> {
  const { data, error } = await supabase
    .from("inscritos")
    .update({
      jantar_check_in_em: new Date().toISOString(),
      jantar_check_in_por: confirmadoPor,
      jantar_check_in_override: override,
      jantar_check_in_motivo: motivo,
    })
    .eq("id", inscritoId)
    .is("jantar_check_in_em", null)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Este participante já fez check-in no jantar.");
  }
}

// ─── CRACHÁS ─────────────────────────────────────────────────────────────────
// Lista inscritos pagos com código e cursos, para gerar crachás com QR Code.
export interface CrachaInscrito {
  inscritoId: string;
  nome: string;
  email: string;
  codigoInscricao: string;
  categoria: CategoriaParticipante | null;
  cursos: string[];
}

export async function getInscritosParaCracha(): Promise<CrachaInscrito[]> {
  const { data: pedidos } = await supabase
    .from("pedidos")
    .select("id, nome, email, categoria")
    .eq("tem_inscricao", true)
    .eq("status", "pago")
    .order("nome");
  if (!pedidos || pedidos.length === 0) return [];

  const ids = pedidos.map((p) => p.id);
  const { data: inscritos } = await supabase
    .from("inscritos")
    .select("id, pedido_id, codigo_inscricao")
    .in("pedido_id", ids);
  const { data: cursos } = await supabase
    .from("pedido_cursos")
    .select("pedido_id, curso_titulo")
    .in("pedido_id", ids);

  const insPorPedido = new Map((inscritos ?? []).map((i) => [i.pedido_id, i]));
  const cursosPorPedido = new Map<string, string[]>();
  for (const c of cursos ?? []) {
    const arr = cursosPorPedido.get(c.pedido_id) ?? [];
    arr.push(c.curso_titulo);
    cursosPorPedido.set(c.pedido_id, arr);
  }

  return pedidos
    .filter((p) => insPorPedido.has(p.id))
    .map((p) => {
      const ins = insPorPedido.get(p.id)!;
      return {
        inscritoId: ins.id,
        nome: p.nome,
        email: p.email,
        codigoInscricao: ins.codigo_inscricao,
        categoria: (p.categoria as CategoriaParticipante) ?? null,
        cursos: cursosPorPedido.get(p.id) ?? [],
      };
    });
}
