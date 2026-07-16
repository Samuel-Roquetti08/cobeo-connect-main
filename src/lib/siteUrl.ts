// Fonte única do domínio do site. O domínio institucional da UNIFAFIBE ainda não foi
// definido — nenhuma URL de retorno/e-mail deve ser hardcoded em outro lugar.
// Quando o domínio chegar, muda-se só VITE_SITE_URL (frontend) e o secret SITE_URL
// das Edge Functions — zero alteração de código.
export function getSiteUrl(): string {
  const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
