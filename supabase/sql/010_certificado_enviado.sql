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
-- filtrar os pendentes. Definição idêntica à de 001_vw_elegiveis_certificado.sql,
-- só somando a coluna i.certificado_enviado_em.
create or replace view vw_elegiveis_certificado as
with cursos_comprados as (
  select pedido_id, count(*) as total_cursos
  from pedido_cursos
  group by pedido_id
),
presencas_validas as (
  select
    i.pedido_id,
    count(distinct pr.curso_ref) as cursos_presentes
  from inscritos i
  join presencas pr on pr.inscrito_id = i.id
  join pedido_cursos pc on pc.pedido_id = i.pedido_id and pc.curso_ref = pr.curso_ref
  group by i.pedido_id
)
select
  i.id                              as inscrito_id,
  i.codigo_inscricao,
  p.id                              as pedido_id,
  p.nome,
  p.email,
  i.certificado_enviado_em,
  coalesce(cc.total_cursos, 0)      as total_cursos,
  coalesce(pv.cursos_presentes, 0)  as cursos_presentes,
  (
    p.status = 'pago'
    and coalesce(cc.total_cursos, 0) > 0
    and coalesce(pv.cursos_presentes, 0) = coalesce(cc.total_cursos, 0)
  )                                  as elegivel
from inscritos i
join pedidos p on p.id = i.pedido_id
left join cursos_comprados cc on cc.pedido_id = p.id
left join presencas_validas pv on pv.pedido_id = p.id
where p.status = 'pago';
