-- ============================================================================
-- 010 — Múltiplos arquivos por trabalho (Doc 1, T5)
-- ============================================================================
-- RODAR NO SQL EDITOR DO SUPABASE (não é executado automaticamente).
--
-- Hoje `trabalhos` guarda um único arquivo (arquivo_path/arquivo_nome/
-- arquivo_tipo). Esta tabela segue o mesmo padrão já usado em `coautores`
-- (N registros filhos por trabalho, FK trabalho_id) — decisão confirmada
-- com o Samuel em vez de um array/jsonb numa coluna só.
--
-- As colunas antigas em `trabalhos` (arquivo_path/arquivo_nome/arquivo_tipo)
-- NÃO são removidas aqui — ficam intactas pra não quebrar trabalhos já
-- submetidos antes desta mudança. O código novo (src/lib/api/pedidos.ts)
-- passa a gravar só em `trabalho_arquivos`; os registros antigos continuam
-- lendo pelo jeito antigo (fallback já tratado no código do admin).
-- ============================================================================

create table if not exists trabalho_arquivos (
  id            uuid primary key default uuid_generate_v4(),
  trabalho_id   uuid not null references trabalhos(id) on delete cascade,
  arquivo_path  text not null,                  -- caminho no Supabase Storage (bucket trabalhos-pdfs)
  arquivo_nome  text not null,
  arquivo_tipo  text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_trabalho_arquivos_trabalho on trabalho_arquivos(trabalho_id);

alter table trabalho_arquivos enable row level security;

create policy "admin_full_trabalho_arquivos"   on trabalho_arquivos for all    to authenticated using (true) with check (true);
create policy "public_insert_trabalho_arquivos" on trabalho_arquivos for insert to anon          with check (true);
