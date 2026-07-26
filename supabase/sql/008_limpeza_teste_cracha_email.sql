-- ============================================================================
-- 008 — Limpeza do teste do crachá no e-mail (pedido de teste TESTE-CRACHA-1)
-- ============================================================================
-- REVISAR COM O SAMUEL ANTES DE RODAR.
-- Remove o pedido de teste criado pra validar o crachá no e-mail de
-- confirmação (delete em pedidos cascateia pra inscritos e pedido_cursos).
-- ============================================================================

delete from pedidos where mp_reference_id = 'TESTE-CRACHA-1';
