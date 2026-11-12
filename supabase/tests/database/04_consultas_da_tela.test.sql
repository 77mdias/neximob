-- Consultas e ações da tela (RF-03, RF-10 a RF-15, RF-18, RF-21, RF-22, RF-24, RF-43, RF-44)
-- Os meses são relativos ao mês corrente: dois meses atrás (tudo já venceu)
-- e daqui a dois meses (nada venceu ainda).
-- Rodar com: supabase test db

begin;
create extension if not exists pgtap with schema extensions;

select plan(34);

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
  ('0f000000-0000-0000-0000-00000000000f', 'contadora.f@example.com', '{"nome": "Escritório F"}'),
  ('0a000000-0000-0000-0000-00000000000a', 'contador.g@example.com', '{"nome": "Escritório G"}');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "0f000000-0000-0000-0000-00000000000f", "role": "authenticated"}', true);

insert into public.clientes (id, nome, tipo, honorario, dia_vencimento, cobranca_inicio, email, ativo) values
  ('f1000000-0000-0000-0000-000000000001', 'Ana Lima',   'MEI',     300,  5, testes.mes(-2), 'ana@example.com', true),
  ('f1000000-0000-0000-0000-000000000002', 'Bruno Reis', 'SIMPLES', 500, 20, testes.mes(-2), 'bruno@example.com', true),
  ('f1000000-0000-0000-0000-000000000003', 'Carla Dias', 'PF',      200, 12, testes.mes(-2), 'carla@example.com', true),
  ('f1000000-0000-0000-0000-000000000004', 'Davi Melo',  'MEI',     100,  8, testes.mes(-2), null, false);

-- Dois meses atrás: Ana e Carla em aberto (atrasadas), Bruno pago.
insert into public.cobrancas (id, cliente_id, mes, vencimento, valor) values
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', testes.mes(-2), testes.dia(-2, 5), 300),
  ('f2000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', testes.mes(-2), testes.dia(-2, 20), 500),
  ('f2000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000003', testes.mes(-2), testes.dia(-2, 12), 200);
update public.cobrancas set pago_em = testes.dia(-2, 18), forma = 'pix'
 where id = 'f2000000-0000-0000-0000-000000000002';

-- Daqui a dois meses: Ana e Bruno, ainda a vencer.
insert into public.cobrancas (id, cliente_id, mes, vencimento, valor) values
  ('f2000000-0000-0000-0000-000000000011', 'f1000000-0000-0000-0000-000000000001', testes.mes(2), testes.dia(2, 5), 300),
  ('f2000000-0000-0000-0000-000000000012', 'f1000000-0000-0000-0000-000000000002', testes.mes(2), testes.dia(2, 20), 500);

-- ---------------------------------------------------------------------------
-- Lista de cobranças (RF-10, RF-11, RF-18)
-- ---------------------------------------------------------------------------

-- 1 a 6
select is(
  (select array_agg(cliente_nome order by ordem)
     from (select cliente_nome, row_number() over () as ordem
             from public.cobrancas_do_mes(testes.mes(-2))) x),
  array['Ana Lima', 'Carla Dias', 'Bruno Reis'],
  'RF-11: atrasados primeiro (mais dias de atraso antes), pagos por último'
);
select is(
  (select array_agg(cliente_nome) from public.cobrancas_do_mes(testes.mes(-2), 'pagos')),
  array['Bruno Reis'], 'filtro Pagos'
);
select is(
  (select array_agg(cliente_nome order by cliente_nome) from public.cobrancas_do_mes(testes.mes(-2), 'em_atraso')),
  array['Ana Lima', 'Carla Dias'], 'filtro Em atraso'
);
select throws_ok(
  $$ select * from public.cobrancas_do_mes(testes.mes(-2), 'outro') $$,
  '22023', null, 'filtro inválido é recusado'
);
select ok(
  (select situacao = 'atrasado' and dias_atraso > 0
     from public.cobrancas_do_mes(testes.mes(-2)) where cliente_nome = 'Ana Lima'),
  'RF-10: cobrança vencida aparece como atrasada, com os dias de atraso'
);
select is(
  (select proximo_lembrete from public.cobrancas_do_mes(testes.mes(-2)) where cliente_nome = 'Ana Lima'),
  null::date, 'meses passados não mostram próximo lembrete'
);

