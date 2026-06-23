import { createClient } from "@supabase/supabase-js";

// Cliente público do Supabase — usa a anon key (pode ficar no frontend).
// A anon key é protegida por RLS: sozinha, ela não dá acesso a dados sensíveis.
//
// As variáveis VITE_ são públicas por definição (vão para o bundle do browser).
// NUNCA coloque a service_role key aqui — ela ignora RLS e só pode viver
// no servidor (Edge Functions / variáveis de ambiente do Cloudflare).

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas. " +
    "Configure no arquivo .env (local) e nas variáveis do Cloudflare (produção)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
