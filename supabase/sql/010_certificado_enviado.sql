-- ============================================================================
-- 010 — Envio de certificado por participante (idempotente/retomável)
-- ============================================================================
-- Antes disto, o único registro de envio era o carimbo global
-- configuracoes_evento.certificados_enviados_em — bom para desabilitar o botão,
-- inútil para saber QUEM já recebeu. Como o envio é em massa (gera PDF + chama o
-- Resend por participante) e pode cair no meio (timeout da Edge Function), sem um
-- marcador por inscrito um reenvio duplicaria e-mail para todo mundo.
--
-- Esta coluna torna o envio idempotente e retomável: a Edge Function
-- enviar-certificados só processa quem é elegível E ainda não recebeu, e marca
-- cada um no sucesso. Reexecutar é seguro — continua de onde parou.
--
-- Rode este arquivo no SQL Editor do Supabase. Seguro rodar mais de uma vez.
-- ============================================================================

alter table inscritos
  add column if not exists certificado_enviado_em timestamptz;

-- Recria a view de elegibilidade expondo também o timestamp de envio por
-- participante, para a UI do admin mostrar quem já recebeu e a Edge Function
-- filtrar os pendentes.
--
-- ATENÇÃO — por que a definição abaixo repete a original em vez de reescrevê-la:
-- CREATE OR REPLACE VIEW no Postgres só aceita ACRESCENTAR colunas no fim; não
-- deixa renomear, remover nem reordenar as que já existem. A primeira versão
-- desta migration punha certificado_enviado_em na posição 6, no lugar de
-- status_pagamento — o Postgres abortava com "cannot change name of view column
-- status_pagamento to certificado_enviado_em" e, como o SQL Editor roda tudo em
-- uma transação, o ALTER TABLE acima era revertido junto. Era por isso que a
-- coluna nunca aparecia no banco mesmo depois de "rodar" a migration.
-- Mantemos as 9 colunas originais na ordem exata e somamos a nova como 10ª.
create or replace view vw_elegiveis_certificado as
select
  i.id                          as inscrito_id,
  i.codigo_inscricao,
  p.id                          as pedido_id,
  p.nome,
  p.email,
  p.status                      as status_pagamento,
  count(distinct pc.curso_ref)  as total_cursos,
  count(distinct pr.curso_ref)  as cursos_presentes,
  count(distinct pc.curso_ref) > 0
    and count(distinct pc.curso_ref) = count(distinct pr.curso_ref) as elegivel,
  i.certificado_enviado_em
from inscritos i
join pedidos p on p.id = i.pedido_id
join pedido_cursos pc on pc.pedido_id = p.id
left join presencas pr on pr.inscrito_id = i.id and pr.curso_ref = pc.curso_ref
where p.status = 'pago'
group by i.id, i.codigo_inscricao, p.id, p.nome, p.email, p.status, i.certificado_enviado_em;
