-- ============================================================================
-- COBEO CONNECT — Schema do Banco de Dados (Supabase / PostgreSQL)
-- Versão 3.0 — Modelo de cursos individuais + categorias + jantar
-- ============================================================================
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================================

create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. PEDIDOS — hub central de todas as transações
-- ============================================================================
create table if not exists pedidos (
  id                uuid primary key default uuid_generate_v4(),

  -- Dados do comprador (desnormalizados — inscritos não têm conta)
  nome              text not null,
  email             text not null,
  telefone          text not null,
  whatsapp          text not null,

  -- Tipo de pedido
  tem_inscricao     boolean not null default false,
  tem_trabalho      boolean not null default false,

  -- Categoria do participante (define o preço dos cursos)
  categoria         text check (categoria in ('aluno_unifafibe','aluno_externo','profissional')),

  -- Valores (snapshot no momento da compra)
  valor_cursos      numeric(10,2) not null default 0,
  valor_jantar      numeric(10,2) not null default 0,
  valor_trabalho    numeric(10,2) not null default 0,
  desconto_cupom    numeric(10,2) not null default 0,

  -- Total calculado pelo banco — impossível manipular pelo frontend
  valor_total       numeric(10,2)
                    generated always as
                    (valor_cursos + valor_jantar + valor_trabalho - desconto_cupom) stored,

  -- Jantar
  jantar_opcao      text check (jantar_opcao in ('com_restricao','sem_restricao')),

  -- Cupom usado (se houver)
  cupom_id          uuid,

  -- Pagamento
  status            text not null default 'pendente'
                    check (status in ('pendente','pago','cancelado','reembolsado','expirado')),
  mp_reference_id   text,
  mp_payment_id     text,
  metodo_pagamento  text check (metodo_pagamento in ('pix','debito','credito')),
  pago_em           timestamptz,

  created_at        timestamptz not null default now()
);

create index if not exists idx_pedidos_email      on pedidos(email);
create index if not exists idx_pedidos_status     on pedidos(status);
create index if not exists idx_pedidos_created    on pedidos(created_at desc);
create index if not exists idx_pedidos_mp_ref     on pedidos(mp_reference_id);

-- ============================================================================
-- 2. INSCRITOS — dados da inscrição no evento (1 por pedido com inscrição)
-- ============================================================================
create table if not exists inscritos (
  id                uuid primary key default uuid_generate_v4(),
  pedido_id         uuid not null references pedidos(id) on delete cascade,

  -- Código único do participante (formato COBEO-XXXX) — vai no QR Code do crachá
  codigo_inscricao  text unique not null
                    default 'COBEO-' || upper(substring(md5(uuid_generate_v4()::text) from 1 for 4)),

  -- Presença (resumo — atualizado por trigger após primeiro check-in)
  presenca          boolean not null default false,
  primeiro_checkin_em timestamptz,

  created_at        timestamptz not null default now()
);

create index if not exists idx_inscritos_pedido on inscritos(pedido_id);
create index if not exists idx_inscritos_codigo on inscritos(codigo_inscricao);

-- ============================================================================
-- 3. PEDIDO_CURSOS — cursos comprados em cada pedido (N por pedido)
-- ============================================================================
create table if not exists pedido_cursos (
  id            uuid primary key default uuid_generate_v4(),
  pedido_id     uuid not null references pedidos(id) on delete cascade,
  curso_ref     text not null,                  -- id do curso em event.ts
  curso_titulo  text not null,                  -- snapshot do título
  valor         numeric(10,2) not null,         -- snapshot do preço no momento
  created_at    timestamptz not null default now(),
  unique (pedido_id, curso_ref)
);

create index if not exists idx_pedido_cursos_pedido on pedido_cursos(pedido_id);

-- ============================================================================
-- 4. PRESENCAS — check-in por curso (N por inscrito)
-- ============================================================================
create table if not exists presencas (
  id            uuid primary key default uuid_generate_v4(),
  inscrito_id   uuid not null references inscritos(id) on delete cascade,
  curso_ref     text not null,                  -- qual curso foi confirmado
  confirmado_em timestamptz not null default now(),
  confirmado_por text,                          -- email do admin/fiscal que registrou
  unique (inscrito_id, curso_ref)               -- não registra duas vezes no mesmo curso
);

create index if not exists idx_presencas_inscrito on presencas(inscrito_id);

