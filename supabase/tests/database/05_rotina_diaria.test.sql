-- Rotina diária de lembretes (ADR-0005, RF-34, RF-35, RN-09, RN-13, RN-17 a RN-19, RN-22, RN-24)
-- A rotina recebe a data como parâmetro: os cenários usam datas fixas em 2030.
-- Rodar com: supabase test db

begin;
create extension if not exists pgtap with schema extensions;

select plan(36);

create schema testes;

-- Envio de um cliente num mês (ciclo), para um passo da régua.
create function testes.envio(p_cliente uuid, p_mes date, p_dias int)
returns uuid language sql stable as $$
  select e.id
    from public.envios e
    join public.regua r on r.id = e.regua_id
   where e.cliente_id = p_cliente and e.mes = p_mes and r.dias = p_dias and e.canal = 'email'
$$;

create function testes.status(p_cliente uuid, p_mes date, p_dias int)
returns text language sql stable as $$
  select status::text from public.envios where id = testes.envio(p_cliente, p_mes, p_dias)
$$;

insert into auth.users (id, email, raw_user_meta_data) values
  ('0b000000-0000-0000-0000-00000000000b', 'escritorio.h@example.com', '{"nome": "Escritório H"}');

update public.contadores set chave_pix = 'pix@example.com'
 where id = '0b000000-0000-0000-0000-00000000000b';

-- Liga o passo de 7 dias depois, para testar passos que caem no mês seguinte.
update public.regua set ativo = true
 where contador_id = '0b000000-0000-0000-0000-00000000000b' and dias = 7;

insert into public.clientes (id, contador_id, nome, tipo, honorario, dia_vencimento, cobranca_inicio, email, email_situacao, ativo) values
  ('b1000000-0000-0000-0000-000000000001', '0b000000-0000-0000-0000-00000000000b', 'Rita Alves',    'MEI', 300, 10, '2030-01-01', 'rita@example.com',   'ok',        true),
  ('b1000000-0000-0000-0000-000000000002', '0b000000-0000-0000-0000-00000000000b', 'Saulo Braga',   'MEI', 400,  2, '2030-01-01', 'saulo@example.com',  'ok',        true),
  ('b1000000-0000-0000-0000-000000000003', '0b000000-0000-0000-0000-00000000000b', 'Tânia Costa',   'PF',  250, 28, '2030-01-01', 'tania@example.com',  'ok',        true),
  ('b1000000-0000-0000-0000-000000000004', '0b000000-0000-0000-0000-00000000000b', 'Ulisses Dias',  'MEI', 300, 10, '2030-01-01', null,                 'ok',        true),
  ('b1000000-0000-0000-0000-000000000005', '0b000000-0000-0000-0000-00000000000b', 'Vera Esteves',  'MEI', 300, 10, '2030-01-01', 'vera@example.com',   'devolvido', true),
  ('b1000000-0000-0000-0000-000000000006', '0b000000-0000-0000-0000-00000000000b', 'Wagner Farias', 'MEI', 300, 10, '2030-01-01', 'wagner@example.com', 'ok',        false);

-- ---------------------------------------------------------------------------
-- Cenário A, 07/03/2030: passo "3 dias antes" e passo +7 que cai no mês seguinte
-- ---------------------------------------------------------------------------

-- 1 a 7
select is(interno.planejar_lembretes('2030-03-07') ->> 'situacao', 'concluida', 'o planejamento conclui');
select is(testes.status('b1000000-0000-0000-0000-000000000001', '2030-03-01', -3), 'pendente',
  'vence dia 10: lembrete "3 dias antes" no dia 7');
select is(testes.status('b1000000-0000-0000-0000-000000000003', '2030-02-01', 7), 'pendente',
  'vence dia 28 de fevereiro: o passo +7 cai em 7 de março e é do ciclo de fevereiro');
select is_empty(
  $$ select 1 from public.envios where cliente_id in ('b1000000-0000-0000-0000-000000000004',
       'b1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000006') $$,
  'sem e-mail (RN-17), e-mail devolvido (RN-24) e cliente inativo (RN-16) não recebem lembrete'
);
select ok(
  exists (select 1 from public.cobrancas where cliente_id = 'b1000000-0000-0000-0000-000000000001' and mes = '2030-03-01')
  and exists (select 1 from public.cobrancas where cliente_id = 'b1000000-0000-0000-0000-000000000003' and mes = '2030-02-01'),
  'RF-02: a rotina cria a cobrança do mês e a do ciclo do lembrete'
);
select is(interno.planejar_lembretes('2030-03-07') ->> 'envios_planejados', '0',
  'RN-13: rodar de novo no mesmo dia não planeja nada');
select is((select count(*)::int from public.envios where contador_id = '0b000000-0000-0000-0000-00000000000b'), 2,
  'RN-13: nenhum envio duplicado');

-- ---------------------------------------------------------------------------
-- Cenário B, 30/03/2030: vence dia 2, o passo −3 cai no mês anterior
-- ---------------------------------------------------------------------------

