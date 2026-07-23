-- ============================================================================
-- 007 — Logs de auditoria do admin
-- ============================================================================
-- Dois admins (Fabiano e Fernanda) operam o painel. Sem isso, se um
-- inscrito/cupom/trabalho for alterado ou removido, ou o evento for
-- bloqueado/desbloqueado, não há como saber quem fez nem quando. Prioridade
-- é gravar o dado — tela de visualização fica para depois do lançamento,
-- consulta-se direto no Supabase se algo der errado.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================================

create table if not exists admin_logs (
  id            uuid primary key default gen_random_uuid(),
  admin_email   text not null,
  acao          text not null,   -- ex: 'criar_cupom', 'deletar_cupom', 'atualizar_configuracoes', 'emitir_certificados'
  entidade      text,            -- ex: 'cupom', 'config', 'certificados'
  entidade_id   text,            -- id do registro afetado, quando aplicável
  detalhes      jsonb,           -- snapshot do que mudou, opcional
  criado_em     timestamptz not null default now()
);

create index if not exists idx_admin_logs_criado_em on admin_logs(criado_em desc);

alter table admin_logs enable row level security;

-- Mesmo padrão "admin_full_*" já usado nas outras tabelas do projeto —
-- qualquer admin autenticado pode ler e inserir.
create policy "admin_full_admin_logs" on admin_logs for all to authenticated using (true) with check (true);
