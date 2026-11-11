-- Isolamento entre contadores (ADR-0004, RNF-06)
--
-- Dois contadores, A e B. B tenta ler, alterar, apagar e criar dados de A em
-- todas as tabelas. Tudo precisa falhar ou não alcançar nenhuma linha.
-- Rodar com: supabase test db

begin;
create extension if not exists pgtap with schema extensions;

select plan(37);

-- ---------------------------------------------------------------------------
-- Preparação (como postgres)
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'contador.a@example.com', '{"nome": "Contadora A"}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'contador.b@example.com', '{"nome": "Contador B"}');

insert into public.clientes (id, contador_id, nome, tipo, honorario, dia_vencimento, cobranca_inicio, email)
values ('a1000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Maria Souza', 'MEI', 300, 10, '2026-01-01', 'maria@example.com');

insert into public.cobrancas (id, contador_id, cliente_id, mes, vencimento, valor)
values ('a2000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'a1000000-0000-0000-0000-000000000001', '2026-11-01', '2026-11-10', 300);

insert into public.obrigacoes (id, contador_id, nome, tipos_cliente, periodicidade, prazo_dia)
values ('a4000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        'Obrigação de teste', array['MEI']::public.tipo_cliente[], 'mensal', 20);

insert into public.obrigacoes_feitas (contador_id, obrigacao_id, cliente_id, periodo)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a4000000-0000-0000-0000-000000000001',
        'a1000000-0000-0000-0000-000000000001', '2026-11');

insert into public.envios (id, contador_id, cliente_id, mes, regua_id, canal, status)
select 'a3000000-0000-0000-0000-000000000001', r.contador_id,
       'a1000000-0000-0000-0000-000000000001', '2026-11-01', r.id, 'email', 'enviado'
  from public.regua r
 where r.contador_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and r.dias = -3;

insert into public.envio_cobrancas (envio_id, cobranca_id, contador_id)
values ('a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

insert into public.clientes (id, contador_id, nome, tipo, honorario, dia_vencimento, cobranca_inicio)
values ('b1000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        'João Lima', 'PF', 200, 5, '2026-01-01');

-- 1
select is_empty(
  $$ select c.relname
       from pg_class c
       join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity $$,
  'todas as tabelas do esquema public têm RLS ligada'
);

-- ---------------------------------------------------------------------------
-- B tenta ler os dados de A
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", "role": "authenticated"}', true);

-- 2 a 12
select is((select count(*)::int from public.contadores), 1, 'B vê só o próprio perfil');
select is_empty($$ select 1 from public.contadores where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'B não vê o perfil de A');
select is((select count(*)::int from public.clientes), 1, 'B vê só o próprio cliente');
select is_empty($$ select 1 from public.clientes where contador_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'B não vê clientes de A');
select is_empty($$ select 1 from public.cobrancas $$, 'B não vê cobranças de A');
select is_empty($$ select 1 from public.cobrancas_situacao $$, 'B não vê cobranças de A pela view');
select is((select count(*)::int from public.regua), 4, 'B vê só os 4 passos da própria régua');
select is_empty($$ select 1 from public.obrigacoes where contador_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' $$,
  'B não vê obrigações de A');
select is_empty($$ select 1 from public.obrigacoes_feitas $$, 'B não vê obrigações feitas por A');
select is_empty($$ select 1 from public.envios $$, 'B não vê envios de A');
select is_empty($$ select 1 from public.envio_cobrancas $$, 'B não vê as cobranças dos envios de A');

-- 13
select isnt_empty($$ select 1 from public.obrigacoes_padrao $$, 'B lê o calendário padrão da plataforma');

-- ---------------------------------------------------------------------------
-- B tenta alterar e apagar os dados de A
-- ---------------------------------------------------------------------------

-- 14 a 19
with u as (
  update public.clientes set nome = 'Invadido'
   where id = 'a1000000-0000-0000-0000-000000000001' returning 1)
select is(count(*)::int, 0, 'B não altera cliente de A') from u;

with d as (
  delete from public.clientes
   where id = 'a1000000-0000-0000-0000-000000000001' returning 1)
select is(count(*)::int, 0, 'B não apaga cliente de A') from d;

with u as (
  update public.cobrancas set pago_em = '2026-11-05', forma = 'pix'
   where id = 'a2000000-0000-0000-0000-000000000001' returning 1)
select is(count(*)::int, 0, 'B não dá baixa em cobrança de A') from u;

with u as (
  update public.regua set texto = 'Invadido'
   where contador_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning 1)
select is(count(*)::int, 0, 'B não altera a régua de A') from u;

with d as (
  delete from public.obrigacoes
   where contador_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning 1)
select is(count(*)::int, 0, 'B não apaga obrigações de A') from d;

with d as (
  delete from public.obrigacoes_feitas
   where contador_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' returning 1)
select is(count(*)::int, 0, 'B não desmarca obrigações feitas por A') from d;

-- ---------------------------------------------------------------------------
-- B tenta criar dados na conta de A ou apontando para dados de A
-- ---------------------------------------------------------------------------

-- 20 a 25
select throws_ok(
  $$ insert into public.clientes (contador_id, nome, tipo, honorario, dia_vencimento)
     values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Falso', 'MEI', 100, 5) $$,
  '42501', null, 'B não cria cliente na conta de A');

select throws_ok(
  $$ insert into public.cobrancas (cliente_id, mes, vencimento, valor)
     values ('a1000000-0000-0000-0000-000000000001', '2026-11-01', '2026-11-10', 300) $$,
  '23503', null, 'B não cria cobrança para cliente de A, nem descobre que A já tem cobrança naquele mês');

select throws_ok(
  $$ insert into public.obrigacoes_feitas (obrigacao_id, cliente_id, periodo)
     values ('a4000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '2026-11') $$,
  '23503', null, 'B não marca obrigação de A');

select throws_ok(
  $$ insert into public.envios (cliente_id, mes, regua_id, canal, status)
     select 'a1000000-0000-0000-0000-000000000001', '2026-11-01', r.id, 'manual', 'enviado'
       from public.regua r where r.dias = 0 $$,
  '23503', null, 'B não registra envio para cliente de A');

select throws_ok(
  $$ insert into public.envio_cobrancas (envio_id, cobranca_id)
     values ('a3000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001') $$,
  '23503', null, 'B não liga envios e cobranças da conta de A, nem descobre que a ligação existe');

select is(public.garantir_cobrancas('2026-11-01'), 1,
  'garantir_cobrancas pela sessão de B só cria a cobrança do cliente de B');

-- ---------------------------------------------------------------------------
-- Campos e operações reservados ao sistema
-- ---------------------------------------------------------------------------

-- 26 a 31
select throws_ok(
  $$ update public.contadores set plano = 'pro' $$,
  '42501', null, 'contador não muda o próprio plano');

select throws_ok(
  $$ update public.clientes set email_situacao = 'ok' $$,
  '42501', null, 'contador não muda a situação do e-mail do cliente');

select throws_ok(
  $$ update public.clientes set provedor_cliente_id = 'cus_123' $$,
  '42501', null, 'contador não muda o identificador do pagador no provedor');

select throws_ok(
  $$ insert into public.envios (cliente_id, mes, regua_id, canal, status)
     select 'b1000000-0000-0000-0000-000000000001', '2026-11-01', r.id, 'email', 'pendente'
       from public.regua r where r.dias = 0 $$,
  '42501', null, 'contador não cria envio automático');

select throws_ok(
  $$ insert into public.regua (dias, nome, ativo, texto) values (7, 'Extra', true, 'x') $$,
  '42501', null, 'contador não cria passo novo na régua');

select throws_ok(
  $$ delete from public.cobrancas $$,
  '42501', null, 'contador não apaga cobranças');

-- 32
select throws_ok(
  $$ insert into public.obrigacoes_padrao (ano, codigo, nome, tipos_cliente, periodicidade, prazo_dia)
     values (2026, 'X', 'X', array['MEI']::public.tipo_cliente[], 'mensal', 1) $$,
  '42501', null, 'contador não altera o calendário padrão da plataforma');

-- ---------------------------------------------------------------------------
-- Visitante sem login
-- ---------------------------------------------------------------------------

reset role;
set local role anon;

-- 33 a 35
select throws_ok($$ select 1 from public.clientes $$, '42501', null,
  'visitante sem login não lê clientes');
select throws_ok($$ select 1 from public.cobrancas_situacao $$, '42501', null,
  'visitante sem login não lê a view de cobranças');
select throws_ok($$ select public.garantir_cobrancas('2026-11-01') $$, '42501', null,
  'visitante sem login não gera cobranças');

-- ---------------------------------------------------------------------------
-- Os dados de A continuam intactos
-- ---------------------------------------------------------------------------

reset role;

-- 36 e 37
select is((select nome from public.clientes where id = 'a1000000-0000-0000-0000-000000000001'),
  'Maria Souza', 'o cliente de A continua intacto');
select is((select count(*)::int from public.cobrancas
            where contador_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' and pago_em is null),
  1, 'a cobrança de A continua em aberto e não ganhou cópias');

select * from finish();
rollback;
