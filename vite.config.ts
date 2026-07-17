// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// As Build variables do painel do Cloudflare chegam via process.env, e no Vite
// process.env tem precedência sobre .env.production — um valor errado no painel
// vence o arquivo commitado e só se manifesta como 500 em runtime, com o build
// verde. Validar aqui transforma isso num build vermelho, que é onde dá para ver.
const env = loadEnv("production", process.cwd(), "VITE_");

const problemas = Object.entries(env).flatMap(([nome, valor]) => {
  // Os campos Name e Value do painel são separados; colar a linha inteira do
  // .env no Value grava "NOME=valor" como se fosse o valor.
  if (valor.startsWith(`${nome}=`)) {
    return [`${nome}: valor embute o próprio nome ("${valor.slice(0, 40)}…") — o campo Value leva só o valor`];
  }
  if (nome.endsWith("_URL") && !/^https?:\/\//.test(valor)) {
    return [`${nome}: não é uma URL http(s) válida ("${valor.slice(0, 40)}…")`];
  }
  return [];
});

for (const nome of ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_MP_PUBLIC_KEY"]) {
  if (!env[nome]) problemas.push(`${nome}: ausente`);
}

if (problemas.length > 0) {
  throw new Error(
    `Variáveis VITE_* inválidas — o bundle sairia quebrado e a página daria 500:\n` +
      problemas.map((p) => `  - ${p}`).join("\n") +
      `\nCorrija em Cloudflare > Workers > Settings > Build > Variables and secrets, ` +
      `ou remova-as de lá para que .env.production valha.`,
  );
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
