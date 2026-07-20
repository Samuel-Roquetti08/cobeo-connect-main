-- ============================================================================
-- 004 — Limpeza dos check-ins de teste em `presencas`
-- ============================================================================
-- Objetivo: zerar os registros de presença acumulados durante os testes,
-- para permitir um novo ciclo de teste da tela de check-in do zero.
--
-- Estado do banco no momento em que este script foi gerado (consulta
-- somente leitura, feita por Claude Code em 19/07/2026):
--   14 pedidos (4 com status = 'pago'), 13 inscritos,
--   2 inscritos com presenca = true, 3 linhas em `presencas`.
--
-- IMPORTANTE: revise os números acima contra o que você espera antes de
-- rodar. Se algum desses 4 pedidos "pago" for uma inscrição REAL (não um
-- teste seu em sandbox), o UPDATE abaixo apaga a presença dela também —
-- nesse caso, troque para um DELETE filtrado por pedido/inscrito específico
-- em vez do TRUNCATE/UPDATE amplo.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================================

truncate table presencas;

update inscritos
  set presenca = false,
      primeiro_checkin_em = null;