-- 7 a 10
select is(
  (select array_agg(cliente_nome order by ordem)
     from (select cliente_nome, row_number() over () as ordem
             from public.cobrancas_do_mes(testes.mes(2), 'a_vencer')) x),
  array['Ana Lima', 'Bruno Reis'], 'a vencer: vencimento mais próximo primeiro'
);
select is(
  (select meses_em_aberto_anteriores from public.cobrancas_do_mes(testes.mes(2)) where cliente_nome = 'Ana Lima'),
  1, 'RN-18: mostra quantos meses anteriores estão em aberto'
);
select ok(
  (select proximo_lembrete is not null from public.cobrancas_do_mes(testes.mes(2)) where cliente_nome = 'Ana Lima'),
  'RF-15: cliente com cobrança em aberto tem próximo lembrete'
);
select is(
  (select array_agg(cliente_nome order by cliente_nome) from public.cobrancas_do_mes(testes.mes(2), 'em_atraso')),
  array['Ana Lima'], 'RN-18: quem tem pendência de meses anteriores entra no filtro Em atraso'
);

-- ---------------------------------------------------------------------------
-- Resumo do mês (RF-03)
-- ---------------------------------------------------------------------------

-- 11 a 14
select is(
  (select array[recebido, a_receber] from public.resumo_do_mes(testes.mes(-2))),
  array[500, 500]::numeric[], 'recebido e a receber do mês'
);
select is((select percentual_recebido from public.resumo_do_mes(testes.mes(-2))), 50, 'percentual recebido');
select is((select em_aberto_meses_anteriores from public.resumo_do_mes(testes.mes(2))), 500::numeric,
  'total em aberto de meses anteriores');
select is((select clientes_em_atraso from public.resumo_do_mes(testes.mes(2))), 2,
  'clientes com alguma cobrança atrasada');

-- ---------------------------------------------------------------------------
-- Obrigações (RF-20 a RF-22, RF-24, RN-23)
-- ---------------------------------------------------------------------------

-- 15 a 19
select is(
  (select array[total_clientes, feitos] from public.obrigacoes_do_mes(testes.mes(1)) where nome = 'DAS-MEI'),
  array[1, 0], 'DAS-MEI conta só os clientes MEI ativos'
);
select is((select prazo from public.obrigacoes_do_mes(testes.mes(1)) where nome = 'DAS-MEI'),
  testes.dia(1, 20), 'prazo mensal no dia 20');
select is((select competencia from public.obrigacoes_do_mes(testes.mes(1)) where nome = 'DAS-MEI'),
  public.rotulo_do_mes(testes.mes(0), extract(year from testes.mes(1))::int),
  'RN-23: competência do mês anterior ao prazo');
select is((select situacao_prazo from public.obrigacoes_do_mes(testes.mes(1)) where nome = 'DAS-MEI'),
  'a_vencer', 'RF-22: prazo à frente');
select is(
  (select array[competencia, periodo] from public.obrigacoes_do_mes(make_date(extract(year from testes.mes(0))::int + 1, 3, 1))
    where nome = 'DEFIS'),
  array[extract(year from testes.mes(0))::int::text, (extract(year from testes.mes(0))::int + 1)::text],
  'DEFIS: anual, em março, com a competência do ano anterior'
);

