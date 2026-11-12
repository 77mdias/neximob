-- Regras de negócio garantidas pelo banco (SRS, seções 3 e 4)
--
-- Tudo roda na sessão de uma contadora (papel authenticated), como a tela
-- faria, exceto o que só o sistema pode fazer.
-- Rodar com: supabase test db

begin;
create extension if not exists pgtap with schema extensions;

select plan(38);

-- Funções auxiliares, apagadas no rollback: meses relativos ao mês corrente.
create schema testes;
grant usage on schema testes to authenticated;

create function testes.mes(p_deslocamento int)
returns date language sql stable as $$
  select (date_trunc('month', public.hoje_brasilia()::timestamp) + make_interval(months => p_deslocamento))::date
$$;

create function testes.dia(p_deslocamento int, p_dia int)
returns date language sql stable as $$
  select testes.mes(p_deslocamento) + (p_dia - 1)
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'contadora.c@example.com', '{"nome": "Contadora C"}');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "cccccccc-cccc-cccc-cccc-cccccccccccc", "role": "authenticated"}', true);

-- ---------------------------------------------------------------------------
-- RF-42 e RN-08: conta nova
-- ---------------------------------------------------------------------------

-- 1 a 5
select is((select nome from public.contadores), 'Contadora C', 'o perfil é criado com o nome do cadastro');
select is((select count(*)::int from public.regua), 4, 'a régua nasce com 4 passos');
select is((select count(*)::int from public.regua where ativo), 3, 'três passos nascem ligados');
select is((select ativo from public.regua where dias = 7), false, 'o passo de 7 dias depois nasce desligado');
select is((select count(*)::int from public.obrigacoes), 5, 'o calendário padrão é copiado para a conta');

-- 5a e 5b: texto de pendência (Q-02)
select ok((select texto_pendencia like '%{nome}%{pix}%' from public.contadores),
  'a conta nova recebe o texto de pendência padrão, com os campos nome e pix');
select lives_ok(
  $$ update public.contadores set texto_pendencia = 'Olá, {nome}! Há honorários em aberto. Chave Pix: {pix}.' $$,
  'o contador edita o texto de pendência');

-- ---------------------------------------------------------------------------
-- RF-01 e RN-07: cadastro de cliente
-- ---------------------------------------------------------------------------

-- 6 a 9
select throws_ok(
  $$ insert into public.clientes (nome, tipo, honorario, dia_vencimento) values ('Ana', 'MEI', 100, 29) $$,
  '23514', null, 'dia de vencimento 29 é recusado');

select throws_ok(
  $$ insert into public.clientes (nome, tipo, honorario, dia_vencimento, telefone)
     values ('Ana', 'MEI', 100, 10, '11999990000') $$,
  '23514', null, 'telefone fora do formato +55 é recusado');

select lives_ok(
  $$ insert into public.clientes (id, nome, tipo, honorario, dia_vencimento, cobranca_inicio, email)
     values ('c1000000-0000-0000-0000-000000000001', 'Maria Souza', 'MEI', 300, 10,
             testes.mes(0), 'maria@example.com') $$,
  'cliente cadastrado sem informar contador_id fica na conta de quem cadastrou');

select lives_ok(
  $$ insert into public.clientes (id, nome, tipo, honorario, dia_vencimento, cobranca_inicio)
     values ('c1000000-0000-0000-0000-000000000002', 'Padaria Boa Massa', 'SIMPLES', 500, 5,
             testes.mes(1)) $$,
  'cliente que começa a ser cobrado no mês seguinte (RN-21)');

-- ---------------------------------------------------------------------------
-- RF-02: cobranças do mês
-- ---------------------------------------------------------------------------

-- 10 a 13
select is(public.garantir_cobrancas(testes.mes(0)), 1,
  'no mês corrente, só o cliente que já começou a ser cobrado ganha cobrança');
select is(public.garantir_cobrancas(testes.mes(0)), 0,
  'rodar de novo não duplica cobranças');
select is(public.garantir_cobrancas(testes.mes(1)), 2,
  'no mês seguinte, os dois clientes ganham cobrança');
select is(
  (select vencimento from public.cobrancas
    where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(0)),
  testes.dia(0, 10), 'o vencimento da cobrança usa o dia de vencimento do cliente');

-- 14
select throws_ok(
  $$ insert into public.cobrancas (cliente_id, mes, vencimento, valor)
     values ('c1000000-0000-0000-0000-000000000001', testes.mes(0), testes.dia(0, 10), 300) $$,
  '23505', null, 'uma cobrança só por cliente e mês');

-- 15
select throws_ok(
  $$ insert into public.cobrancas (cliente_id, mes, vencimento, valor)
     values ('c1000000-0000-0000-0000-000000000001', '2030-01-01', '2030-02-10', 300) $$,
  '23514', null, 'o vencimento precisa cair no mês da cobrança');

-- ---------------------------------------------------------------------------
-- RN-14: mudança de honorário e de dia de vencimento
-- ---------------------------------------------------------------------------

-- Cobrança paga do mês anterior.
insert into public.cobrancas (cliente_id, mes, vencimento, valor)
values ('c1000000-0000-0000-0000-000000000001', testes.mes(-1), testes.dia(-1, 10), 300);
update public.cobrancas set pago_em = testes.dia(-1, 9), forma = 'pix'
 where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(-1);

update public.clientes set honorario = 350, dia_vencimento = 15
 where id = 'c1000000-0000-0000-0000-000000000001';

