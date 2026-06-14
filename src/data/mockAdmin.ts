import {
  palestrasAvulsas, diasEvento,
  type IngressoId, type PalestraId, type DiaId,
  INGRESSO_LABELS,
} from "./event";

export { INGRESSO_LABELS };

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type Status = "Confirmado" | "Pendente" | "Cancelado";
export type CouponCategory = "Aluno Interno" | "Servidor Público" | "Aluno Externo" | "Público Geral";
export type TipoIngresso = IngressoId;
export type { PalestraId, DiaId };

export interface Inscrito {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  dataInscricao: string;
  // Ingresso
  tipoIngresso: TipoIngresso;
  palestraId: PalestraId | null;   // preenchido se tipoIngresso === "palestra"
  diaId: DiaId | null;             // preenchido se tipoIngresso === "dia"
  // Cupom
  cupom: string | null;
  cupomCategoria: CouponCategory | null;
  descontoLabel: string;
  // Pagamento
  status: Status;
  valorPago: number;
  // Presença
  presenca: "ausente" | "presente";
  checkInEm: string | null;
  codigoInscricao: string;
}

export interface Trabalho {
  id: string;
  titulo: string;
  responsavel: string;
  coautores: string[];
  categoria: string;
  arquivoNome: string | null;
  dataSubmissao: string;
  status: Status;
}

