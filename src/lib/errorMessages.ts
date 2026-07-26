// ============================================================================
// COBEO CONNECT — Tradução de erros técnicos para mensagens de usuário (T4)
// ============================================================================
// Nunca exibir mensagem crua de banco de dados (Postgres/PostgREST/Supabase)
// na tela — além de incompreensível, vaza detalhes da stack. O erro real
// sempre vai pro console (debug); o usuário vê algo compreensível e acionável.
//
// Mensagens que o próprio código lança propositalmente (ex.: "Selecione ao
// menos um curso.") já estão em português e são passadas direto — só as que
// batem em um padrão técnico conhecido, ou "parecem" técnicas, são trocadas.

const PADROES_TECNICOS: { padrao: RegExp; mensagem: string }[] = [
  {
    padrao: /row-level security policy/i,
    mensagem: "Não foi possível concluir. Verifique se você aceitou os termos e preencheu todos os campos obrigatórios.",
  },
  {
    padrao: /duplicate key value/i,
    mensagem: "Esse registro já existe. Recarregue a página e tente novamente.",
  },
  {
    padrao: /violates foreign key constraint/i,
    mensagem: "Não foi possível concluir a operação. Recarregue a página e tente novamente.",
  },
  {
    padrao: /violates (check|not-null) constraint/i,
    mensagem: "Alguns dados informados são inválidos. Revise o formulário e tente novamente.",
  },
  {
    padrao: /jwt|permission denied|invalid api key/i,
    mensagem: "Sua sessão expirou ou você não tem permissão para essa ação. Recarregue a página e tente novamente.",
  },
  {
    padrao: /failed to fetch|networkerror|fetch failed/i,
    mensagem: "Falha de conexão. Verifique sua internet e tente novamente.",
  },
];

const MENSAGEM_PADRAO = "Não foi possível concluir sua solicitação. Tente novamente em instantes.";

// Heurística pra pegar mensagens técnicas que não bateram em nenhum padrão
// específico acima (evita vazar erro cru do Postgres/PostgREST por padrão).
function pareceErroTecnico(mensagem: string): boolean {
  return /relation "|column "|constraint|policy|pgrst|postgrest|\bpg_|P0\d{3}|42P\d{2}/i.test(mensagem);
}

export function traduzirErro(e: unknown, contexto: string): string {
  const mensagem = e instanceof Error ? e.message : String(e);
  console.error(`[${contexto}]`, e);

  const padraoConhecido = PADROES_TECNICOS.find(({ padrao }) => padrao.test(mensagem));
  if (padraoConhecido) return padraoConhecido.mensagem;

  if (!mensagem || pareceErroTecnico(mensagem)) return MENSAGEM_PADRAO;

  return mensagem;
}
