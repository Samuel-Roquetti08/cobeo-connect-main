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
// Normas extraídas de COBEO 2026. DADOS DOS CURSOS E PALESTRANTES (1).docx
// (conteúdo enviado pelo Samuel em 17/07 — apesar do nome do arquivo, o texto
// é sobre normas de submissão/apresentação de trabalhos, não sobre
// palestrantes). O documento era de uma edição anterior reaproveitado; a
// menção a "submissão presencial dá direito a um curso gratuito" foi
// confirmada como desatualizada e não entra aqui.
//
// formatos: valor interno mantido como "Pôster" (schema do banco tem CHECK
// constraint em trabalhos.formato — não seria seguro trocar sem migração e
// sem rodar a bateria de testes T8). O rótulo exibido ao usuário usa
// FORMATO_TRABALHO_LABELS, que troca a exibição para "Painel" sem tocar no
// valor gravado.
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
    "Todos os trabalhos apresentados recebem certificado por e-mail.",
  ],
  normas: {
    datasImportantes: [
      "Período de submissões: 20/07/2026 a 06/09/2026",
      "Divulgação dos trabalhos aprovados: 07/09/2026",
      "Apresentação de trabalhos presenciais: 07 a 09/10/2026 (18h às 19h)",
      "Apresentação de trabalhos on-line (síncrona): 08/10/2026 (9h às 11h)",
      "Premiações (menções honrosas): 09/10/2026 (noite)",
      "Publicação dos resumos nos Anais (formato digital): até 1 mês após o término do evento",
    ],
    documentosPorCategoria: [
      "Revisão Sistemática: anexar registro no PROSPERO.",
      "Pesquisa Científica (in vivo ou in vitro): estudos in vivo devem anexar comprovante de aprovação de Comitê de Ética em Pesquisa (CEP) em Seres Humanos ou em Animais.",
      "Relato de Caso Clínico ou Série de Casos: anexar o Termo de Consentimento Livre e Esclarecido (TCLE) assinado pelo(s) paciente(s). A identidade do(s) paciente(s) deve ser preservada no corpo do estudo.",
      "Revisão de Literatura: anexar termo de dispensa do comitê de ética em pesquisa.",
      "Extensão Universitária: anexar termo de dispensa do comitê de ética (caso não apresente resultados) ou a aprovação do CEP (caso apresente).",
      "A omissão desses documentos implica na desclassificação do trabalho.",
    ],
    formatacaoResumo: [
      "Template disponível no site do congresso — o resumo deve ser preenchido nele e salvo em PDF.",
      "Título: em português, negrito, máximo de 120 caracteres, refletindo o objetivo do estudo. Apenas a primeira letra maiúscula.",
      "Autores: nomes completos separados por vírgula, com o último sobrenome em maiúsculas. O primeiro autor deve ser o apresentador. Máximo de 8 autores (12 para Extensão Universitária).",
      "Afiliação: instituição do autor apresentador (nome completo, sigla, cidade, estado e país) + e-mail do apresentador (o mesmo cadastrado na inscrição).",
      "Corpo do resumo: português, fonte Arial 12, máximo de 1750 caracteres, justificado. Deve conter Introdução, Objetivo, Método (ou Conduta Clínica), Resultados e Conclusão. Sem imagens, abreviações não universais ou referências.",
      "É obrigatório informar o número do CAAE (pesquisa em humanos), CEUA (pesquisa em animais), TCLE (relato de caso) ou registro no PROSPERO (revisão sistemática) — ou declarar que não há necessidade desse documento.",
      "Descritores: indicar 3 palavras-chave, separadas por ponto e vírgula (consultar MeSH/DeCS).",
      "Indicar 1 área da odontologia e o tipo de apresentação (oral ou painel).",
      "Os dados não podem ser alterados após a submissão. Erros nos nomes dos autores ou no texto são de responsabilidade do autor — não há reemissão de certificado nem alteração posterior nos anais.",
    ],
    avaliacao: [
      "Avaliação por três avaliadores; a decisão final é irrevogável.",
      "Nota final = nota do resumo (0 a 5) + nota da apresentação (0 a 5).",
      "Critérios: estrutura do resumo, originalidade do tema, metodologia/conduta clínica, presença do CAAE/CEUA/TCLE e adequação de descritores/área.",
      "São reprovados trabalhos que não seguirem o template, não tiverem objetividade/coerência/qualidade de redação, não tiverem relevância odontológica, ou desrespeitarem direitos humanos/princípios éticos.",
    ],
    apresentacaoOral: [
      "Data, horário e sala/link são enviados por e-mail aos autores.",
      "Tempo máximo de 10 minutos, seguido de 5 minutos de arguição da banca. Sem limite de slides, desde que o tempo seja respeitado — o descumprimento pode gerar decréscimo de nota ou desclassificação.",
      "Apresentação em PowerPoint ou Canva, em português, enviada previamente à comissão organizadora por e-mail. Ainda assim, leve uma cópia em pen drive.",
    ],
    apresentacaoPainel: [
      "Data, horário e sala/link são enviados por e-mail aos autores.",
      "5 minutos para apresentação + 5 minutos para dúvidas da banca.",
      "Painel físico (presencial): 0,90 × 1,50 m (vertical), fonte mínima 18. Cabeçalho com título, autores completos (último sobrenome em maiúsculas), afiliação, foto e e-mail do apresentador — que deve ser o primeiro autor da lista. Corpo estruturado em Introdução, Objetivo, Método/Conduta Clínica, Resultados e Conclusão.",
      "Painel on-line: PowerPoint em português, usando o modelo de capa disponível no site, limite de 5 slides (1 capa + 4 de conteúdo). Descumprir o tempo pode gerar decréscimo de nota ou desclassificação.",
    ],
    reembolso: [
      "Solicitações via e-mail: cobeounifafibe@gmail.com.",
      "Reembolso de 50% até 10/09/2026. Após essa data, não há reembolso.",
      "Trabalhos não apresentados são desclassificados, não geram certificado e não são publicados nos anais — sem reembolso.",
    ],
  },
};