delete from interno.rotina_execucoes;
select interno.planejar_lembretes('2030-03-30');

-- 8 e 9
select is(testes.status('b1000000-0000-0000-0000-000000000002', '2030-04-01', -3), 'pendente',
  'vence 02/04: lembrete "3 dias antes" em 30/03, do ciclo de abril');
select ok(
  exists (select 1 from public.cobrancas where cliente_id = 'b1000000-0000-0000-0000-000000000002' and mes = '2030-04-01'),
  'a cobrança de abril já existe em 30/03'
);

-- ---------------------------------------------------------------------------
-- Cenário C, 05/04/2030: a rotina ficou parada de 31/03 a 04/04 (RN-22)
-- ---------------------------------------------------------------------------

-- 10 a 14
select is(
  (select array[r ->> 'desde', r ->> 'envios_planejados', r ->> 'envios_pulados']
     from (select interno.planejar_lembretes('2030-04-05') as r) x),
  array['2030-03-31', '2', '2'], 'recupera os dias perdidos desde a última execução'
);
select is(testes.status('b1000000-0000-0000-0000-000000000002', '2030-04-01', 0), 'pulado',
  'passo "No dia" que ficou para trás é registrado como pulado');
select is(testes.status('b1000000-0000-0000-0000-000000000002', '2030-04-01', 3), 'pendente',
  'só o passo mais recente de cada cliente sai');
select is(testes.status('b1000000-0000-0000-0000-000000000003', '2030-03-01', 3), 'pulado',
  'cliente com vencimento no dia 28: passo +3 de 31/03 pulado');
select is(testes.status('b1000000-0000-0000-0000-000000000003', '2030-03-01', 7), 'pendente',
  'cliente com vencimento no dia 28: passo +7 de 04/04 sai');

-- ---------------------------------------------------------------------------
-- Cenário D: cobrança paga (RN-09) e mensagem de pendência (RN-18, RN-19)
-- ---------------------------------------------------------------------------

update public.cobrancas set pago_em = '2030-03-08', forma = 'pix'
 where cliente_id = 'b1000000-0000-0000-0000-000000000001' and mes = '2030-03-01';

delete from interno.rotina_execucoes;
select interno.planejar_lembretes('2030-03-10');

-- 15
select is(testes.envio('b1000000-0000-0000-0000-000000000001', '2030-03-01', 0), null::uuid,
  'RN-09: cobrança paga não recebe o lembrete do dia');

insert into public.cobrancas (contador_id, cliente_id, mes, vencimento, valor)
values ('0b000000-0000-0000-0000-00000000000b', 'b1000000-0000-0000-0000-000000000001', '2030-02-01', '2030-02-10', 300);
update public.cobrancas set pago_em = '2030-04-08', forma = 'pix'
 where cliente_id = 'b1000000-0000-0000-0000-000000000001' and mes = '2030-04-01';

delete from interno.rotina_execucoes;
select interno.planejar_lembretes('2030-04-10');

-- 16
select is(
  (select tipo from public.envios where id = testes.envio('b1000000-0000-0000-0000-000000000001', '2030-04-01', 0)),
  'pendencia', 'mês pago com fevereiro em aberto: mensagem de pendência no dia do vencimento'
);

-- ---------------------------------------------------------------------------
-- Cenário E: fila de envio
-- ---------------------------------------------------------------------------

-- 17 a 20
select is_empty($$ select * from public.rotina_reservar_envios(50, '2030-04-10 23:30:00+00') $$,
  'fora da janela (20h30 em Brasília) nada é reservado');

create temporary table pendentes_antes as select id from public.envios where status = 'pendente';
create temporary table reservados as select * from public.rotina_reservar_envios(50, '2030-04-10 13:00:00+00') as id;

select set_eq('select id from reservados', 'select id from pendentes_antes',
  'reserva todos os pendentes dentro da janela');
select is_empty($$ select * from public.rotina_reservar_envios(50, '2030-04-10 13:01:00+00') $$,
  'o que está "enviando" não é reservado de novo');
select set_eq($$ select * from public.rotina_reservar_envios(50, '2030-04-10 13:11:00+00') $$,
  'select id from pendentes_antes',
  'envio parado em "enviando" por mais de 10 minutos volta para a fila');

-- 21 a 23
select is(
  (select array[cancelar::text, motivo] from public.rotina_mensagem_do_envio(
     testes.envio('b1000000-0000-0000-0000-000000000001', '2030-03-01', -3))),
  array['true', 'cobrança paga antes do envio'], 'RN-09: cobrança paga depois do planejamento cancela o envio'
);
select ok(
  (select not cancelar and texto like 'Olá, Saulo!%' and destinatario_email = 'saulo@example.com'
          and contador_email = 'escritorio.h@example.com'
     from public.rotina_mensagem_do_envio(testes.envio('b1000000-0000-0000-0000-000000000002', '2030-04-01', 3))),
  'a Edge Function recebe a mensagem pronta, o destinatário e o e-mail de resposta'
);
select is(
  public.rotina_registrar_resultado(
    testes.envio('b1000000-0000-0000-0000-000000000002', '2030-04-01', 3), 'enviado', 'email_123', null,
    (select cobrancas from public.rotina_mensagem_do_envio(testes.envio('b1000000-0000-0000-0000-000000000002', '2030-04-01', 3)))),
  'enviado'::public.status_envio, 'registra o envio aceito pelo provedor'
);

