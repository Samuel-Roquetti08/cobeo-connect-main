import { trabalho as trabalhoConfig } from "@/data/event";

// Fonte única das seções de normas — usada tanto no accordion (step "Trabalho")
// quanto na versão aberta (step "Dados"), Bloco E do
// PLANO_COBEO_mudancas_fabiano_29jul2026.md. Não duplicar o texto.
export interface NormaSecao {
  titulo: string;
  itens: string[];
}

export function normasSecoes(): NormaSecao[] {
  return [
    { titulo: "Datas Importantes", itens: trabalhoConfig.normas.datasImportantes },
    { titulo: "Documentos Exigidos por Categoria", itens: trabalhoConfig.normas.documentosPorCategoria },
    { titulo: "Formatação do Resumo", itens: trabalhoConfig.normas.formatacaoResumo },
    { titulo: "Critérios de Avaliação", itens: trabalhoConfig.normas.avaliacao },
    { titulo: "Apresentação Oral", itens: trabalhoConfig.normas.apresentacaoOral },
    { titulo: "Apresentação em Painel", itens: trabalhoConfig.normas.apresentacaoPainel },
    { titulo: "Solicitação de Reembolso", itens: trabalhoConfig.normas.reembolso },
  ];
}

// Versão sempre-visível (sem accordion) — para aparecer de cara na aba de
// dados, não escondida atrás de um clique.
export function NormasTrabalhoAberto() {
  return (
    <div className="space-y-4 rounded-lg border border-border bg-background p-4">
      <h3 className="font-display text-sm font-bold text-foreground">Normas de Submissão de Trabalho</h3>
      {normasSecoes().map((s) => (
        <div key={s.titulo}>
          <h4 className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {s.titulo}
          </h4>
          <ul className="mt-1 list-disc space-y-1 pl-4 font-body text-sm text-muted-foreground">
            {s.itens.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}
