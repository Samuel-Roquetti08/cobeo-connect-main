// ============================================================================
// COBEO CONNECT — Guarda de admin para Edge Functions
// ============================================================================
// O `verify_jwt` do gateway do Supabase só garante que a requisição traz uma
// credencial válida DO PROJETO — e a chave publicável fica embutida no bundle
// do site, à vista de qualquer visitante. Para ação de admin isso não basta:
// sem esta guarda, qualquer um que leia o código-fonte do site consegue
// disparar envio de e-mail em massa.
//
// Aqui exigimos uma sessão de usuário autenticado de verdade — a mesma que o
// painel /admin já usa (o `functions.invoke` do supabase-js manda o
// access_token da sessão no Authorization quando há login).
//
// Uso, no começo do handler:
//   const negado = await exigirAdmin(supabase, req);
//   if (negado) return negado;

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { jsonResponse } from "./cors.ts";

export async function exigirAdmin(supabase: SupabaseClient, req: Request): Promise<Response | null> {
  const header = req.headers.get("Authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  // getUser(token) valida assinatura e validade no servidor de auth. Chave
  // publicável (sb_publishable_...) e JWT de papel anônimo não são sessão de
  // usuário — os dois caem aqui como inválidos.
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) {
    console.warn("[authAdmin] chamada recusada: token não é de usuário autenticado");
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  return null;
}
