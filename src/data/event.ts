// ─── Dados Gerais do Evento ───────────────────────────────────────────────────
export const evento = {
  nome: "II COBEO — Congresso de Odontologia de Bebedouro",
  data: "7 a 9 de outubro de 2026",
  local: "Anfiteatro 1 — Centro Universitário UNIFAFIBE — Bebedouro/SP",
  localMaps: "https://maps.google.com/?q=Centro+Universitário+UNIFAFIBE+Bebedouro+SP",
  edicao: "II Edição · 2026",
};

export const stats = [
  { value: 7, suffix: "+", label: "Cursos Confirmados" },
  { value: 3, suffix: " dias", label: "De Conteúdo" },
  { value: 100, suffix: "%", label: "Certificado Digital Incluso" },
];

// ─── Categorias de participante (definem o preço dos cursos) ─────────────────
export const categorias = [
  { id: "aluno_unifafibe" as const, label: "Aluno UNIFAFIBE", valorCurso: 35 },
  { id: "aluno_externo"   as const, label: "Aluno Externo",   valorCurso: 40 },
  { id: "profissional"    as const, label: "Profissional",    valorCurso: 50 },
] as const;

export type CategoriaId = typeof categorias[number]["id"];

// ─── Cursos (Grade Científica) ────────────────────────────────────────────────
// cursoRef é o ID usado no check-in, banco e crachá
export const cursos = [
  {
    id: "hmi",
    titulo: "Protocolos Clínicos Inovadores para o Tratamento da HMI",
    palestrante: "Profa. Dra. Kelly Moreira",
    instituicao: "São Leopoldo Mandic",
    dia: "07/10",
    diaId: "dia1",
    horario: "14h–15h45",
    periodo: "tarde",
  },
  {
    id: "estetica_cirurgia",
    titulo: "Noções de Estética e Cirurgia Ortognática",
    palestrante: "Prof. Dr. Marcelo Monazzi",
    instituicao: "FOAR-UNESP",
    dia: "07/10",
    diaId: "dia1",
    horario: "16h–18h",
    periodo: "tarde",
  },
  {
    id: "hof_ortodontia",
    titulo: "HOF ou Ortodontia", // [LOREM - AGUARDANDO CONFIRMAÇÃO DE PALESTRANTE]
    palestrante: null,
    instituicao: null,
    dia: "07/10",
    diaId: "dia1",
    horario: "19h–21h",
    periodo: "noite",
  },
  {
    id: "odontologia_hospitalar",
    titulo: "Odontologia Hospitalar",
    palestrante: "Profa. Dra. Reyna Aguilar Quispe · Dra. Stela",
    instituicao: "UNORTE / HOSPTAL",
    dia: "08/10",
    diaId: "dia2",
    horario: "14h–15h45",
    periodo: "tarde",
  },
  {
    id: "estetica_periodontal",
    titulo: "Estética Periodontal",
    palestrante: "Prof. Me. Renan Souza",
    instituicao: null,
    dia: "08/10",
    diaId: "dia2",
    horario: "16h–18h",
    periodo: "tarde",
  },
  {
    id: "odontologia_legal",
    titulo: "Odontologia Legal: Campos de Atuação, Mercado de Trabalho e Casuística",
    palestrante: "Prof. Dr. Ricardo Henrique Alves da Silva",
    instituicao: "FORP-USP",
    dia: "08/10",
    diaId: "dia2",
    horario: "19h–21h",
    periodo: "noite",
  },
  {
    id: "dor_nao_odontogenica",
    titulo: "Odontologia Além dos Dentes: Quando a Dor Não É Odontogênica",
    palestrante: "Prof. Dr. Matheus Herreira Ferreira",
    instituicao: "FORP-USP",
    dia: "09/10",
    diaId: "dia3",
    horario: "14h–15h45",
    periodo: "tarde",
  },
  {
    id: "endodontia",
    titulo: "Endodontia", // [LOREM - AGUARDANDO CONFIRMAÇÃO DE PALESTRANTE]
    palestrante: null,
    instituicao: null,
    dia: "09/10",
    diaId: "dia3",
    horario: "16h–18h",
    periodo: "tarde",
  },
] as const;

export type CursoId = typeof cursos[number]["id"];

