import { createFileRoute } from "@tanstack/react-router";
import { StatusPedidoPage } from "@/components/site/StatusPedidoPage";

export const Route = createFileRoute("/inscricao/falha")({
  head: () => ({ meta: [{ title: "Pagamento — II COBEO" }] }),
  component: StatusPedidoPage,
});
