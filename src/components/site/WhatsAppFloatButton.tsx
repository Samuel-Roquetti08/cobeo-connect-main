import { MessageCircle } from "lucide-react";
import { contato } from "@/data/event";

// Mesma lógica de Contato.tsx: contato.telefone é exibido em formato
// brasileiro; wa.me exige formato internacional (+55 + DDD + número, só dígitos).
function telefoneInternacional(telefone: string): string {
  return `55${telefone.replace(/\D/g, "")}`;
}

const MENSAGEM_PADRAO = "Olá, vim do site COBEO e gostaria de saber mais sobre o evento";

// Botão flutuante global (Bloco F2) — na paleta do site, não no verde padrão
// do WhatsApp, a pedido explícito do Fabiano ("não destoe" da identidade visual).
export function WhatsAppFloatButton() {
  if (!contato.telefone) return null;
  const href = `https://wa.me/${telefoneInternacional(contato.telefone)}?text=${encodeURIComponent(MENSAGEM_PADRAO)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-6 w-6" aria-hidden="true" />
    </a>
  );
}
