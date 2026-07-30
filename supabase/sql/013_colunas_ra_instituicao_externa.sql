-- ============================================================================
-- 013 — Colunas RA e instituição externa em `inscritos` (Bloco C do
-- PLANO_COBEO_mudancas_fabiano_29jul2026.md)
-- ============================================================================
-- Coleta simples, sem validação: RA para aluno UNIFAFIBE; RA + instituição
-- de ensino para aluno externo. Nullable — não quebra registros existentes
-- nem o valor_total (não entra em nenhum cálculo).
-- ============================================================================

alter table inscritos add column if not exists ra text;
alter table inscritos add column if not exists instituicao_externa text;

-- Recriar a view incluindo as duas colunas novas (senão não aparecem na
-- exportação do admin). Definição igual à de supabase/cobeo_schema.sql, só
-- com i.ra e i.instituicao_externa adicionados.
create or replace view vw_inscricoes_completas as
select
  p.id              as pedido_id,
  p.nome,
  p.email,
  p.telefone,
  p.whatsapp,
  p.categoria,
  p.status          as status_pagamento,
  p.valor_total,
  p.valor_cursos,
  p.valor_jantar,
  p.valor_trabalho,
  p.desconto_cupom,
  p.jantar_opcao,
  p.metodo_pagamento,
  p.pago_em,
  p.created_at,
  i.id              as inscrito_id,
  i.codigo_inscricao,
  i.presenca,
  i.primeiro_checkin_em,
  t.id              as trabalho_id,
  t.titulo          as trabalho_titulo,
  t.categoria       as trabalho_categoria,
  t.modalidade      as trabalho_modalidade,
  t.formato         as trabalho_formato,
  t.arquivo_path,
  c.codigo          as cupom_codigo,
  i.ra,
  i.instituicao_externa
from pedidos p
left join inscritos i on i.pedido_id = p.id
left join trabalhos t on t.pedido_id = p.id
left join cupons   c on c.id = p.cupom_id;