-- ============================================================================
-- 5. TRABALHOS — submissões acadêmicas
-- ============================================================================
create table if not exists trabalhos (
  id            uuid primary key default uuid_generate_v4(),
  pedido_id     uuid not null references pedidos(id) on delete cascade,
  titulo        text not null,
  resumo        text not null,
  categoria     text not null,
  modalidade    text not null check (modalidade in ('Presencial','Online')),
  formato       text not null check (formato in ('Oral','Pôster')),
  arquivo_path  text,                           -- caminho no Supabase Storage
  arquivo_nome  text,
  arquivo_tipo  text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_trabalhos_pedido on trabalhos(pedido_id);

-- ============================================================================
-- 6. COAUTORES — lista de coautores (N por trabalho)
-- ============================================================================
create table if not exists coautores (
  id          uuid primary key default uuid_generate_v4(),
  trabalho_id uuid not null references trabalhos(id) on delete cascade,
  nome        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_coautores_trabalho on coautores(trabalho_id);

-- ============================================================================
-- 7. CUPONS — descontos (válidos apenas para cursos)
-- ============================================================================
create table if not exists cupons (
  id          uuid primary key default uuid_generate_v4(),
  codigo      text unique not null,
  titular     text not null,
  categoria   text not null
              check (categoria in ('aluno_interno','servidor_publico','aluno_externo','publico_geral')),
  tipo        text not null check (tipo in ('fixo','percentual')),
  valor       numeric(10,2) not null,
  status      text not null default 'disponivel'
              check (status in ('disponivel','utilizado','expirado')),
  usado_em    timestamptz,
  pedido_id   uuid references pedidos(id),
  created_at  timestamptz not null default now()
);

create index if not exists idx_cupons_codigo on cupons(codigo);

-- ============================================================================
-- 8. CONFIGURACOES_EVENTO — singleton (sempre 1 linha)
-- ============================================================================
create table if not exists configuracoes_evento (
  id                        integer primary key default 1,
  inscricoes_bloqueadas     boolean not null default false,  -- botão admin
  jantar_bloqueado          boolean not null default false,  -- botão admin
  certificados_enviados_em  timestamptz,                       -- null = não enviados
  constraint apenas_uma_linha check (id = 1)
);

insert into configuracoes_evento (id) values (1) on conflict (id) do nothing;

-- ============================================================================
-- 9. WEBHOOK_LOGS — auditoria dos callbacks do Mercado Pago
-- ============================================================================
create table if not exists webhook_logs (
  id            uuid primary key default uuid_generate_v4(),
  reference_id  text,
  payload       jsonb,
  processado    boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- 10. ADMINS — perfil dos administradores (vinculado ao Supabase Auth)
-- ============================================================================
create table if not exists admins (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nome        text,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- TRIGGER — atualiza inscritos.presenca após primeiro check-in
-- ============================================================================
create or replace function fn_atualiza_presenca()
returns trigger as $$
begin
  update inscritos
    set presenca = true,
        primeiro_checkin_em = coalesce(primeiro_checkin_em, now())
    where id = new.inscrito_id;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_atualiza_presenca on presencas;
create trigger trg_atualiza_presenca
  after insert on presencas
  for each row execute function fn_atualiza_presenca();

-- ============================================================================
-- FUNÇÃO — validar cupom (SECURITY DEFINER — nunca expõe dados do cupom)
-- ============================================================================
create or replace function validar_cupom(p_codigo text)
returns json as $$
declare
  v_cupom cupons%rowtype;
begin
  select * into v_cupom from cupons where codigo = upper(p_codigo);

  if not found then
    return json_build_object('valido', false, 'mensagem', 'Cupom não encontrado');
  end if;

  if v_cupom.status <> 'disponivel' then
    return json_build_object('valido', false, 'mensagem', 'Cupom já utilizado ou expirado');
  end if;

  return json_build_object(
    'valido', true,
    'tipo', v_cupom.tipo,
    'valor', v_cupom.valor,
    'mensagem', 'Cupom válido'
  );
end;
$$ language plpgsql security definer;

-- ============================================================================
-- FUNÇÃO — usar cupom (chamada apenas pelo webhook após pagamento confirmado)
-- ============================================================================
create or replace function usar_cupom(p_codigo text, p_pedido_id uuid)
returns void as $$
begin
  update cupons
    set status = 'utilizado',
        usado_em = now(),
        pedido_id = p_pedido_id
    where codigo = upper(p_codigo) and status = 'disponivel';
end;
$$ language plpgsql security definer;

-- ============================================================================
-- VIEW — inscrições completas (usada no admin e exportações)
-- ============================================================================
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
  c.codigo          as cupom_codigo
from pedidos p
left join inscritos i on i.pedido_id = p.id
left join trabalhos t on t.pedido_id = p.id
left join cupons   c on c.id = p.cupom_id;

-- ============================================================================
-- RLS — Row Level Security
-- ============================================================================
alter table pedidos              enable row level security;
alter table inscritos            enable row level security;
alter table pedido_cursos        enable row level security;
alter table presencas            enable row level security;
alter table trabalhos            enable row level security;
alter table coautores            enable row level security;
alter table cupons               enable row level security;
alter table configuracoes_evento enable row level security;
alter table webhook_logs         enable row level security;
alter table admins               enable row level security;

-- Admins autenticados podem ler/escrever tudo
-- (o service_role das Edge Functions ignora RLS automaticamente)
create policy "admin_full_pedidos"        on pedidos              for all to authenticated using (true) with check (true);
create policy "admin_full_inscritos"      on inscritos            for all to authenticated using (true) with check (true);
create policy "admin_full_pedido_cursos"  on pedido_cursos        for all to authenticated using (true) with check (true);
create policy "admin_full_presencas"      on presencas            for all to authenticated using (true) with check (true);
create policy "admin_full_trabalhos"      on trabalhos            for all to authenticated using (true) with check (true);
create policy "admin_full_coautores"      on coautores            for all to authenticated using (true) with check (true);
create policy "admin_full_cupons"         on cupons               for all to authenticated using (true) with check (true);
create policy "admin_full_config"         on configuracoes_evento for all to authenticated using (true) with check (true);
create policy "admin_read_webhook"        on webhook_logs         for select to authenticated using (true);
create policy "admin_full_admins"         on admins               for all to authenticated using (true) with check (true);

-- Leitura pública das configurações (para o site saber se inscrições estão bloqueadas)
create policy "public_read_config" on configuracoes_evento for select to anon using (true);

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