export interface Cupom {
  id: string;
  codigo: string;
  titular: string;
  categoria: CouponCategory;
  tipo: "fixo" | "percentual";
  valor: number;
  status: "Disponível" | "Utilizado";
  usadoPor: string | null;
  usadoEm: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const NOMES = [
  "Ana Souza","Bruno Lima","Carla Neves","Diego Martins","Eduarda Costa",
  "Felipe Ramos","Gabriela Silva","Henrique Alves","Isabela Rocha","João Mendes",
  "Karina Ferreira","Lucas Pereira","Mariana Santos","Nicolas Cardoso","Olivia Teixeira",
  "Paulo Barbosa","Quézia Andrade","Rafael Moura","Simone Gomes","Thiago Castro",
  "Ursula Pinto","Victor Leal","Wanessa Faria","Xavier Borges","Yara Cunha",
  "Zé Paulo","Amanda Reis","Bernardo Melo","Cíntia Nunes","Daniel Freitas",
];
const STATUS: Status[] = ["Confirmado","Confirmado","Confirmado","Pendente","Cancelado"];
const CATEGORIES: CouponCategory[] = ["Aluno Interno","Servidor Público","Aluno Externo","Público Geral"];
const TIPOS: TipoIngresso[] = ["palestra","palestra","dia","completo","completo","completo"];

function pick<T>(arr: readonly T[], i: number): T { return arr[i % arr.length]; }
function emailFor(s: string) { return s.toLowerCase().replace(/\s+/g,".")+".cobeo@email.com"; }
function phoneFor(i: number) { return `(1${(i%9)+1}) 9${String(i*7+1000).padStart(4,"0")}-${String(i*3+2000).padStart(4,"0")}`; }
function dateInLast30(i: number) {
  const d = new Date(2026, 5, 13);
  d.setDate(d.getDate() - (i % 30));
  return d.toISOString();
}
function genCodigo(i: number) {
  return "COBEO-" + String(i + 1).padStart(4, "0");
}

// ─── Cupons ───────────────────────────────────────────────────────────────────
export const cupons: Cupom[] = Array.from({ length: 60 }, (_, i) => {
  const utilizado = i % 3 === 0;
  const titular = pick(NOMES, i + 5);
  return {
    id: `cup-${i + 1}`,
    codigo: `COB${String(i + 1).padStart(3,"0")}`,
    titular,
    categoria: pick(CATEGORIES, i),
    tipo: i % 2 === 0 ? "percentual" : "fixo",
    valor: i % 2 === 0 ? [10,15,20,25,30][i%5] : [20,30,40,50][i%4],
    status: utilizado ? "Utilizado" : "Disponível",
    usadoPor: utilizado ? pick(NOMES, i + 10) : null,
    usadoEm: utilizado ? dateInLast30(i + 2) : null,
  };
});

// ─── Inscritos ────────────────────────────────────────────────────────────────
export const inscritos: Inscrito[] = Array.from({ length: 247 }, (_, i) => {
  const nome = pick(NOMES, i);
  const cupom = i % 4 === 0 ? cupons[i % cupons.length] : null;
  const status = pick(STATUS, i);
  const tipoIngresso = pick(TIPOS, i);
  const desconto = cupom
    ? cupom.tipo === "percentual"
      ? `${cupom.valor}%`
      : `R$ ${cupom.valor.toFixed(2).replace(".",",")}`
    : "—";

  // Palestra ou dia escolhido conforme tipo
  const palestraId: PalestraId | null =
    tipoIngresso === "palestra"
      ? palestrasAvulsas[i % palestrasAvulsas.length].id
      : null;
  const diaId: DiaId | null =
    tipoIngresso === "dia"
      ? diasEvento[i % diasEvento.length].id as DiaId
      : null;

  // Valor base por tipo
  const valorBase = tipoIngresso === "palestra" ? 80 : tipoIngresso === "dia" ? 150 : 280;
  const descontoValor = cupom
    ? cupom.tipo === "percentual"
      ? valorBase * (cupom.valor / 100)
      : cupom.valor
    : 0;

  const presenca = status === "Confirmado" && i % 5 === 0 ? "presente" : "ausente";

  return {
    id: `ins-${i + 1}`,
    nome,
    email: emailFor(nome + i),
    telefone: phoneFor(i),
    whatsapp: phoneFor(i + 1),
    dataInscricao: dateInLast30(i),
    tipoIngresso,
    palestraId,
    diaId,
    cupom: cupom?.codigo ?? null,
    cupomCategoria: cupom?.categoria ?? null,
    descontoLabel: desconto,
    status,
    valorPago: status === "Cancelado" ? 0 : Math.max(0, valorBase - descontoValor),
    presenca,
    checkInEm: presenca === "presente" ? dateInLast30(i + 1) : null,
    codigoInscricao: genCodigo(i),
  };
});

// ─── Trabalhos ────────────────────────────────────────────────────────────────
export const trabalhos: Trabalho[] = Array.from({ length: 43 }, (_, i) => {
  const responsavel = pick(NOMES, i + 3);
  const nCoaut = i % 4;
  const coautores = Array.from({ length: nCoaut }, (_, j) => pick(NOMES, i + 11 + j));
  const temArquivo = i % 5 !== 0;
  return {
    id: `tra-${i + 1}`,
    titulo: [
      "Avaliação clínica de implantes curtos em maxila atrófica",
      "Efeitos do laser de baixa potência em mucosite oral",
      "Reabilitação estética com facetas de porcelana",
      "Manejo comportamental em odontopediatria",
      "Endodontia guiada com tecnologia CBCT",
      "Periodontia regenerativa com biomateriais",
      "Cirurgia minimamente invasiva em terceiros molares",
      "Alinhadores ortodônticos: revisão sistemática",
    ][i % 8] + ` — estudo ${i + 1}`,
    responsavel,
    coautores,
    categoria: ["Pesquisa Científica","Relato de Caso","Revisão de Literatura","Painel Acadêmico"][i % 4],
    arquivoNome: temArquivo ? `trabalho_${i + 1}.pdf` : null,
    dataSubmissao: dateInLast30(i + 5),
    status: pick(STATUS, i + 2),
  };
});

// ─── Agregados para Dashboard ─────────────────────────────────────────────────
export function inscricoesPorDia(dias: number = 7) {
  return Array.from({ length: dias }, (_, i) => {
    const d = new Date(2026, 5, 13 - (dias - 1 - i));
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    return { date: label, total: Math.floor(Math.random() * 30) + 5 };
  });
}

export function distribuicaoCupons() {
  const result: Record<string, number> = {
    "Aluno Interno": 0, "Servidor Público": 0,
    "Aluno Externo": 0, "Público Geral": 0, "Sem Cupom": 0,
  };
  for (const ins of inscritos) {
    if (ins.cupomCategoria) result[ins.cupomCategoria]++;
    else result["Sem Cupom"]++;
  }
  return result;
}

export function distribuicaoIngressos() {
  const result: Record<TipoIngresso, number> = { palestra: 0, dia: 0, completo: 0 };
  for (const ins of inscritos) result[ins.tipoIngresso]++;
  return result;
}

export const COUPON_PILL: Record<CouponCategory, string> = {
  "Aluno Interno":    "bg-blue-100 text-blue-800",
  "Servidor Público": "bg-purple-100 text-purple-800",
  "Aluno Externo":    "bg-teal-100 text-teal-800",
  "Público Geral":    "bg-gray-100 text-gray-700",
};

export const COUPON_COLORS: Record<string, string> = {
  "Aluno Interno": "#731111",
  "Servidor Público": "#b5736f",
  "Aluno Externo": "#C9A84C",
  "Público Geral": "#d9d9d9",
  "Sem Cupom": "#f3f0ee",
};
