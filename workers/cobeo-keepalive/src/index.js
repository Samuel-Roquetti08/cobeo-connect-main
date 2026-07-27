// Worker de keepalive — evita que o Supabase free tier pause por inatividade.
// Faz um SELECT minimo (1 linha, 1 coluna) via PostgREST, usando a publishable key.
// Nao escreve dados, nao expoe nada alem do que o site publico ja expoe.
export default {
  async scheduled(event, env, ctx) {
    const url = `${env.SUPABASE_URL}/rest/v1/configuracoes_evento?select=id&limit=1`;
    try {
      const res = await fetch(url, {
        headers: {
          apikey: env.SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_PUBLISHABLE_KEY}`,
        },
      });
      console.log(`[keepalive] ${new Date().toISOString()} status=${res.status}`);
    } catch (err) {
      console.error(`[keepalive] falhou: ${err}`);
    }
  },

  // Permite disparo manual via HTTP para teste (GET /), sem expor nada sensivel na resposta.
  async fetch(request, env, ctx) {
    await this.scheduled(null, env, ctx);
    return new Response("keepalive ping enviado - confira os logs do worker");
  },
};