// ─── Programação completa (inclui eventos não pagos) ─────────────────────────
export const programacao = [
  {
    dia: "Dia 1 — 07/10",
    diaId: "dia1",
    itens: [
      { hora: "14h–15h45", titulo: "Protocolos Clínicos Inovadores para o Tratamento da HMI", speaker: "Profa. Dra. Kelly Moreira · São Leopoldo Mandic", tipo: "curso" as const },
      { hora: "16h–18h",   titulo: "Noções de Estética e Cirurgia Ortognática", speaker: "Prof. Dr. Marcelo Monazzi · FOAR-UNESP", tipo: "curso" as const },
      { hora: "18h–19h",   titulo: "Apresentação de Trabalhos — Presencial", speaker: "", tipo: "break" as const },
      { hora: "19h–21h",   titulo: "HOF ou Ortodontia", speaker: "A confirmar", tipo: "curso" as const },
      { hora: "21h–22h30", titulo: "Cerimonial de Abertura", speaker: "", tipo: "break" as const },
    ],
  },
  {
    dia: "Dia 2 — 08/10",
    diaId: "dia2",
    itens: [
      { hora: "09h–11h",   titulo: "Apresentação de Trabalhos — Online", speaker: "", tipo: "break" as const },
      { hora: "14h–15h45", titulo: "Odontologia Hospitalar", speaker: "Profa. Dra. Reyna Aguilar Quispe · Dra. Stela — UNORTE/HOSPTAL", tipo: "curso" as const },
      { hora: "16h–18h",   titulo: "Estética Periodontal", speaker: "Prof. Me. Renan Souza", tipo: "curso" as const },
      { hora: "18h–19h",   titulo: "Apresentação de Trabalhos — Presencial", speaker: "", tipo: "break" as const },
      { hora: "19h–21h",   titulo: "Odontologia Legal: Campos de Atuação, Mercado de Trabalho e Casuística", speaker: "Prof. Dr. Ricardo Henrique Alves da Silva · FORP-USP", tipo: "curso" as const },
      { hora: "21h–22h",   titulo: "Sorteios / Workshop Patrocinadores", speaker: "", tipo: "break" as const },
    ],
  },
  {
    dia: "Dia 3 — 09/10",
    diaId: "dia3",
    itens: [
      { hora: "14h–15h45", titulo: "Odontologia Além dos Dentes: Quando a Dor Não É Odontogênica", speaker: "Prof. Dr. Matheus Herreira Ferreira · FORP-USP", tipo: "curso" as const },
      { hora: "16h–18h",   titulo: "Endodontia", speaker: "A confirmar", tipo: "curso" as const },
      { hora: "18h–19h",   titulo: "Apresentação de Trabalhos — Presencial", speaker: "", tipo: "break" as const },
      { hora: "19h–21h",   titulo: "Jantar de Encerramento e Premiação dos Melhores Trabalhos", speaker: "", tipo: "break" as const },
    ],
  },
];

// ─── Jantar de Encerramento ───────────────────────────────────────────────────
export const jantar = {
  label: "Jantar de Encerramento",
  local: "Boulevard BQ Bebedouro",
  data: "09/10/2026 · 19h–21h",
  opcoes: [
    { id: "com_restricao"  as const, label: "Com restrição de bebidas",  valor: 100 },
    { id: "sem_restricao"  as const, label: "Sem restrição de bebidas",  valor: 160 },
  ],
  // Jantar só disponível para quem comprar 3 ou mais cursos
  minimosCursos: 3,
  // Acompanhantes não precisam de cursos — gerenciado pela equipe do Fabiano
  observacoes: [
    "A compra do jantar está condicionada à participação em pelo menos 3 cursos.",
    "Menores de idade devem estar acompanhados de um responsável maior. Haverá checagem de documentação na entrada.",
    "Reservas limitadas — sujeito ao controle no painel administrativo.",
  ],
} as const;

export type JantarOpcaoId = typeof jantar.opcoes[number]["id"];

// ─── Submissão de Trabalhos ───────────────────────────────────────────────────
export const trabalho = {
  valor: 70,
  categorias: [
    "Revisão Sistemática",
    "Pesquisa Científica",
    "Relato de Caso Clínico ou Série de Casos",
    "Revisão de Literatura",
    "Extensão Universitária",
  ],
  modalidades: ["Presencial", "Online"] as const,
  formatos: ["Oral", "Pôster"] as const,
  observacoes: [
    "Os resumos dos trabalhos serão publicados na Revista UNIFAFIBE.",
    "Os melhores trabalhos serão premiados no Jantar de Encerramento (09/10).",
  ],
};

