-- ============================================================================
-- 014 — Reenvio de crachá por participante (idempotente/retomável)
-- ============================================================================
-- Reenvio de crachás é diferente de certificados: não é "concluído para
-- sempre", mas repetível (ex: na véspera do evento). Por isso não há carimbo
-- global em configuracoes_evento — cada inscrito tem só o seu timestamp de
-- reenvio (null = ainda não recebeu).
--
-- Rode este arquivo no SQL Editor do Supabase. Seguro rodar mais de uma vez.
-- ============================================================================

alter table inscritos
  add column if not exists cracha_reenviado_em timestamptz;

-- View de elegibilidade para reenvio: inscritos com pedido pago e inscrição.
-- Estrutura idêntica à de certificado (pedido + inscrito), mas sem a presença:
-- basta ter pago pra ter direito ao crachá.
create or replace view vw_crachas_reenvio as
select
  i.id                              as inscrito_id,
  i.codigo_inscricao,
  p.id                              as pedido_id,
  p.nome,
  p.email,
  p.jantar_opcao,
  i.cracha_reenviado_em
from inscritos i
join pedidos p on p.id = i.pedido_id
where p.status = 'pago' and p.tem_inscricao = true;
