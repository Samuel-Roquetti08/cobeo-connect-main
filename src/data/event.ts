export const evento = {
  data: "15 a 17 de Agosto de 2026",
  local: "Centro Universitário UNIFAFIBE — Bebedouro/SP",
  edicao: "II Edição · 2026",
};

export const stats = [
  { value: 24, suffix: "+", label: "Palestrantes Confirmados" },
  { value: 32, suffix: "h", label: "Horas de Conteúdo" },
  { value: 100, suffix: "%", label: "Certificado Digital Incluso" },
];

// ─── Programação (fonte única de verdade) ────────────────────────────────────
export const programacao = [
  {
    dia: "Dia 1 — 15/08",
    diaId: "dia1",
    itens: [
      { hora: "08:00", titulo: "Credenciamento e Welcome Coffee", speaker: "", tipo: "break" as const },
      { hora: "09:00", titulo: "Abertura Oficial do II COBEO", speaker: "Coordenação UNIFAFIBE", tipo: "break" as const },
      { hora: "09:30", titulo: "Conferência: O Futuro da Odontologia Digital", speaker: "Dra. Helena Castro" },
      { hora: "10:45", titulo: "Coffee Break", speaker: "", tipo: "break" as const },
      { hora: "11:15", titulo: "Painel: Inovações em Implantodontia", speaker: "Dr. Marcos Vinícius" },
      { hora: "12:30", titulo: "Almoço Livre", speaker: "", tipo: "break" as const },
      { hora: "14:00", titulo: "Workshop Prático — Endodontia Reciprocante", speaker: "Dra. Ana Beatriz Lima" },
      { hora: "16:30", titulo: "Mesa Redonda — Mercado Odontológico", speaker: "Convidados" },
      { hora: "18:00", titulo: "Encerramento do Dia 1", speaker: "", tipo: "break" as const },
    ],
  },
  {
    dia: "Dia 2 — 16/08",
    diaId: "dia2",
    itens: [
      { hora: "08:30", titulo: "Ortodontia Contemporânea: Alinhadores", speaker: "Dr. Rafael Monteiro" },
      { hora: "10:00", titulo: "Coffee Break", speaker: "", tipo: "break" as const },
      { hora: "10:30", titulo: "Periodontia Regenerativa", speaker: "Dra. Júlia Andrade" },
      { hora: "12:00", titulo: "Almoço Livre", speaker: "", tipo: "break" as const },
      { hora: "14:00", titulo: "Estética: Facetas e Lentes de Contato", speaker: "Dr. Eduardo Salles" },
      { hora: "16:00", titulo: "Apresentação de Trabalhos Acadêmicos", speaker: "Comissão Científica" },
      { hora: "19:30", titulo: "Jantar de Confraternização", speaker: "", tipo: "break" as const },
    ],
  },
  {
    dia: "Dia 3 — 17/08",
    diaId: "dia3",
    itens: [
      { hora: "09:00", titulo: "Odontopediatria: Manejo Comportamental", speaker: "Dra. Carolina Veloso" },
      { hora: "10:30", titulo: "Coffee Break", speaker: "", tipo: "break" as const },
      { hora: "11:00", titulo: "Prótese Total e Reabilitação Oral", speaker: "Dr. Pedro Henrique" },
      { hora: "12:30", titulo: "Almoço Livre", speaker: "", tipo: "break" as const },
      { hora: "14:00", titulo: "Premiação dos Melhores Trabalhos", speaker: "Coordenação", tipo: "break" as const },
      { hora: "15:30", titulo: "Conferência de Encerramento", speaker: "Reitor UNIFAFIBE" },
      { hora: "17:00", titulo: "Entrega de Certificados", speaker: "", tipo: "break" as const },
    ],
  },
];

// Palestras avulsas — apenas os itens que NÃO são breaks
export const palestrasAvulsas = programacao.flatMap((d) =>
  d.itens
    .filter((it) => it.tipo !== "break" && it.speaker)
    .map((it) => ({
      id: `${d.diaId}_${it.hora.replace(":", "")}`,
      titulo: it.titulo,
      speaker: it.speaker,
      hora: it.hora,
      dia: d.dia,
      diaId: d.diaId,
    }))
);

export type PalestraId = string; // id da palestrasAvulsas
export type DiaId = "dia1" | "dia2" | "dia3";

// ─── Ingressos ────────────────────────────────────────────────────────────────
export const ingressos = [
  {
    id: "palestra" as const,
    label: "Palestra Avulsa",
    descricao: "Acesso a uma palestra à sua escolha",
    valor: 80,
    badge: null as string | null,
  },
  {
    id: "dia" as const,
    label: "1 Dia do Congresso",
    descricao: "Acesso completo a um dia inteiro de programação",
    valor: 150,
    badge: null as string | null,
  },
  {
    id: "completo" as const,
    label: "3 Dias Completos",
    descricao: "Acesso a todos os dias do congresso + certificado",
    valor: 280,
    badge: "Mais popular",
  },
] as const;

export type IngressoId = typeof ingressos[number]["id"];

export const INGRESSO_LABELS: Record<IngressoId, string> = {
  palestra: "Palestra Avulsa",
  dia: "1 Dia do Congresso",
  completo: "3 Dias Completos",
};

// Dias disponíveis para ingresso de 1 dia
export const diasEvento = programacao.map((d) => ({
  id: d.diaId as DiaId,
  label: d.dia,
}));

// ─── Palestrantes ─────────────────────────────────────────────────────────────
export const palestrantes = [
  { nome: "Dra. Helena Castro",   foto: "https://i.pravatar.cc/200?img=47", especialidade: "Cirurgia Oral",      instituicao: "USP — São Paulo",      tag: "Cirurgia · USP" },
  { nome: "Dr. Marcos Vinícius",  foto: "https://i.pravatar.cc/200?img=12", especialidade: "Implantodontia",     instituicao: "UNICAMP",               tag: "Implantes · UNICAMP" },
  { nome: "Dra. Ana Beatriz Lima",foto: "https://i.pravatar.cc/200?img=44", especialidade: "Endodontia",         instituicao: "UNESP — Araraquara",     tag: "Endodontia · UNESP" },
  { nome: "Dr. Rafael Monteiro",  foto: "https://i.pravatar.cc/200?img=15", especialidade: "Ortodontia",         instituicao: "PUC-SP",                 tag: "Ortodontia · PUC" },
  { nome: "Dra. Júlia Andrade",   foto: "https://i.pravatar.cc/200?img=32", especialidade: "Periodontia",        instituicao: "UFRJ",                   tag: "Periodontia · UFRJ" },
  { nome: "Dr. Eduardo Salles",   foto: "https://i.pravatar.cc/200?img=11", especialidade: "Dentística Estética",instituicao: "UFMG",                   tag: "Estética · UFMG" },
  { nome: "Dra. Carolina Veloso", foto: "https://i.pravatar.cc/200?img=49", especialidade: "Odontopediatria",    instituicao: "UFSC",                   tag: "Pediatria · UFSC" },
  { nome: "Dr. Pedro Henrique",   foto: "https://i.pravatar.cc/200?img=8",  especialidade: "Prótese Dentária",   instituicao: "UNIFAFIBE",              tag: "Prótese · UNIFAFIBE" },
];

// ─── Contato ──────────────────────────────────────────────────────────────────
export const contato = {
  email: "cobeo@unifafibe.com.br",
  telefone: "(17) 3344-7100",
  endereco: "R. Prof. Orlando França de Carvalho, 325 — Bebedouro/SP",
};

export const precos = {
  evento: 280,
  trabalho: 90,
};
