import { createClient } from "@supabase/supabase-js";

// Cliente público do Supabase — usa a anon key (pode ficar no frontend).
// A anon key é protegida por RLS: sozinha, ela não dá acesso a dados sensíveis.
//
// As variáveis VITE_ são públicas por definição (vão para o bundle do browser).
// NUNCA coloque a service_role key aqui — ela ignora RLS e só pode viver
// no servidor (Edge Functions / variáveis de ambiente do Cloudflare).

// Este módulo roda em escopo global: no SSR do Cloudflare, um valor inválido
// aqui derruba TODA rota com 500 antes de qualquer render. Um console.warn
// não bastaria — o createClient lança logo em seguida com "Invalid supabaseUrl",
// que não diz qual valor chegou nem de onde veio.
function exigirEnv(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `[supabase] ${nome} não definida. Defina em .env (local) ou nas Build ` +
        `variables do Cloudflare (Settings > Build).`,
    );
  }
  // As Build variables do Cloudflare têm campos Name e Value separados. Colar a
  // linha inteira do .env no Value grava "NOME=valor" como se fosse o valor.
  if (valor.startsWith(`${nome}=`)) {
    throw new Error(
      `[supabase] ${nome} veio com o próprio nome embutido no valor ` +
        `("${valor.slice(0, 40)}…"). No painel do Cloudflare, o campo Value ` +
        `deve conter só o valor, sem o prefixo "${nome}=".`,
    );
  }
  return valor;
}

const supabaseUrl = exigirEnv("VITE_SUPABASE_URL", import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = exigirEnv("VITE_SUPABASE_ANON_KEY", import.meta.env.VITE_SUPABASE_ANON_KEY);

if (!/^https?:\/\//.test(supabaseUrl)) {
  throw new Error(
    `[supabase] VITE_SUPABASE_URL não é uma URL http(s) válida: "${supabaseUrl}". ` +
      `Esperado algo como https://<projeto>.supabase.co`,
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