-- 24
select ok(
  (select count(*) >= 1 from public.envio_cobrancas
    where envio_id = testes.envio('b1000000-0000-0000-0000-000000000002', '2030-04-01', 3)),
  'RF-35: o envio fica ligado às cobranças lembradas'
);

-- ---------------------------------------------------------------------------
-- Novas tentativas e falhas (ADR-0005)
-- ---------------------------------------------------------------------------

-- 25 a 28
select is(
  public.rotina_registrar_resultado(testes.envio('b1000000-0000-0000-0000-000000000003', '2030-02-01', 7),
    'falha_temporaria', null, 'HTTP 429', null, '2030-04-10 13:00:00+00'),
  'pendente'::public.status_envio, 'falha temporária volta para a fila'
);
select is(
  (select proxima_tentativa_em from public.envios where id = testes.envio('b1000000-0000-0000-0000-000000000003', '2030-02-01', 7)),
  '2030-04-10 13:05:00+00'::timestamptz, 'primeira nova tentativa em 5 minutos'
);
select public.rotina_registrar_resultado(testes.envio('b1000000-0000-0000-0000-000000000003', '2030-02-01', 7),
  'falha_temporaria', null, 'HTTP 429', null, '2030-04-10 13:05:00+00');
select public.rotina_registrar_resultado(testes.envio('b1000000-0000-0000-0000-000000000003', '2030-02-01', 7),
  'falha_temporaria', null, 'HTTP 429', null, '2030-04-10 13:35:00+00');
select is(
  public.rotina_registrar_resultado(testes.envio('b1000000-0000-0000-0000-000000000003', '2030-02-01', 7),
    'falha_temporaria', null, 'HTTP 429', null, '2030-04-10 15:35:00+00'),
  'falhou'::public.status_envio, 'depois de 3 novas tentativas, o envio falha'
);
select is(
  (select tentativas from public.envios where id = testes.envio('b1000000-0000-0000-0000-000000000003', '2030-02-01', 7)),
  4::smallint, 'quatro tentativas registradas'
);

-- ---------------------------------------------------------------------------
-- Avisos do Resend (ADR-0007, RN-24)
-- ---------------------------------------------------------------------------

-- 29 a 33
select public.rotina_registrar_evento_email('email_123', 'email.delivered');
select is(testes.status('b1000000-0000-0000-0000-000000000002', '2030-04-01', 3), 'entregue',
  'aviso de entrega muda o envio para entregue');
select is(public.rotina_registrar_evento_email('email_desconhecido', 'email.delivered'), false,
  'aviso de e-mail desconhecido é ignorado');

select public.rotina_registrar_resultado(testes.envio('b1000000-0000-0000-0000-000000000002', '2030-04-01', -3),
  'enviado', 'email_456');
select public.rotina_registrar_evento_email('email_456', 'email.bounced');
select is(testes.status('b1000000-0000-0000-0000-000000000002', '2030-04-01', -3), 'falhou',
  'e-mail devolvido: o envio falha');
select is(
  (select email_situacao::text from public.clientes where id = 'b1000000-0000-0000-0000-000000000002'),
  'devolvido', 'RN-24: e-mail devolvido fica sinalizado no cliente'
);

select public.rotina_registrar_resultado(testes.envio('b1000000-0000-0000-0000-000000000003', '2030-03-01', 7),
  'enviado', 'email_789');
select public.rotina_registrar_evento_email('email_789', 'email.complained');
select is(
  (select email_situacao::text from public.clientes where id = 'b1000000-0000-0000-0000-000000000003'),
  'spam', 'RN-24: e-mail marcado como spam fica sinalizado no cliente'
);

-- ---------------------------------------------------------------------------
-- Saúde da rotina e permissões
-- ---------------------------------------------------------------------------

-- 34
select ok(
  exists (select 1 from public.rotina_verificar_saude('2030-05-01 13:00:00+00') where problema = 'o planejamento de hoje não rodou'),
  'alerta quando o planejamento do dia não rodou'
);

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "0b000000-0000-0000-0000-00000000000b", "role": "authenticated"}', true);

-- 35 e 36
select throws_ok($$ select * from public.rotina_reservar_envios(10) $$, '42501', null,
  'o contador não mexe na fila de envio');
select throws_ok($$ select interno.planejar_lembretes() $$, '42501', null,
  'o contador não chama o planejamento da rotina');

select * from finish();
rollback;
