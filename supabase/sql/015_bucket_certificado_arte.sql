-- ============================================================================
-- 015 — Bucket privado para a arte do certificado (fundo + assinaturas)
-- ============================================================================
-- O repositório cobeo-connect-main é PÚBLICO no GitHub. As imagens de
-- assinatura digitalizada do Coordenador e do Pró-Reitor não podem ficar
-- commitadas — qualquer pessoa poderia baixá-las isoladas, em boa resolução
-- (matéria-prima para falsificação). Por isso a arte vive só aqui, num bucket
-- privado, e a Edge Function enviar-certificados baixa os 3 arquivos com a
-- service role key (bypassa RLS) a cada lote. Ver decisão em decisoes.md.
--
-- Rode este arquivo no SQL Editor do Supabase. Seguro rodar mais de uma vez.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('certificado-arte', 'certificado-arte', false)
on conflict (id) do nothing;

-- Sem policies de SELECT/INSERT para anon/authenticated: bucket privado de
-- verdade. Só a service role (usada pela Edge Function) enxerga o conteúdo.
-- Upload dos arquivos (fundo.png, assinatura-coordenador.jpg,
-- assinatura-pro-reitor.jpg) é feito uma vez, fora do banco, via API/CLI.
