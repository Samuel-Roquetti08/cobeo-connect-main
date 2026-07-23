-- ============================================================================
-- 006 — Limpeza dos dados do teste isolado do webhook (Fase 4 do plano)
-- ============================================================================
-- REVISAR COM O SAMUEL ANTES DE RODAR — apagar dado é irreversível.
-- Remove os 7 pedidos de teste (email teste+cenarioN@exemplo.com), o cupom
-- de teste TESTEWEBHOOK7, e as linhas de webhook_logs geradas pelos 9
-- disparos do teste (referência começando com "TESTE-").
-- ============================================================================

delete from pedidos where email like 'teste+%@exemplo.com';
delete from cupons where codigo = 'TESTEWEBHOOK7';
delete from webhook_logs where reference_id like 'TESTE-%';
