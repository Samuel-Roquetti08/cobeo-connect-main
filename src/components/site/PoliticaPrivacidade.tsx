import { contato } from "@/data/event";

// Bloco K do plano — fonte única do texto da Política de Privacidade,
// usada tanto no modal (checkbox de consentimento na inscrição) quanto na
// página /politica-de-privacidade (link do rodapé).
export function PoliticaPrivacidadeConteudo() {
  return (
    <div className="space-y-4 font-body text-sm text-muted-foreground">
      <div>
        <h4 className="font-display text-sm font-bold text-foreground">Dados coletados</h4>
        <p className="mt-1">
          Nome, e-mail, telefone e WhatsApp; quando aplicável, RA e instituição de ensino
          (aluno UNIFAFIBE/externo); dados da submissão de trabalho acadêmico (título, resumo,
          coautores e o arquivo PDF/DOC/PPT). O pagamento é processado e tokenizado diretamente
          pelo Mercado Pago — os dados do cartão não trafegam nem ficam armazenados nos nossos
          servidores.
        </p>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold text-foreground">Finalidade</h4>
        <p className="mt-1">
          Gestão de inscrições e submissões, processamento do pagamento, emissão de crachá e
          certificado, e comunicação sobre o evento (confirmações, alterações, informações
          logísticas).
        </p>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold text-foreground">Base legal</h4>
        <p className="mt-1">
          Consentimento do titular (art. 7º, I, LGPD) e execução de contrato/procedimentos
          preliminares relacionados à sua inscrição (art. 7º, V, LGPD).
        </p>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold text-foreground">Compartilhamento com operadores</h4>
        <p className="mt-1">
          <strong className="text-foreground">Mercado Pago</strong> processa o pagamento;{" "}
          <strong className="text-foreground">Supabase</strong> hospeda o banco de dados e o
          armazenamento dos arquivos de trabalhos submetidos;{" "}
          <strong className="text-foreground">Resend</strong> envia os e-mails transacionais
          (confirmação de inscrição, crachá, status de pagamento). Nenhum outro terceiro recebe
          seus dados.
        </p>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold text-foreground">Retenção</h4>
        <p className="mt-1">
          Os dados são mantidos pelo período necessário à realização do evento, emissão de
          certificados e cumprimento de obrigações fiscais/contábeis.
        </p>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold text-foreground">Direitos do titular</h4>
        <p className="mt-1">
          Nos termos da LGPD, você pode solicitar acesso, correção, exclusão, portabilidade dos
          seus dados, e revogar o consentimento a qualquer momento, entrando em contato pelo
          e-mail abaixo.
        </p>
      </div>

      <div>
        <h4 className="font-display text-sm font-bold text-foreground">Controlador e contato</h4>
        <p className="mt-1">
          Comissão Organizadora do II COBEO. Contato:{" "}
          <a href={`mailto:${contato.email}`} className="font-semibold text-primary underline hover:no-underline">
            {contato.email}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
