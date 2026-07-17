-- ============================================================================
-- T5 — Check-in do jantar de encerramento
-- ============================================================================
-- Regra de COMPRA do jantar não muda: quem comprou 3+ cursos pode comprar.
-- Regra de ENTRADA (nova): na porta, verifica-se se o participante compareceu
-- efetivamente a TODOS os cursos que comprou — via os check-ins já registrados
-- em `presencas`. Comprar não basta; tem que ter ido.
--
-- Rode este arquivo no SQL Editor do Supabase, depois de 001_vw_elegiveis_certificado.sql.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Passo 1 — Registro do check-in do jantar
-- ----------------------------------------------------------------------------
-- Opção A (coluna em `inscritos`), não opção B (linha em `presencas` com curso
-- fantasma). Razão: o jantar não é um curso. Modelá-lo como se fosse exigiria
-- um curso_ref especial tratado como caso particular em todo lugar que já
-- consulta `presencas` — incluindo a própria elegibilidade de certificado
-- (vw_elegiveis_certificado, criada em 001) — arriscando inflar
-- indevidamente `total_cursos`/`cursos_presentes` de quem foi ao jantar. Uma
-- coluna dedicada é honesta sobre o que é e não contamina outra lógica.
alter table inscritos add column if not exists jantar_check_in_em        timestamptz;
alter table inscritos add column if not exists jantar_check_in_por       text;
-- Override: decisão confirmada com o Samuel em 16/07 — a pessoa na porta pode
-- autorizar manualmente um caso que a regra não previu (passou mal, curso
-- atrasou, erro de check-in do próprio sistema). Sem isso, a única saída no
-- calor do momento seria deixar entrar sem registro nenhum, o que destrói o
-- dado. Com override, o caso fica auditável (quem autorizou e por quê).
alter table inscritos add column if not exists jantar_check_in_override  boolean not null default false;
alter table inscritos add column if not exists jantar_check_in_motivo    text;

-- ----------------------------------------------------------------------------
-- Passo 2 — View de elegibilidade do jantar
-- ----------------------------------------------------------------------------
-- Reaproveita a mesma estrutura de vw_elegiveis_certificado (001) — comparar
-- cursos comprados vs. presenças registradas — mas soma o que o certificado
-- não precisa e o jantar precisa: a LISTA de cursos que faltaram (o motivo
-- específico que a pessoa na porta vai ter que explicar) e a opção de bebida.
create or replace view vw_elegiveis_jantar as
with cursos_comprados as (
  select pedido_id, curso_ref, curso_titulo
  from pedido_cursos
),
presentes as (
  select i.pedido_id, pr.curso_ref
  from inscritos i
  join presencas pr on pr.inscrito_id = i.id
),
faltantes_por_pedido as (
  select
    cc.pedido_id,
    array_agg(cc.curso_titulo order by cc.curso_titulo) as titulos_faltantes,
    count(*) as qtd_faltantes
  from cursos_comprados cc
  left join presentes p on p.pedido_id = cc.pedido_id and p.curso_ref = cc.curso_ref
  where p.curso_ref is null
  group by cc.pedido_id
),
totais_por_pedido as (
  select pedido_id, count(*) as total_cursos
  from cursos_comprados
  group by pedido_id
)
select
  i.id                                                              as inscrito_id,
  i.codigo_inscricao,
  p.id                                                               as pedido_id,
  p.nome,
  p.email,
  (p.jantar_opcao is not null)                                       as comprou_jantar,
  p.jantar_opcao                                                     as opcao_jantar,
  coalesce(t.total_cursos, 0)                                        as cursos_comprados,
  coalesce(t.total_cursos, 0) - coalesce(f.qtd_faltantes, 0)         as cursos_presentes,
  coalesce(f.titulos_faltantes, '{}')                                as cursos_faltantes,
  (
    p.status = 'pago'
    and p.jantar_opcao is not null
    and coalesce(t.total_cursos, 0) > 0
    and coalesce(f.qtd_faltantes, 0) = 0
  )                                                                    as elegivel_jantar,
  i.jantar_check_in_em,
  i.jantar_check_in_por,
  i.jantar_check_in_override,
  i.jantar_check_in_motivo
from inscritos i
join pedidos p on p.id = i.pedido_id
left join totais_por_pedido t on t.pedido_id = p.id
left join faltantes_por_pedido f on f.pedido_id = p.id
where p.status = 'pago';

-- security_invoker (padrão do Postgres para views) — todas as tabelas
-- envolvidas usam a mesma policy "admin_full_*" (authenticated only), então a
-- view só é acessível por quem já teria acesso às tabelas base: admin
-- autenticado. O service_role das Edge Functions ignora RLS normalmente.

-- ----------------------------------------------------------------------------
-- Nota de uso (registro do check-in em si)
-- ----------------------------------------------------------------------------
-- Não há função/RPC dedicada aqui — por consistência com o padrão já usado em
-- registrarPresenca() (src/lib/api/adminData.ts), o check-in do jantar é
-- gravado com um UPDATE direto do client autenticado:
--
--   update inscritos
--     set jantar_check_in_em = now(),
--         jantar_check_in_por = <email do admin>,
--         jantar_check_in_override = <true|false>,
--         jantar_check_in_motivo = <texto ou null>
--     where id = <inscrito_id>
--       and jantar_check_in_em is null   -- idempotência: 2º clique não sobrescreve
--
-- O `and jantar_check_in_em is null` garante que um clique duplo (ou dois
-- fiscais simultâneos) não reescreve um check-in já registrado — o UPDATE
-- simplesmente não afeta nenhuma linha na segunda vez, sem precisar de uma
-- function SQL própria só para isso.
