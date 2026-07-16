// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// DIAGNÓSTICO TEMPORÁRIO — remover depois de confirmar a causa do 500 no Cloudflare.
console.log("[DIAGNOSTICO] cwd:", process.cwd());
const diagEnv = loadEnv("production", process.cwd(), "VITE_");
console.log("[DIAGNOSTICO] VITE_SUPABASE_URL presente:", Boolean(diagEnv.VITE_SUPABASE_URL));
console.log("[DIAGNOSTICO] VITE_SUPABASE_ANON_KEY presente:", Boolean(diagEnv.VITE_SUPABASE_ANON_KEY));
console.log("[DIAGNOSTICO] chaves encontradas:", Object.keys(diagEnv));

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
