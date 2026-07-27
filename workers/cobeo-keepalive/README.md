# cobeo-keepalive

Worker separado do site, cujo unico proposito e evitar que o Supabase free
tier pause o projeto por 7 dias de inatividade. A cada 2 dias faz um
`SELECT id FROM configuracoes_evento LIMIT 1` via PostgREST, usando a
publishable key (mesma que o site ja expoe publicamente).

## Deploy

```bash
cd workers/cobeo-keepalive
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler deploy
```

Use os mesmos valores de `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
do `.env` do site (NUNCA a secret key).

## Teste manual

Depois do deploy, disparar via HTTP para forcar um ping e conferir o log:

```bash
curl https://cobeo-keepalive.<sua-subdomain>.workers.dev/
npx wrangler tail cobeo-keepalive
```

Confirmar `status=200` no log e, no painel do Supabase, que o projeto
continua "Active" nos dias seguintes sem ninguem acessar o site manualmente.

## Se as chaves do Supabase forem rotacionadas

Repetir os dois `wrangler secret put` acima com os novos valores. Se
esquecido, o ping passa a falhar silenciosamente (log mostrara erro/401) e o
banco volta a poder pausar.
