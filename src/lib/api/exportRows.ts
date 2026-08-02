// ============================================================================
// COBEO CONNECT — Linhas de exportação (.xlsx) do admin
// ============================================================================
// Mapeamento único de cada tipo de dado pra uma linha de planilha, usado
// tanto por admin.inscritos.tsx (exportação rápida já filtrada na tela)
// quanto por admin.exportar.tsx (exportação em massa) — pra não ter duas
// versões divergentes do mesmo relatório.

import type { Inscrito, Trabalho, Cupom } from "./adminTypes";
import { CATEGORIA_LABELS, JANTAR_LABELS, STATUS_LABELS, CUPOM_CATEGORIA_LABELS, CUPOM_STATUS_LABELS } from "./adminTypes";

export function inscritoParaLinha(r: Inscrito) {
  return {
    "Código": r.codigoInscricao ?? "—",
    "Nome": r.nome,
    "E-mail": r.email,
    "Telefone": r.telefone,
    "WhatsApp": r.whatsapp,
    "Categoria": r.categoria ? CATEGORIA_LABELS[r.categoria] : "—",
    "RA": r.ra ?? "—",
    "Instituição Externa": r.instituicaoExterna ?? "—",
    "Cursos": r.cursos.map((c) => c.curso_titulo).join(" | "),
    "Qtd. Cursos": r.cursos.length,
    "Jantar": r.jantarOpcao ? JANTAR_LABELS[r.jantarOpcao] : "—",
    "Cupom": r.cupomCodigo ?? "—",
    "Desconto": r.descontoCupom,
    "Valor Total": r.valorTotal,
    "Status": STATUS_LABELS[r.status],
    "Pagamento": r.metodoPagamento ?? "—",
    "Data": new Date(r.createdAt).toLocaleString("pt-BR"),
    "Presença (cursos)": `${r.cursosConfirmados.length}/${r.cursos.length}`,
  };
}

export function trabalhoParaLinha(t: Trabalho) {
  return {
    "Título": t.titulo,
    "Responsável": t.responsavel,
    "E-mail": t.responsavelEmail,
    "Categoria": t.categoria,
    "Modalidade": t.modalidade,
    "Formato": t.formato,
    "Coautores": t.coautores.join(" | "),
    "Qtd. Arquivos": t.arquivos.length,
    "Status Pagamento": STATUS_LABELS[t.status],
    "Data": new Date(t.createdAt).toLocaleString("pt-BR"),
    "Resumo": t.resumo,
  };
}

export function cupomParaLinha(c: Cupom) {
  return {
    "Código": c.codigo,
    "Titular": c.titular,
    "Categoria": CUPOM_CATEGORIA_LABELS[c.categoria],
    "Tipo": c.tipo === "percentual" ? "Percentual" : "Fixo",
    "Valor": c.valor,
    "Status": CUPOM_STATUS_LABELS[c.status],
    "Usado em": c.usadoEm ? new Date(c.usadoEm).toLocaleString("pt-BR") : "—",
    "Data de criação": new Date(c.createdAt).toLocaleString("pt-BR"),
  };
}
