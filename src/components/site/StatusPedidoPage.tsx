// Página de retorno do Mercado Pago (sucesso/pendente/falha). É só informativa:
// nunca confia na URL — sempre lê o status real do pedido no banco. Mesmo na
// rota "/sucesso", se o banco disser que o pedido ainda está pendente (ex.:
// PIX ainda não compensou, webhook ainda não chegou), é isso que é exibido.
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, Clock, X, Loader2, AlertCircle } from "lucide-react";
import { consultarStatusPedido, type StatusPedido } from "@/lib/api/pedidos";

function getRefFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("ref");
}

export function StatusPedidoPage() {
  const ref = getRefFromUrl();
  const [resultado, setResultado] = useState<StatusPedido | "loading" | "erro">("loading");
  const tentativas = useRef(0);

  useEffect(() => {
    if (!ref) {
      setResultado("erro");
      return;
    }

    let cancelado = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function consultar() {
      try {
        const status = await consultarStatusPedido(ref!);
        if (cancelado) return;
        setResultado(status);
        // Enquanto o webhook ainda não confirmou (pedido pendente), tenta de
        // novo algumas vezes — o pagamento pode ter acabado de ser aprovado.
        tentativas.current += 1;
        if (status.encontrado && status.status === "pendente" && tentativas.current < 6) {
          timeoutId = setTimeout(consultar, 4000);
        }
      } catch {
        if (!cancelado) setResultado("erro");
      }
    }
    consultar();

    return () => {
      cancelado = true;
      clearTimeout(timeoutId);
    };
  }, [ref]);

  if (resultado === "loading") {
    return (
      <CentroPagina>
        <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden="true" />
        <p className="mt-4 font-body text-sm text-muted-foreground">Consultando o status do seu pedido...</p>
      </CentroPagina>
    );
  }

  if (resultado === "erro" || !resultado.encontrado) {
    return (
      <CentroPagina>
        <AlertCircle className="h-14 w-14 text-muted-foreground" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Pedido não encontrado</h1>
        <p className="mt-2 max-w-md font-body text-sm text-muted-foreground">
          Não conseguimos localizar esse pedido. Se você concluiu um pagamento, entre em contato pelo
          e-mail cobeounifafibe@gmail.com com o comprovante.
        </p>
        <VoltarLink />
      </CentroPagina>
    );
  }

  if (resultado.status === "pago") {
    return (
      <CentroPagina>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold" aria-hidden="true">
          <Check className="h-9 w-9 text-primary" strokeWidth={3} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Pagamento confirmado!</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Um e-mail de confirmação foi enviado com todos os detalhes.
        </p>
        {resultado.codigoInscricao && (
          <div className="mx-auto mt-6 max-w-sm rounded-xl border border-border bg-background p-5">
            <p className="font-body text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código de inscrição</p>
            <p className="mt-1 font-mono text-lg font-bold text-primary">{resultado.codigoInscricao}</p>
            <p className="mt-2 font-body text-[11px] text-muted-foreground">Guarde este código — necessário para o check-in.</p>
          </div>
        )}
        {typeof resultado.valorTotal === "number" && (
          <p className="mt-4 font-body text-sm text-muted-foreground">
            Valor pago: <strong className="text-foreground">R$ {resultado.valorTotal.toFixed(2).replace(".", ",")}</strong>
          </p>
        )}
        <VoltarLink />
      </CentroPagina>
    );
  }

  if (resultado.status === "pendente") {
    return (
      <CentroPagina>
        <Clock className="h-14 w-14 text-gold" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Pagamento em processamento</h1>
        <p className="mt-2 max-w-md font-body text-sm text-muted-foreground">
          Se você pagou via PIX ou boleto, a confirmação pode levar alguns minutos. Você receberá um
          e-mail assim que o pagamento for aprovado — não é necessário fazer nada.
        </p>
        <VoltarLink />
      </CentroPagina>
    );
  }

  return (
    <CentroPagina>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10" aria-hidden="true">
        <X className="h-9 w-9 text-destructive" strokeWidth={3} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Pagamento não aprovado</h1>
      <p className="mt-2 max-w-md font-body text-sm text-muted-foreground">
        O pagamento não foi concluído. Seu pedido continua reservado — você pode tentar novamente
        a partir do formulário de inscrição.
      </p>
      <VoltarLink />
    </CentroPagina>
  );
}

function CentroPagina({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center" role="status" aria-live="polite">
      {children}
    </div>
  );
}

function VoltarLink() {
  return (
    <Link
      to="/"
      className="mt-8 inline-block rounded-md border border-border px-6 py-3 font-body text-sm font-semibold text-foreground transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      Voltar ao Início
    </Link>
  );
}
