-- ============================================================================
-- 012 — Reset de dados transacionais de teste para produção (Fase 2 do
-- PLANO_COBEO_golive_producao.md)
-- ============================================================================
-- ⚠️ REVISAR COM O SAMUEL ANTES DE RODAR — IRREVERSÍVEL.
-- Só rodar depois de: Fase 0 (backup exportado) + Fase 1 (credenciais de
-- produção trocadas) concluídas.
--
-- Ordem respeita as foreign keys (filhos antes dos pais). NÃO inclui
-- cupons, admins nem configuracoes_evento — esses são preservados
-- (ver Fase 2.3 do plano; decisão sobre cupons de teste é do Samuel).
-- ============================================================================

-- 0) Conferência ANTES do reset — rodar e anotar os números
select 'pedidos' as tabela, count(*) from pedidos
union all select 'inscritos', count(*) from inscritos
union all select 'pedido_cursos', count(*) from pedido_cursos
union all select 'presencas', count(*) from presencas
union all select 'trabalhos', count(*) from trabalhos
union all select 'coautores', count(*) from coautores
union all select 'trabalho_arquivos', count(*) from trabalho_arquivos
union all select 'webhook_logs', count(*) from webhook_logs;

-- 1) Presenças e check-ins
truncate table presencas cascade;

-- 2) Arquivos e coautores de trabalhos
truncate table trabalho_arquivos cascade;
truncate table coautores cascade;

-- 3) Trabalhos
truncate table trabalhos cascade;

-- 4) Cursos comprados por pedido
truncate table pedido_cursos cascade;

-- 5) Inscritos
truncate table inscritos cascade;

-- 6) Logs de webhook
truncate table webhook_logs cascade;

-- 7) Pedidos (por último — é o hub)
truncate table pedidos cascade;

-- 8) Conferência DEPOIS do reset — todas devem estar zeradas
select 'pedidos' as tabela, count(*) from pedidos
union all select 'inscritos', count(*) from inscritos
union all select 'pedido_cursos', count(*) from pedido_cursos
union all select 'presencas', count(*) from presencas
union all select 'trabalhos', count(*) from trabalhos
union all select 'coautores', count(*) from coautores
union all select 'trabalho_arquivos', count(*) from trabalho_arquivos
union all select 'webhook_logs', count(*) from webhook_logs;

-- Não esquecer (fora deste script, manual):
--   - cupons: NÃO truncar — decisão do Samuel sobre cupons de teste vs reais
--   - admins: NÃO tocar — Fabiano e Fernanda precisam continuar logando
--   - configuracoes_evento: NÃO tocar aqui — ver Fase 2.4 do plano
--   - Storage (bucket trabalhos-pdfs): apagar PDFs de teste manualmente, se houver
