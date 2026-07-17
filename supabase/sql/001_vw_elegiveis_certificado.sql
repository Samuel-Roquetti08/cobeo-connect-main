-- ============================================================================
-- vw_elegiveis_certificado — elegibilidade de certificado
-- ============================================================================
-- Esta view já é consumida por src/lib/api/adminData.ts (getElegiveisCertificado)
-- e src/routes/admin.certificados.tsx, mas não estava versionada em
-- supabase/cobeo_schema.sql — só existe (presumivelmente) no banco ao vivo, ou
-- nunca chegou a ser criada. Este arquivo documenta/recria a view a partir da
-- regra descrita em HANDOFF_CLAUDE_CODE_COBEO.md (seção 6.1) e das colunas que
-- o código consumidor já espera: inscrito_id, codigo_inscricao, pedido_id,
-- nome, email, total_cursos, cursos_presentes, elegivel.
--
-- Regra: elegível = pedido com status = 'pago' E
--        COUNT(presenças do inscrito) = COUNT(cursos comprados do pedido).
--
-- Rode este arquivo no SQL Editor do Supabase. É seguro rodar mesmo se a view
-- já existir ao vivo com a mesma definição (create or replace).
-- ============================================================================

create or replace view vw_elegiveis_certificado as
with cursos_comprados as (
  select pedido_id, count(*) as total_cursos
  from pedido_cursos
  group by pedido_id
),
presencas_validas as (
  -- só conta presença em curso que o pedido realmente comprou — evita que uma
  -- presença registrada por engano em curso não comprado infle a contagem.
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

-- RLS: views herdam a política das tabelas base por padrão no Postgres, mas o
-- Supabase recomenda security_invoker explícito para views que cruzam tabelas
-- com RLS diferentes. Aqui todas as tabelas envolvidas (inscritos, pedidos,
-- pedido_cursos, presencas) já usam a mesma policy "admin_full_*" (authenticated
-- only) — mantendo security_invoker (padrão), a view só é acessível por quem já
-- teria acesso às tabelas base, ou seja, apenas admin autenticado.
