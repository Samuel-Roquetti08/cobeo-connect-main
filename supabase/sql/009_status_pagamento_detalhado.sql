-- ============================================================================
-- 009 — Status de pagamento detalhado na página de retorno (Doc 1, T2)
-- ============================================================================
-- RODAR NO SQL EDITOR DO SUPABASE (não é executado automaticamente).
--
-- Contexto: `pedidos.status` só distingue 'pendente' / 'pago' / etc — um
-- pagamento recusado pelo Mercado Pago mantém o pedido como 'pendente' (isso
-- é proposital, ver webhook-mercadopago/index.ts, não muda aqui). Para a
-- página de retorno conseguir mostrar "recusado" separado de "aguardando
-- confirmação", esta função passa a olhar também o último registro em
-- `webhook_logs` (já existente, só leitura) e classificar o status bruto do
-- MP na mesma categoria usada nos e-mails de status
-- (supabase/functions/_shared/emailStatusPagamento.ts — manter as duas em
-- sincronia se a classificação mudar).
--
-- Não altera nenhuma tabela, nem RLS, nem a lógica de quando um pedido vira
-- 'pago'. Apenas substitui (CREATE OR REPLACE) a função consultar_status_pedido
-- para incluir mais um campo no retorno.
-- ============================================================================

create or replace function consultar_status_pedido(p_mp_reference_id text)
returns json as $$
declare
  v_pedido pedidos%rowtype;
  v_codigo text;
  v_ultimo_payload jsonb;
  v_ultimo_status text;
  v_categoria text;
begin
  select * into v_pedido from pedidos where mp_reference_id = p_mp_reference_id;

  if not found then
    return json_build_object('encontrado', false);
  end if;

  select codigo_inscricao into v_codigo from inscritos where pedido_id = v_pedido.id;

  select payload into v_ultimo_payload
    from webhook_logs
    where reference_id = p_mp_reference_id
    order by created_at desc
    limit 1;

  v_ultimo_status := v_ultimo_payload->>'status';

  -- Mesma classificação usada nos e-mails de status (T1) — manter em sincronia.
  v_categoria := case
    when v_ultimo_payload is null then null
    when v_ultimo_payload ? 'erro' then 'falha'
    when v_ultimo_status in ('rejected', 'cancelled') then 'recusado'
    when v_ultimo_status in ('pending', 'in_process', 'authorized', 'in_mediation') then 'pendente'
    when v_ultimo_status = 'approved' then 'aprovado'
    else 'falha'
  end;

  return json_build_object(
    'encontrado', true,
    'status', v_pedido.status,
    'valor_total', v_pedido.valor_total,
    'codigo_inscricao', v_codigo,
    'metodo_pagamento', v_pedido.metodo_pagamento,
    'pago_em', v_pedido.pago_em,
    'ultima_categoria_pagamento', v_categoria
  );
end;
$$ language plpgsql security definer;
