-- ============================================================================
-- 011 — Permitir upload de trabalho também com sessão de admin ativa
-- ============================================================================
-- RODAR NO SQL EDITOR DO SUPABASE.
--
-- Bug encontrado ao testar T5: o bucket `trabalhos-pdfs` só tinha policy de
-- INSERT pra role `anon`. Se o navegador tem uma sessão de admin ativa (login
-- em /admin na mesma aba), o Supabase usa essa sessão (`authenticated`) pra
-- TODAS as chamadas, inclusive no formulário público — e como não existia
-- policy de upload pra `authenticated` nesse bucket, o upload era recusado
-- pela RLS antes de qualquer pedido ser criado.
--
-- `admins` já tem `admin_full_*` (ALL) em todas as tabelas normais — este
-- script só estende o mesmo princípio pro Storage, que é um schema separado
-- (`storage.objects`) com suas próprias policies.
-- ============================================================================

create policy "authenticated_upload_trabalhos_pdfs"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'trabalhos-pdfs');
