// Mock data for the COBEO admin dashboard.
export type Status = "Confirmado" | "Pendente" | "Cancelado";
export type CouponCategory =
  | "Aluno Interno"
  | "Servidor Público"
  | "Aluno Externo"
  | "Público Geral";

export interface Inscrito {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  whatsapp: string;
  dataInscricao: string; // ISO
  cupom: string | null;
  cupomCategoria: CouponCategory | null;
  descontoLabel: string; // "R$ 50,00" | "20%" | "—"
  status: Status;
  valorPago: number;
}

export interface Trabalho {
  id: string;
  titulo: string;
  responsavel: string;
  responsavelEmail: string;
  coautores: string[];
  categoria: string;
  arquivo: { nome: string; tipo: "PDF" | "DOC" } | null;
  dataSubmissao: string;
  statusPagamento: Status;
  resumo: string;
}

export interface Cupom {
  id: string;
  codigo: string;
  titular: string;
  categoria: CouponCategory;
  tipo: "fixo" | "percentual";
  valor: number;
  status: "Disponível" | "Utilizado";
  usadoEm: string | null;
  criadoEm: string;
}

const NOMES = [
  "Ana Beatriz Souza","Bruno Almeida","Carla Mendes","Daniel Ferreira","Eduarda Lima",
  "Felipe Rocha","Gabriela Castro","Henrique Martins","Isabela Cardoso","João Pedro Silva",
  "Karen Vasconcelos","Leonardo Pinto","Mariana Duarte","Natália Ribeiro","Otávio Camargo",
  "Patrícia Nogueira","Quésia Barbosa","Rafael Tavares","Sofia Andrade","Thiago Borges",
  "Ursula Macedo","Vinícius Prado","William Carvalho","Yara Monteiro","Zacarias Lopes",
  "Amanda Coutinho","Beatriz Faria","Caio Henrique","Débora Cunha","Eliane Fonseca",
  "Fábio Junqueira","Giovana Pacheco","Heloísa Cordeiro","Igor Magalhães","Júlia Bernardes",
  "Kaique Vidal","Larissa Bittencourt","Marcos Antunes","Nicole Bastos","Pedro Henrique Alves",
];

const CATEGORIAS_CUPOM: CouponCategory[] = [
  "Aluno Interno","Servidor Público","Aluno Externo","Público Geral",
];

const STATUS: Status[] = ["Confirmado","Confirmado","Confirmado","Pendente","Cancelado"];

const CATEGORIAS_TRAB = [
  "Pôster Científico","Artigo Original","Relato de Caso","Revisão de Literatura","Pesquisa Clínica",
];

function pick<T>(arr: T[], i: number): T { return arr[i % arr.length]; }

function dateInLast30(i: number) {
  const d = new Date();
  d.setDate(d.getDate() - (i % 30));
  d.setHours(8 + (i % 10), (i * 7) % 60, 0, 0);
  return d.toISOString();
}

function emailFor(nome: string) {
  const base = nome
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .split(" ").slice(0, 2).join(".");
  return `${base}@email.com`;
}

function phoneFor(i: number) {
  const ddd = 11 + (i % 80);
  const n = 90000000 + (i * 31337) % 9999999;
  return `(${ddd}) 9${String(n).slice(0, 4)}-${String(n).slice(4, 8)}`;
}

export const cupons: Cupom[] = Array.from({ length: 32 }, (_, i) => {
  const cat = pick(CATEGORIAS_CUPOM, i);
  const tipo: Cupom["tipo"] = i % 3 === 0 ? "percentual" : "fixo";
  const valor = tipo === "percentual" ? [10, 15, 20, 25][i % 4] : [30, 50, 80, 100][i % 4];
  const utilizado = i % 3 !== 1;
  return {
    id: `cup-${i + 1}`,
    codigo: `COBEO${String(1000 + i)}`,
    titular: pick(NOMES, i + 5),
    categoria: cat,
    tipo,
    valor,
    status: utilizado ? "Utilizado" : "Disponível",
    usadoEm: utilizado ? dateInLast30(i) : null,
    criadoEm: dateInLast30(i + 7),
  };
});

export const inscritos: Inscrito[] = Array.from({ length: 247 }, (_, i) => {
  const nome = pick(NOMES, i);
  const cupom = i % 4 === 0 ? cupons[i % cupons.length] : null;
  const status = pick(STATUS, i);
  const desconto = cupom
    ? cupom.tipo === "percentual"
      ? `${cupom.valor}%`
      : `R$ ${cupom.valor.toFixed(2).replace(".", ",")}`
    : "—";
  return {
    id: `ins-${i + 1}`,
    nome,
    email: emailFor(nome + i),
    telefone: phoneFor(i),
    whatsapp: phoneFor(i + 1),
    dataInscricao: dateInLast30(i),
    cupom: cupom?.codigo ?? null,
    cupomCategoria: cupom?.categoria ?? null,
    descontoLabel: desconto,
    status,
    valorPago: status === "Cancelado" ? 0 : 280 - (cupom ? (cupom.tipo === "percentual" ? 280 * cupom.valor / 100 : cupom.valor) : 0),
  };
});

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
    responsavelEmail: emailFor(responsavel + (i + 3)),
    coautores,
    categoria: pick(CATEGORIAS_TRAB, i),
    arquivo: temArquivo ? { nome: `trabalho-${i + 1}.pdf`, tipo: i % 2 === 0 ? "PDF" : "DOC" } : null,
    dataSubmissao: dateInLast30(i),
    statusPagamento: pick(STATUS, i + 1),
    resumo: "Estudo conduzido com metodologia rigorosa, envolvendo análise quantitativa e qualitativa dos resultados obtidos ao longo de 18 meses de observação clínica.",
  };
});

// Inscrições por dia (últimos 7 dias)
export const inscricoesPorDia = (() => {
  const dias: { dia: string; total: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    const total = inscritos.filter((x) => {
      const xd = new Date(x.dataInscricao);
      return xd.toDateString() === d.toDateString();
    }).length || (10 + ((i * 13) % 25));
    dias.push({ dia: label, total });
  }
  return dias;
})();

export const distribuicaoCupons = (() => {
  const counts: Record<string, number> = {
    "Aluno Interno": 0,
    "Servidor Público": 0,
    "Aluno Externo": 0,
    "Público Geral": 0,
    "Sem Cupom": 0,
  };
  inscritos.forEach((i) => {
    if (i.cupomCategoria) counts[i.cupomCategoria]++;
    else counts["Sem Cupom"]++;
  });
  return counts;
})();

export const COUPON_COLORS: Record<string, string> = {
  "Aluno Interno": "#731111",
  "Servidor Público": "#b5736f",
  "Aluno Externo": "#C9A84C",
  "Público Geral": "#d9d9d9",
  "Sem Cupom": "#f3f0ee",
};

export const COUPON_PILL: Record<CouponCategory, string> = {
  "Aluno Interno": "bg-blue-100 text-blue-800",
  "Servidor Público": "bg-purple-100 text-purple-800",
  "Aluno Externo": "bg-teal-100 text-teal-800",
  "Público Geral": "bg-gray-200 text-gray-700",
};