-- 20 a 25
select is(
  public.marcar_obrigacao((select id from public.obrigacoes where nome = 'DAS-MEI'),
                          'f1000000-0000-0000-0000-000000000001', testes.mes(1), true),
  true, 'RF-21: marca a guia de um cliente'
);
select is(
  (select array[situacao_prazo, feitos::text] from public.obrigacoes_do_mes(testes.mes(1)) where nome = 'DAS-MEI'),
  array['concluida', '1'], 'com todos feitos, a obrigação fica concluída'
);
select is(
  (select array_agg(nome || ':' || feito) from public.clientes_da_obrigacao(
     (select id from public.obrigacoes where nome = 'DAS-MEI'), testes.mes(1))),
  array['Ana Lima:true'], 'checklist mostra quem já foi feito'
);
select throws_ok(
  $$ select public.marcar_obrigacao((select id from public.obrigacoes where nome = 'DAS-MEI'),
                                    'f1000000-0000-0000-0000-000000000002', testes.mes(1), true) $$,
  '22023', null, 'não marca obrigação de outro tipo de cliente'
);
select is(
  public.marcar_obrigacao((select id from public.obrigacoes where nome = 'DAS-MEI'),
                          'f1000000-0000-0000-0000-000000000001', testes.mes(1), false),
  false, 'desmarca a guia'
);
select ok(
  exists (select 1 from public.proximos_prazos(public.hoje_brasilia(), 12) where nome = 'DEFIS'),
  'RF-24: próximos prazos do ano incluem as obrigações anuais'
);

-- ---------------------------------------------------------------------------
-- Ações sobre a cobrança (RF-12 a RF-14)
-- ---------------------------------------------------------------------------

-- 26 a 32
select is((select dias from public.mensagem_para_cobrar('f2000000-0000-0000-0000-000000000001')), 3::smallint,
  'RN-03: cobrança atrasada usa o passo "3 dias depois"');
select is((select dias from public.mensagem_para_cobrar('f2000000-0000-0000-0000-000000000012')), (-3)::smallint,
  'RN-03: cobrança a vencer usa o passo "3 dias antes"');
select throws_ok(
  $$ select * from public.mensagem_para_cobrar('f2000000-0000-0000-0000-000000000002') $$,
  '22023', null, 'cobrança paga não tem mensagem de cobrança'
);
select set_config('testes.envio_id',
  public.registrar_envio_manual('f2000000-0000-0000-0000-000000000001')::text, true);
select ok(
  (select count(*) = 1 from public.envio_cobrancas
    where envio_id = current_setting('testes.envio_id')::uuid
      and cobranca_id = 'f2000000-0000-0000-0000-000000000001'),
  'RF-14: envio manual registrado e ligado à cobrança'
);

select public.registrar_pagamento('f2000000-0000-0000-0000-000000000001', 'dinheiro', testes.dia(-2, 6));
select is(
  (select situacao::text from public.cobrancas_situacao where id = 'f2000000-0000-0000-0000-000000000001'),
  'pago', 'RF-12: baixa manual'
);
select is(
  public.ajustar_valor_do_mes('f2000000-0000-0000-0000-000000000003', 80, 'Declaração extra'),
  280.00::numeric, 'RF-13: valor do mês = honorário + extra'
);
select public.ajustar_valor_do_mes('f2000000-0000-0000-0000-000000000003', 0);
select is(
  (select motivo_extra from public.cobrancas where id = 'f2000000-0000-0000-0000-000000000003'),
  null::text, 'extra zero desfaz o ajuste e limpa o motivo'
);

-- ---------------------------------------------------------------------------
-- Conta (RF-43, RF-44) e isolamento
-- ---------------------------------------------------------------------------

-- 33
select public.aceitar_termos('2026-11');
select ok(
  (select termos_versao from public.contadores) = '2026-11'
  and jsonb_array_length(public.exportar_meus_dados() -> 'clientes') = 4,
  'RF-43 e RF-44: aceite dos termos registrado e exportação com todos os clientes'
);

select set_config('request.jwt.claims',
  '{"sub": "0a000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

-- 34
select is_empty($$ select * from public.cobrancas_do_mes(testes.mes(-2)) $$,
  'outro contador não vê as cobranças de F pelas consultas da tela');

select * from finish();
rollback;