// Rótulo exibido ao participante — o valor gravado no banco continua sendo o
// literal do array `formatos` acima (não altere sem migrar o schema).
export const FORMATO_TRABALHO_LABELS: Record<typeof trabalho.formatos[number], string> = {
  Oral: "Oral",
  "Pôster": "Painel",
};

// ─── Palestrantes ─────────────────────────────────────────────────────────────
// Fotos/bios recebidas do Fabiano em COBEO-2026.DADOS-DOS-CURSOS-E-PALESTRANTES.docx
// (Samuel confirmou em 18/07: o arquivo colado anteriormente com o mesmo nome
// continha as normas de trabalho — T6 — não os dados de palestrantes; este
// conteúdo veio à parte, via prints do documento correto).
//
// `id` é estável (não usar índice do array — quebra se a ordem mudar) e
// alimenta o card expansível de certificações (T4).
// `certificacoes`: lista fiel ao documento, sem invenção.
export const palestrantes = [
  {
    id: "kelly-moreira",
    nome: "Profa. Dra. Kelly Moreira",
    foto: "/palestrantes/kelly-moreira.jpg",
    especialidade: "HMI / Odontopediatria",
    instituicao: "São Leopoldo Mandic",
    tag: "HMI · Mandic",
    objectPosition: "center 30%",
    certificacoes: [
      "20 anos de experiência",
      "Graduada em Odontologia pela UFMG",
      "Especialista em Estratégia em Saúde da Família pela UFMG",
      "Especialista em Odontopediatria pela SLMandic",
      "Mestre em Odontopediatria pela FOP/UNICAMP",
      "Doutora em Odontopediatria pela FOP/UNICAMP",
      "Pós-doutora no HRAC/USP",
      "Pós-graduada em Estética pela ABO",
      "Professora da Pós-Graduação na SLMANDIC — Campinas",
      "Palestrante internacional",
      "Autora de livros",
      "Diretora na IOPED e Odontopediatra na Politano Odontopediatria e Ortodontia e HM Kids",
    ],
  },
  {
    id: "marcelo-monnazzi",
    nome: "Prof. Dr. Marcelo Monnazzi",
    foto: "/palestrantes/marcelo-monnazzi.jpg",
    especialidade: "Cirurgia Buco-Maxilo-Facial / Traumatologia",
    instituicao: "FOAR-UNESP",
    tag: "CTBMF · FOAR-UNESP",
    certificacoes: [
      "Residência em CTBMF — UNESP",
      "Mestrado em CTBMF — Unimar",
      "Doutorado em Cirurgia Plástica — Unicamp",
      "Pós-doutorado em CTBMF — USP",
      "Fellowship em Dallas, Frankfurt e Munique",
      "Professor de CTBMF — UNESP Araraquara",
    ],
  },
  {
    id: "luiz-fernando-oliveira",
    nome: "Prof. Dr. Luiz Fernando de Freitas Oliveira",
    foto: "/palestrantes/luiz-fernando-oliveira.jpg",
    especialidade: "Endodontia",
    instituicao: "FOAR-UNESP",
    tag: "Endodontia · UNESP",
    certificacoes: [
      "Mestre e Especialista em Endodontia",
      "Especialista em Reabilitação Oral",
      "Especialista em Implantodontia",
      "Professor da Especialização em Endodontia — UNESP Araraquara",
    ],
  },
  {
    id: "reyna-aguilar-quispe",
    nome: "Profa. Dra. Reyna Aguilar Quispe",
    foto: "/palestrantes/reyna-aguilar-quispe.jpg",
    especialidade: "Odontologia Hospitalar / Fissura Labiopalatina",
    instituicao: "UNORTE / FUNFARME",
    tag: "Hospitalar · UNORTE",
    certificacoes: [
      "Cirurgiã-dentista pela UMSA/UNESP",
      "Especialista em Odontopediatria pelo Hospital de Anomalias Craniofaciais (HRAC-USP)",
      "Especialista em Odontologia Hospitalar",
      "Habilitada em laserterapia em Odontologia",
      "Mestre em Estomatologia e Biologia Oral — FOB-USP",
      "Doutora em Estomatologia e Imagenologia Bucomaxilofacial — FOB-USP",
      "Docente no Centro Universitário do Norte de São Paulo (UNORTE)",
      "Odontopediatra no Centro Integrado Labiopalatal (CILP) — FUNFARME, Hospital de Base de São José do Rio Preto",
    ],
  },
  {
    id: "stela-carolina-aguiar",
    nome: "Dra. Stela Carolina Vasques Baldin Aguiar",
    foto: "/palestrantes/stela-carolina-aguiar.jpg",
    especialidade: "Odontologia Hospitalar",
    instituicao: "FUNFARME / Hospital Austa",
    tag: "Hospitalar · FUNFARME",
    objectPosition: "center 30%",
    certificacoes: [
      "Mestre em Ciências Médicas",
      "Especialista em Odontologia Hospitalar pelo Hospital Israelita Albert Einstein",
      "MBA em Administração e Economia da Saúde — USP (Ribeirão Preto)",
      "Habilitação em Laserterapia pelo Hospital Israelita Albert Einstein",
      "Formação complementar em Odontologia Hospitalar — Hospital Sírio-Libanês (São Paulo)",
      "Formação complementar em Terapia Intensiva — Hospital das Clínicas (USP)",
      "Formação complementar em Dentística, Estética e Ortodontia",
      "Coordenadora Geral do Centro Integrado Labiopalatal (CILP) da FUNFARME, em São José do Rio Preto (SP)",
      "Cirurgiã-Dentista Hospitalar do Hospital Austa",
    ],
  },
  {
    id: "renan-souza",
    nome: "Prof. Me. Renan Souza",
    foto: "/palestrantes/renan-souza.jpg",
    especialidade: "Periodontia / Microcirurgia",
    instituicao: null,
    tag: "Periodontia",
    certificacoes: [
      "Graduação — UMESP",
      "Especialização em Implantodontia — Fundecto-USP",
      "Mestrado em Periodontia — UNESP",
      "Aperfeiçoamento em Cirurgia Plástica Periodontal — APCD",
      "Consultor técnico em Periodontia",
      "Professor de Fotografia Odontológica",
    ],
  },
  {
    id: "alvaro-junqueira",
    nome: "Prof. Dr. Alvaro Augusto Junqueira Júnior",
    foto: "/palestrantes/alvaro-junqueira.jpg",
    especialidade: "Dentística",
    instituicao: "FORP-USP",
    tag: "Dentística · FORP-USP",
    certificacoes: [
      "Graduado em Odontologia pela Universidade Federal de Alfenas",
      "Especialista, Mestre e Doutor em Dentística — FORP-USP",
      "Professor da Especialização em Dentística e Prótese do IOA-Ribeirão Preto",
      "Professor convidado das Especializações em Dentística da FORP-USP, ECO Academy e AORP",
      "Atua em clínica particular em Ribeirão Preto",
    ],
  },
  {
    id: "paulo-saad",
    nome: "Prof. Dr. Paulo Saad",
    foto: "/palestrantes/paulo-saad.jpg",
    especialidade: "Implantodontia",
    instituicao: null,
    tag: "Implantodontia",
    objectPosition: "center 30%",
    // Reenviado legível pelo Samuel em 18/07 (o print anterior estava cortado).
    certificacoes: [
      "Mestre e Doutor — Depto. de Ortopedia, Unifesp/Escola Paulista de Medicina",
      "Pós-doc — University of Alabama",
      "Coordenador dos cursos de Especialização em Implantodontia — FAOA e AORP",
      "Consultor Científico da Titaniumfix",
    ],
  },
  {
    id: "renato-assis-machado",
    nome: "Prof. Dr. Renato Assis Machado",
    foto: "/palestrantes/renato-assis-machado.jpg",
    especialidade: "Harmonização Orofacial",
    instituicao: "FOP-UNICAMP",
    tag: "Harmonização · UNICAMP",
    certificacoes: [
      "Graduado em Odontologia pela Universidade José do Rosário Vellano (Unifenas)",
      "Especialista em Harmonização Orofacial — IOA São Paulo",
      "Mestrado e Doutorado em Estomatopatologia — FOP/Unicamp",
      "Pós-Doutorado no HRAC/USP",
      "Professor colaborador no Departamento de Diagnóstico Oral (FOP/UNICAMP)",
      "Autor de 121 artigos",
      "Professor na Universidade São Judas Tadeu (USJT), curso de Odontologia",
      "Coordenador de Especialização em Harmonização Orofacial — IOA Piracicaba e Campinas, UNIFENAS e USJT",
      "Professor no Centro Universitário Ingá (UNIGÁ), mestrado em Harmonização Orofacial",
    ],
  },
  {
    id: "ricardo-henrique-silva",
    nome: "Prof. Dr. Ricardo Henrique Alves da Silva",
    foto: "/palestrantes/ricardo-henrique-silva.jpg",
    especialidade: "Odontologia Legal",
    instituicao: "FORP-USP",
    tag: "Legal · FORP-USP",
    objectPosition: "center 30%",
    certificacoes: [
      "Cirurgião-dentista graduado pela USP-Bauru",
      "Especialista em Odontologia Legal. Mestrado pela USP-Bauru",
      "Doutorado pela USP-São Paulo",
      "Livre-Docência pela USP-Ribeirão Preto",
      "Professor responsável pela área de Odontologia Legal na FORP-USP",
      "Vice-Coordenador do Grupo de Trabalho de Odontologia Legal da INTERPOL",
      "Vice-Presidente da IOFOS — International Organization for Forensic Odonto-Stomatology",
      "Perito Judicial em colaboração com diversas comarcas do Tribunal de Justiça do Estado de São Paulo",
    ],
  },
  {
    id: "matheus-herreira-ferreira",
    nome: "Prof. Dr. Matheus Herreira Ferreira",
    foto: "/palestrantes/matheus-herreira-ferreira.jpg",
    especialidade: "Dor Orofacial",
    instituicao: "FORP-USP",
    tag: "Dor Orofacial · USP",
    objectPosition: "center 30%",
    certificacoes: [
      "Professor Doutor da Faculdade de Odontologia de Ribeirão Preto (USP)",
      "Cirurgião-Dentista pela Universidade Estadual de Maringá",
      "Mestre e Doutor em Ciências Odontológicas — FOB-USP",
      "Especialista em Disfunção Temporomandibular e Dor Orofacial — IEO/Bauru",
    ],
  },
  {
    id: "silvio-bellini",
    nome: "Prof. Dr. Silvio Bellini",
    foto: "/palestrantes/silvio-bellini.jpg",
    especialidade: "Ortodontia",
    instituicao: "FOB-USP",
    tag: "Ortodontia · USP",
    certificacoes: [
      "Graduação — UNESP-Araçatuba",
      "Especialista em Ortodontia — APCD-Santo André",
      "Mestre e Doutor em Ortodontia — USP-Bauru",
      "Professor de Ortodontia — USP-Bauru",
    ],
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
