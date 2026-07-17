// ============================================================================
// COBEO CONNECT — Tipos da camada admin (alinhados ao schema v3 do Supabase)
// ============================================================================
// Estes tipos refletem as colunas reais das tabelas/view do banco, não o
// modelo antigo de ingresso único. Toda a UI do admin consome a partir daqui.

export type StatusPagamento =
  | "pendente"
  | "pago"
  | "cancelado"
  | "reembolsado"
  | "expirado";

export type CategoriaParticipante =
  | "aluno_unifafibe"
  | "aluno_externo"
  | "profissional";

export type JantarOpcao = "com_restricao" | "sem_restricao" | null;

// Rótulos legíveis para exibição na UI
export const STATUS_LABELS: Record<StatusPagamento, string> = {
  pendente: "Pendente",
  pago: "Confirmado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
  expirado: "Expirado",
};

export const CATEGORIA_LABELS: Record<CategoriaParticipante, string> = {
  aluno_unifafibe: "Aluno UNIFAFIBE",
  aluno_externo: "Aluno Externo",
  profissional: "Profissional",
};

export const JANTAR_LABELS: Record<NonNullable<JantarOpcao>, string> = {
  com_restricao: "Jantar (com restrição)",
  sem_restricao: "Jantar (sem restrição)",
};

// ─── Curso comprado dentro de um pedido ──────────────────────────────────────
export interface PedidoCurso {
  id: string;
  curso_ref: string;
  curso_titulo: string;
  valor: number;
}

// ─── Inscrito (pedido + inscrito, com cursos agregados) ──────────────────────
export interface Inscrito {
  pedidoId: string;
  inscritoId: string | null;
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  categoria: CategoriaParticipante | null;
  codigoInscricao: string | null;
  // Itens do pedido
  cursos: PedidoCurso[];
  jantarOpcao: JantarOpcao;
  temTrabalho: boolean;
  // Cupom
  cupomCodigo: string | null;
  descontoCupom: number;
  // Valores
  valorCursos: number;
  valorJantar: number;
  valorTrabalho: number;
  valorTotal: number;
  // Pagamento
  status: StatusPagamento;
  metodoPagamento: string | null;
  pagoEm: string | null;
  createdAt: string;
  // Presença
  presenca: boolean;
  primeiroCheckinEm: string | null;
}

// ─── Trabalho ────────────────────────────────────────────────────────────────
export interface Trabalho {
  id: string;
  pedidoId: string;
  responsavel: string;
  responsavelEmail: string;
  titulo: string;
  resumo: string;
  categoria: string;
  modalidade: string;
  formato: string;
  coautores: string[];
  arquivoPath: string | null;
  arquivoNome: string | null;
  status: StatusPagamento;
  createdAt: string;
}

// ─── Cupom ───────────────────────────────────────────────────────────────────
export type CupomCategoria =
  | "aluno_interno"
  | "servidor_publico"
  | "aluno_externo"
  | "publico_geral";

export type CupomStatus = "disponivel" | "utilizado" | "expirado";

export const CUPOM_CATEGORIA_LABELS: Record<CupomCategoria, string> = {
  aluno_interno: "Aluno Interno",
  servidor_publico: "Servidor Público",
  aluno_externo: "Aluno Externo",
  publico_geral: "Público Geral",
};

export interface Cupom {
  id: string;
  codigo: string;
  titular: string;
  categoria: CupomCategoria;
  tipo: "fixo" | "percentual";
  valor: number;
  status: CupomStatus;
  usadoEm: string | null;
  pedidoId: string | null;
  createdAt: string;
}

// ─── Configurações do evento (singleton) ─────────────────────────────────────
export interface ConfiguracoesEvento {
  inscricoesBloqueadas: boolean;
  jantarBloqueado: boolean;
  certificadosEnviadosEm: string | null;
}

// ─── Elegibilidade de certificado ─────────────────────────────────────────────
export interface ElegivelCertificado {
  inscritoId: string;
  codigoInscricao: string;
  pedidoId: string;
  nome: string;
  email: string;
  totalCursos: number;
  cursosPresentes: number;
  elegivel: boolean;
}

// ─── Elegibilidade do jantar de encerramento (T5) ─────────────────────────────
// Comprar não basta: elegível = comprou o jantar E compareceu a todos os
// cursos que comprou (via check-ins em `presencas`). cursosFaltantes traz os
// títulos dos cursos comprados sem presença — é o "motivo" exibido na porta.
export interface ElegivelJantar {
  inscritoId: string;
  codigoInscricao: string;
  pedidoId: string;
  nome: string;
  email: string;
  comprouJantar: boolean;
  opcaoJantar: JantarOpcao;
  cursosComprados: number;
  cursosPresentes: number;
  cursosFaltantes: string[];
  elegivelJantar: boolean;
  jantarCheckInEm: string | null;
  jantarCheckInPor: string | null;
  jantarCheckInOverride: boolean;
  jantarCheckInMotivo: string | null;
}