// ─── Palestrantes ─────────────────────────────────────────────────────────────
// [LOREM — aguardando fotos e dados completos do Fabiano]
export const palestrantes = [
  {
    nome: "Profa. Dra. Kelly Moreira",
    foto: null, // [LOREM — aguardando foto]
    especialidade: "HMI / Odontopediatria",
    instituicao: "São Leopoldo Mandic",
    tag: "HMI · Mandic",
  },
  {
    nome: "Prof. Dr. Marcelo Monazzi",
    foto: null,
    especialidade: "Cirurgia Ortognática / Estética",
    instituicao: "FOAR-UNESP",
    tag: "Cirurgia · FOAR-UNESP",
  },
  {
    nome: "Profa. Dra. Reyna Aguilar Quispe",
    foto: null,
    especialidade: "Odontologia Hospitalar",
    instituicao: "UNORTE / HOSPTAL",
    tag: "Hospitalar · UNORTE",
  },
  {
    nome: "Prof. Me. Renan Souza",
    foto: null,
    especialidade: "Estética Periodontal",
    instituicao: null,
    tag: "Periodontal · Estética",
  },
  {
    nome: "Prof. Dr. Ricardo Henrique Alves da Silva",
    foto: null,
    especialidade: "Odontologia Legal",
    instituicao: "FORP-USP",
    tag: "Legal · FORP-USP",
  },
  {
    nome: "Prof. Dr. Matheus Herreira Ferreira",
    foto: null,
    especialidade: "Dor Orofacial",
    instituicao: "FORP-USP",
    tag: "Dor Orofacial · USP",
  },
];

// ─── Contato ──────────────────────────────────────────────────────────────────
export const contato = {
  email: "cobeounifafibe@gmail.com",
  telefone: null, // [LOREM — aguardando telefone oficial]
  endereco: "Anfiteatro 1 — Centro Universitário UNIFAFIBE, Bebedouro/SP",
  maps: "https://maps.google.com/?q=Centro+Universitário+UNIFAFIBE+Bebedouro+SP",
};

// ─── Política de Reembolso ────────────────────────────────────────────────────
export const politicaReembolso = {
  email: "cobeounifafibe@gmail.com",
  regras: [
    { prazo: "Até 10 de setembro de 2026", percentual: 50, descricao: "Reembolso de 50% do valor pago." },
    { prazo: "Após 10 de setembro de 2026", percentual: 0, descricao: "Não haverá reembolso após esta data." },
  ],
  instrucoes: "Solicitações de reembolso devem ser enviadas para cobeounifafibe@gmail.com com o número do protocolo de inscrição.",
};

// ─── Cupons de desconto ───────────────────────────────────────────────────────
// Válidos APENAS para cursos. Não se aplica ao jantar nem à submissão de trabalho.
export const categoriasCupom = [
  "aluno_interno",
  "servidor_publico",
  "aluno_externo",
  "publico_geral",
] as const;

export type CategoriaCupom = typeof categoriasCupom[number];

// ─── COMPATIBILIDADE — aliases do modelo antigo ───────────────────────────────
// O Inscricoes.tsx ainda usa a estrutura antiga enquanto não é refatorado.
// Estes aliases mantêm o build funcionando durante a transição.
export const ingressos = [
  {
    id: "palestra" as const,
    label: "Palestra Avulsa",
    descricao: "Acesso a uma palestra à sua escolha",
    valor: 0, // preço agora depende da categoria — ver cursos[]
    badge: null as string | null,
  },
  {
    id: "dia" as const,
    label: "1 Dia do Congresso",
    descricao: "Acesso a todos os cursos de um dia",
    valor: 0,
    badge: null as string | null,
  },
  {
    id: "completo" as const,
    label: "3 Dias Completos",
    descricao: "Acesso a todos os cursos dos 3 dias",
    valor: 0,
    badge: "Mais popular",
  },
] as const;

export type IngressoId = typeof ingressos[number]["id"];

export const INGRESSO_LABELS: Record<IngressoId, string> = {
  palestra: "Palestra Avulsa",
  dia: "1 Dia do Congresso",
  completo: "3 Dias Completos",
};

export const palestrasAvulsas = cursos.map((c) => ({
  id: c.id,
  titulo: c.titulo,
  speaker: c.palestrante ?? "A confirmar",
  hora: c.horario,
  dia: c.dia,
  diaId: c.diaId,
}));

export const diasEvento = [
  { id: "dia1" as const, label: "Dia 1 — 07/10" },
  { id: "dia2" as const, label: "Dia 2 — 08/10" },
  { id: "dia3" as const, label: "Dia 3 — 09/10" },
];

export type DiaId = "dia1" | "dia2" | "dia3";

// precos (legado)
export const precos = {
  evento: 0, // agora é por curso + categoria
  trabalho: trabalho.valor,
};
