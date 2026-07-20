-- ============================================================================
-- 003 — Garante a constraint UNIQUE (inscrito_id, curso_ref) em `presencas`
-- ============================================================================
-- `supabase/cobeo_schema.sql` já declara essa constraint inline na criação da
-- tabela (`unique (inscrito_id, curso_ref)`), mas isso só é aplicado quando a
-- tabela é criada do zero — um `create table if not exists` não altera uma
-- tabela já existente no banco ao vivo. Este script confere se a constraint
-- já existe (por qualquer nome, comparando o conjunto de colunas) e só cria
-- se estiver faltando — seguro rodar quantas vezes for preciso.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================================

do $$
declare
  v_exists boolean;
begin
  select exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    where t.relname = 'presencas'
      and c.contype = 'u'
      and (
        select array_agg(a.attname::text order by a.attname)
        from unnest(c.conkey) as k(attnum)
        join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
      ) = array['curso_ref', 'inscrito_id']::text[]
  ) into v_exists;

  if not v_exists then
    alter table presencas
      add constraint presencas_inscrito_curso_unique unique (inscrito_id, curso_ref);
  end if;
end $$;