-- 16 a 19
select is(
  (select valor from public.cobrancas
    where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(-1)),
  300.00::numeric, 'a cobrança paga do mês anterior mantém o valor');
select is(
  (select valor from public.cobrancas
    where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(0)),
  350.00::numeric, 'a cobrança em aberto do mês corrente passa para o novo honorário');
select is(
  (select vencimento from public.cobrancas
    where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(1)),
  testes.dia(1, 15), 'a cobrança do mês seguinte passa para o novo dia de vencimento');
select is(
  (select vencimento from public.cobrancas
    where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(-1)),
  testes.dia(-1, 10), 'a cobrança paga mantém o vencimento antigo');

-- ---------------------------------------------------------------------------
-- RF-13 e RF-12: serviço extra e baixa
-- ---------------------------------------------------------------------------

-- 20 a 25
select throws_ok(
  $$ update public.cobrancas set extra = 150
      where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(0) $$,
  '23514', null, 'serviço extra sem motivo é recusado');

select lives_ok(
  $$ update public.cobrancas set extra = 150, motivo_extra = 'Abertura de filial'
      where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(0) $$,
  'serviço extra com motivo é aceito');

select is(
  (select total from public.cobrancas_situacao
    where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(0)),
  500.00::numeric, 'total do mês = honorário + extra (RN-01)');

select is(
  (select honorario from public.clientes where id = 'c1000000-0000-0000-0000-000000000001'),
  350.00::numeric, 'o extra não muda o honorário do cadastro');

select throws_ok(
  $$ update public.cobrancas set pago_em = public.hoje_brasilia()
      where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(0) $$,
  '23514', null, 'baixa sem forma de pagamento é recusada');

select lives_ok(
  $$ update public.cobrancas set pago_em = public.hoje_brasilia(), forma = 'transferencia'
      where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(0) $$,
  'baixa manual com data e forma');

-- 26
select is(
  (select situacao::text from public.cobrancas_situacao
    where cliente_id = 'c1000000-0000-0000-0000-000000000001' and mes = testes.mes(0)),
  'pago', 'cobrança com baixa aparece como paga');

-- ---------------------------------------------------------------------------
-- RN-02: situação da cobrança (RF-10)
-- ---------------------------------------------------------------------------

-- 27 a 30
select is(public.status_cobranca('2026-11-10', null, '2026-11-07')::text, 'a_vencer',
  'vence dia 10, hoje é dia 7: a vencer');
select is(public.status_cobranca('2026-11-10', null, '2026-11-10')::text, 'vence_hoje',
  'vence dia 10, hoje é dia 10: vence hoje');
select is(public.status_cobranca('2026-11-10', null, '2026-11-15')::text, 'atrasado',
  'vence dia 10, hoje é dia 15: atrasado');
select is(public.status_cobranca('2026-11-10', '2026-11-12', '2026-11-15')::text, 'pago',
  'com pagamento registrado: pago');

-- ---------------------------------------------------------------------------
-- RN-13: envios
-- ---------------------------------------------------------------------------

-- 31
select lives_ok(
  $$ insert into public.envios (cliente_id, mes, regua_id, canal, status, enviado_em)
     select 'c1000000-0000-0000-0000-000000000001', testes.mes(0), r.id, 'manual', 'enviado', now()
       from public.regua r cross join generate_series(1, 2)
      where r.dias = 0 $$,
  'o contador pode registrar mais de um envio manual do mesmo passo');

reset role;

insert into public.envios (contador_id, cliente_id, mes, regua_id, canal)
select r.contador_id, 'c1000000-0000-0000-0000-000000000001', testes.mes(0), r.id, 'email'
  from public.regua r
 where r.contador_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and r.dias = 0;

-- 32
select throws_ok(
  $$ insert into public.envios (contador_id, cliente_id, mes, regua_id, canal)
     select r.contador_id, 'c1000000-0000-0000-0000-000000000001', testes.mes(0), r.id, 'email'
       from public.regua r
      where r.contador_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc' and r.dias = 0 $$,
  '23505', null, 'um envio automático só por cliente, mês, passo e canal');

-- ---------------------------------------------------------------------------
-- RN-24 (proposto): e-mail devolvido
-- ---------------------------------------------------------------------------

update public.clientes set email_situacao = 'devolvido'
 where id = 'c1000000-0000-0000-0000-000000000001';

set local role authenticated;

update public.clientes set email = 'maria.souza@example.com'
 where id = 'c1000000-0000-0000-0000-000000000001';

-- 33
select is(
  (select email_situacao::text from public.clientes where id = 'c1000000-0000-0000-0000-000000000001'),
  'ok', 'corrigir o e-mail devolve a situação para ok');

-- ---------------------------------------------------------------------------
-- Q-15: excluir cliente apaga tudo dele
-- ---------------------------------------------------------------------------

-- 34 e 35
select lives_ok(
  $$ delete from public.clientes where id = 'c1000000-0000-0000-0000-000000000002' $$,
  'o contador exclui um cliente');
select is(
  (select count(*)::int from public.cobrancas where cliente_id = 'c1000000-0000-0000-0000-000000000002'),
  0, 'as cobranças do cliente excluído saem junto');

-- ---------------------------------------------------------------------------
-- E-mail do perfil acompanha o e-mail do login
-- ---------------------------------------------------------------------------

reset role;
update auth.users set email = 'nova.c@example.com' where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

-- 36
select is(
  (select email from public.contadores where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
  'nova.c@example.com', 'o e-mail do perfil acompanha o e-mail do login');

select * from finish();
rollback;
