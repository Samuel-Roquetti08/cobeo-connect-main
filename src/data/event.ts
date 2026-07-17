// ─── Dados Gerais do Evento ───────────────────────────────────────────────────
export const evento = {
  nome: "II COBEO — Congresso de Odontologia de Bebedouro",
  data: "7 a 9 de outubro de 2026",
  local: "Centro Universitário UNIFAFIBE — Bebedouro/SP",
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
// cargaHoraria: pendência do Fabiano (item 4 da lista de pendências) — não
// inventar valores. null = ainda não definida; usar CARGA_HORARIA_PENDENTE_LABEL
// em qualquer exibição (ex.: certificado) até o dado real chegar.
export const CARGA_HORARIA_PENDENTE_LABEL = "[LOREM - AGUARDANDO DEFINIÇÃO DO CLIENTE]";

// grupoExclusivo: cursos com o mesmo valor acontecem ao mesmo tempo (hands-on
// paralelos) — o participante escolhe só UM do grupo. Aplicado no seletor de
// cursos do Inscricoes.tsx (seleção de um desmarca os outros do mesmo grupo).
// vagasLimitadas: hands-on com 30 vagas por turma — sinalizado na UI, mas o
// controle real de lotação ainda não está implementado (precisa de contagem
// no banco); por ora é só um aviso visual, não um limite de fato.
export const cursos = [
  {
    id: "hmi",
    titulo: "Protocolos Clínicos Inovadores para o Tratamento de HMI",
    palestrante: "Profa. Dra. Kelly Moreira",
    instituicao: "São Leopoldo Mandic",
    dia: "07/10",
    diaId: "dia1",
    horario: "14h–16h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: null as string | null,
    vagasLimitadas: false,
  },
  {
    id: "estetica_cirurgia",
    titulo: "Noções de Estética e Cirurgia Ortognática",
    palestrante: "Prof. Dr. Marcelo Monnazzi",
    instituicao: "FOAR-UNESP",
    dia: "07/10",
    diaId: "dia1",
    horario: "16h–18h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: null as string | null,
    vagasLimitadas: false,
  },
  {
    id: "handson_preparo_biomecanico",
    titulo: "Hands-on: Preparo Biomecânico de Alta Performance — Sistemas Rotatórios de NiTi Tratados Termicamente",
    palestrante: "Prof. Dr. Luiz Fernando de Freitas Oliveira",
    instituicao: "FOAR-UNESP",
    dia: "07/10",
    diaId: "dia1",
    horario: "19h–21h",
    periodo: "noite",
    cargaHoraria: null as number | null,
    grupoExclusivo: "dia1_1921" as string | null,
    vagasLimitadas: true,
  },
  {
    id: "handson_traumatologia",
    titulo: "Hands-on: Traumatologia Buco Maxilo Facial",
    palestrante: "Prof. Dr. Marcelo Monnazzi",
    instituicao: "FOAR-UNESP",
    dia: "07/10",
    diaId: "dia1",
    horario: "19h–21h",
    periodo: "noite",
    cargaHoraria: null as number | null,
    grupoExclusivo: "dia1_1921" as string | null,
    vagasLimitadas: true,
  },
  {
    id: "handson_odontologia_esporte",
    titulo: "Hands-on: Odontologia do Esporte", // [LOREM - PALESTRANTE AINDA NÃO CONFIRMADO PELO FABIANO]
    palestrante: null,
    instituicao: null,
    dia: "07/10",
    diaId: "dia1",
    horario: "19h–21h",
    periodo: "noite",
    cargaHoraria: null as number | null,
    grupoExclusivo: "dia1_1921" as string | null,
    vagasLimitadas: true,
  },
  {
    id: "odontologia_hospitalar",
    titulo: "Odontologia Hospitalar: Reabilitação de Fissura Labiopalatina e Cuidado Multiprofissional",
    palestrante: "Profa. Dra. Reyna Aguilar Quispe · Dra. Stela Carolina V. Baldin Aguiar",
    instituicao: "UNORTE / FUNFARME · Hospital Austa",
    dia: "08/10",
    diaId: "dia2",
    horario: "14h–16h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: null as string | null,
    vagasLimitadas: false,
  },
  {
    id: "handson_gengivodesign",
    titulo: "Hands-on: Gengivodesign Suture — Introdução à Microsutura em Periodontia",
    palestrante: "Prof. Me. Renan Souza",
    instituicao: null,
    dia: "08/10",
    diaId: "dia2",
    horario: "16h–18h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: "dia2_1618" as string | null,
    vagasLimitadas: true,
  },
  {
    id: "handson_facetas",
    titulo: "Hands-on: Facetas Estratificadas sem Resina Composta com Naturalidade",
    palestrante: "Prof. Dr. Alvaro Augusto Junqueira Júnior",
    instituicao: "FORP-USP",
    dia: "08/10",
    diaId: "dia2",
    horario: "16h–18h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: "dia2_1618" as string | null,
    vagasLimitadas: true,
  },
  {
    id: "handson_implantodontia",
    titulo: "Hands-on: Inovações na Implantodontia",
    palestrante: "Prof. Dr. Paulo Saad",
    instituicao: null,
    dia: "08/10",
    diaId: "dia2",
    horario: "16h–18h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: "dia2_1618" as string | null,
    vagasLimitadas: true,
  },
  {
    id: "handson_harmonizacao_labial",
    titulo: "Hands-on: Harmonização com Preenchimento Labial",
    palestrante: "Prof. Dr. Renato Assis Machado",
    instituicao: "FOP-UNICAMP",
    dia: "08/10",
    diaId: "dia2",
    horario: "16h–18h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: "dia2_1618" as string | null,
    vagasLimitadas: true,
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
    cargaHoraria: null as number | null,
    grupoExclusivo: null as string | null,
    vagasLimitadas: false,
  },
  {
    id: "dor_nao_odontogenica",
    titulo: "Odontologia Além dos Dentes: Quando a Dor Não É Odontogênica",
    palestrante: "Prof. Dr. Matheus Herreira Ferreira",
    instituicao: "FORP-USP",
    dia: "09/10",
    diaId: "dia3",
    horario: "14h–16h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: null as string | null,
    vagasLimitadas: false,
  },
  {
    id: "alinhadores_ortodonticos",
    titulo: "Alinhadores Ortodônticos: Indicações, Limitações e Estratégias Clínicas para a Classe II",
    palestrante: "Prof. Dr. Silvio Bellini",
    instituicao: "FOB-USP",
    dia: "09/10",
    diaId: "dia3",
    horario: "16h–18h",
    periodo: "tarde",
    cargaHoraria: null as number | null,
    grupoExclusivo: null as string | null,
    vagasLimitadas: false,
  },
] as const;

export type CursoId = typeof cursos[number]["id"];

// ─── Programação completa (inclui eventos não pagos) ─────────────────────────
export const programacao = [
  {
    dia: "Dia 1 — 07/10",
    diaId: "dia1",
    itens: [
      { hora: "14h–16h",   titulo: "Protocolos Clínicos Inovadores para o Tratamento de HMI", speaker: "Profa. Dra. Kelly Moreira · São Leopoldo Mandic", tipo: "curso" as const },
      { hora: "16h–18h",   titulo: "Noções de Estética e Cirurgia Ortognática", speaker: "Prof. Dr. Marcelo Monnazzi · FOAR-UNESP", tipo: "curso" as const },
      { hora: "18h–19h",   titulo: "Apresentação de Trabalhos — Presencial", speaker: "", tipo: "break" as const },
      { hora: "19h–21h",   titulo: "Hands-on (paralelos, escolha 1): Preparo Biomecânico de Alta Performance · Traumatologia Buco Maxilo Facial · Odontologia do Esporte", speaker: "Luiz F. de Freitas Oliveira · Marcelo Monnazzi · A confirmar", tipo: "curso" as const },
      { hora: "21h–22h30", titulo: "Cerimonial de Abertura", speaker: "", tipo: "break" as const },
    ],
  },
  {
    dia: "Dia 2 — 08/10",
    diaId: "dia2",
    itens: [
      { hora: "09h–11h",   titulo: "Apresentação de Trabalhos — Online", speaker: "", tipo: "break" as const },
      { hora: "14h–16h",   titulo: "Impacto da Odontologia na Reabilitação de Pacientes com Fissura Labiopalatina", speaker: "Profa. Dra. Reyna Aguilar Quispe · UNORTE/FUNFARME", tipo: "curso" as const },
      { hora: "14h–16h",   titulo: "Da UTI ao Centro de Referência: A Trajetória da Odontologia Hospitalar", speaker: "Dra. Stela Carolina V. Baldin Aguiar · FUNFARME/Hospital Austa", tipo: "curso" as const },
      { hora: "16h–18h",   titulo: "Hands-on (paralelos, escolha 1): Gengivodesign Suture · Facetas Estratificadas · Inovações na Implantodontia · Harmonização com Preenchimento Labial", speaker: "Renan Souza · Alvaro Junqueira Jr. · Paulo Saad · Renato Assis Machado", tipo: "curso" as const },
      { hora: "18h–19h",   titulo: "Apresentação de Trabalhos — Presencial", speaker: "", tipo: "break" as const },
      { hora: "19h–21h",   titulo: "Odontologia Legal: Campos de Atuação, Mercado de Trabalho e Casuística", speaker: "Prof. Dr. Ricardo Henrique Alves da Silva · FORP-USP", tipo: "curso" as const },
      { hora: "21h–22h",   titulo: "Sorteios / Workshop Patrocinadores", speaker: "", tipo: "break" as const },
    ],
  },
  {
    dia: "Dia 3 — 09/10",
    diaId: "dia3",
    itens: [
      { hora: "14h–16h",   titulo: "Odontologia Além dos Dentes: Quando a Dor Não É Odontogênica", speaker: "Prof. Dr. Matheus Herreira Ferreira · FORP-USP", tipo: "curso" as const },
      { hora: "16h–18h",   titulo: "Alinhadores Ortodônticos: Indicações, Limitações e Estratégias Clínicas para a Classe II", speaker: "Prof. Dr. Silvio Bellini · FOB-USP", tipo: "curso" as const },
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
// Fotos e bios recebidas do Fabiano em COBEO-2026.DADOS-DOS-CURSOS-E-PALESTRANTES.docx
export const palestrantes = [
  {
    nome: "Profa. Dra. Kelly Moreira",
    foto: "/palestrantes/kelly-moreira.jpg",
    especialidade: "HMI / Odontopediatria",
    instituicao: "São Leopoldo Mandic",
    tag: "HMI · Mandic",
    objectPosition: "center 30%",
  },
  {
    nome: "Prof. Dr. Marcelo Monnazzi",
    foto: "/palestrantes/marcelo-monnazzi.jpg",
    especialidade: "Cirurgia Buco-Maxilo-Facial / Traumatologia",
    instituicao: "FOAR-UNESP",
    tag: "CTBMF · FOAR-UNESP",
  },
  {
    nome: "Prof. Dr. Luiz Fernando de Freitas Oliveira",
    foto: "/palestrantes/luiz-fernando-oliveira.jpg",
    especialidade: "Endodontia",
    instituicao: "FOAR-UNESP",
    tag: "Endodontia · UNESP",
  },
  {
    nome: "Profa. Dra. Reyna Aguilar Quispe",
    foto: "/palestrantes/reyna-aguilar-quispe.jpg",
    especialidade: "Odontologia Hospitalar / Fissura Labiopalatina",
    instituicao: "UNORTE / FUNFARME",
    tag: "Hospitalar · UNORTE",
  },
  {
    nome: "Dra. Stela Carolina Vasques Baldin Aguiar",
    foto: "/palestrantes/stela-carolina-aguiar.jpg",
    especialidade: "Odontologia Hospitalar",
    instituicao: "FUNFARME / Hospital Austa",
    tag: "Hospitalar · FUNFARME",
    objectPosition: "center 30%",
  },
  {
    nome: "Prof. Me. Renan Souza",
    foto: "/palestrantes/renan-souza.jpg",
    especialidade: "Periodontia / Microcirurgia",
    instituicao: null,
    tag: "Periodontia",
  },
  {
    nome: "Prof. Dr. Alvaro Augusto Junqueira Júnior",
    foto: "/palestrantes/alvaro-junqueira.jpg",
    especialidade: "Dentística",
    instituicao: "FORP-USP",
    tag: "Dentística · FORP-USP",
  },
  {
    nome: "Prof. Dr. Paulo Saad",
    foto: "/palestrantes/paulo-saad.jpg",
    especialidade: "Implantodontia",
    instituicao: null,
    tag: "Implantodontia",
    objectPosition: "center 30%",
  },
  {
    nome: "Prof. Dr. Renato Assis Machado",
    foto: "/palestrantes/renato-assis-machado.jpg",
    especialidade: "Harmonização Orofacial",
    instituicao: "FOP-UNICAMP",
    tag: "Harmonização · UNICAMP",
  },
  {
    nome: "Prof. Dr. Ricardo Henrique Alves da Silva",
    foto: "/palestrantes/ricardo-henrique-silva.jpg",
    especialidade: "Odontologia Legal",
    instituicao: "FORP-USP",
    tag: "Legal · FORP-USP",
    objectPosition: "center 30%",
  },
  {
    nome: "Prof. Dr. Matheus Herreira Ferreira",
    foto: "/palestrantes/matheus-herreira-ferreira.jpg",
    especialidade: "Dor Orofacial",
    instituicao: "FORP-USP",
    tag: "Dor Orofacial · USP",
    objectPosition: "center 30%",
  },
  {
    nome: "Prof. Dr. Silvio Bellini",
    foto: "/palestrantes/silvio-bellini.jpg",
    especialidade: "Ortodontia",
    instituicao: "FOB-USP",
    tag: "Ortodontia · USP",
  },
];

// ─── Contato ──────────────────────────────────────────────────────────────────
export const contato = {
  email: "cobeounifafibe@gmail.com",
  telefone: null, // [LOREM — aguardando telefone oficial]
  endereco: "Centro Universitário UNIFAFIBE — Bebedouro/SP",
  maps: "https://maps.google.com/?q=Centro+Universit ário+UNIFAFIBE+Bebedouro+SP",
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

// ─── Tipo: Palestrante ────────────────────────────────────────────────────────
export type Palestrante = {
  nome: string;
  foto: string | null;
  especialidade: string;
  instituicao: string | null;
  tag: string;
  /**
   * Ponto focal da foto para o recorte circular (CSS object-position).
   * Ex: "center 30%" para descer o rosto no círculo.
   * Omitido = "center" (padrão).
   */
  objectPosition?: string;
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
