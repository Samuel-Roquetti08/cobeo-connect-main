-- ============================================================================
-- 005 — Bloqueio de inscrição por curso individual
-- ============================================================================
-- Pedido do Samuel: hoje `configuracoes_evento.inscricoes_bloqueadas` só
-- bloqueia TODOS os cursos de uma vez. Ele quer poder bloquear cursos
-- individualmente (ex.: uma turma de hands-on lotou, mas o resto do evento
-- continua vendendo normalmente).
--
-- Camada de segurança: não sabemos a definição exata da policy de RLS que
-- hoje impede inserção quando `inscricoes_bloqueadas = true` (não está
-- versionada neste repo — foi criada direto no painel do Supabase, como já
-- aconteceu com vw_elegiveis_certificado antes do arquivo 001). Em vez de
-- arriscar mexer numa policy que não vemos, este arquivo adiciona uma
-- trigger BEFORE INSERT independente em `pedido_cursos`: ela roda para
-- QUALQUER insert (não importa a policy de RLS envolvida), então garante
-- de verdade que ninguém consegue se inscrever num curso bloqueado — mesmo
-- via chamada direta à API REST do Supabase com a anon key.
--
-- A UI (site público) some/desabilita o curso; `criarPedidoEvento`
-- (src/lib/api/pedidos.ts) faz uma checagem amigável antes do insert; e
-- esta trigger é a garantia real, no banco, que não depende de nenhuma das
-- duas camadas acima estarem certas.
--
-- Rode este arquivo no SQL Editor do Supabase.
-- ============================================================================

alter table configuracoes_evento
  add column if not exists cursos_bloqueados text[] not null default '{}';

create or replace function fn_valida_curso_nao_bloqueado()
returns trigger as $$
declare
  v_bloqueados text[];
begin
  select cursos_bloqueados into v_bloqueados from configuracoes_evento where id = 1;
  if new.curso_ref = any(v_bloqueados) then
    raise exception 'Curso indisponível para inscrição no momento.';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_valida_curso_bloqueado on pedido_cursos;
create trigger trg_valida_curso_bloqueado
  before insert on pedido_cursos
  for each row execute function fn_valida_curso_nao_bloqueado();
