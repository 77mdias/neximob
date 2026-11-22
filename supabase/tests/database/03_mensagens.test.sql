-- Mensagens de cobrança (RF-14, RF-31 a RF-33, RN-05, RN-11, RN-19)
-- Rodar com: supabase test db

begin;
create extension if not exists pgtap with schema extensions;

select plan(30);

-- ---------------------------------------------------------------------------
-- Formatação
-- ---------------------------------------------------------------------------

-- 1 a 10
select is(public.formatar_reais(1234.5), 'R$ 1.234,50', 'valor com milhar e centavos');
select is(public.formatar_reais(0.5), 'R$ 0,50', 'valor menor que um real');
select is(public.formatar_reais(1234567.89), 'R$ 1.234.567,89', 'valor na casa do milhão');
select is(public.nome_do_mes('2026-03-15'), 'março', 'nome do mês por extenso');
select is(public.rotulo_do_mes('2025-12-01', 2026), 'dezembro de 2025', 'mês de outro ano leva o ano');
select is(public.primeiro_nome('  Maria   Souza '), 'Maria', 'RN-05: só o primeiro nome');
select is(public.juntar_lista(array['a', 'b', 'c']), 'a, b e c', 'lista com três itens');
select is(public.juntar_lista(array['a', 'b']), 'a e b', 'lista com dois itens');
select is(public.campos_desconhecidos('{nome} {nomee} {pix} {x}'), array['{nomee}', '{x}'],
  'RF-32: aponta campos desconhecidos');
select is(public.campos_desconhecidos('Olá, {nome}! {mes} {valor} {venc} {pix}'), '{}'::text[],
  'RF-32: texto só com campos conhecidos');

-- 11 e 12
select is(
  public.aplicar_campos('Olá, {nome}! {mes}, {valor}, vence {venc}. Pix: {pix}', 'Ana Lima', '2026-11-01', 1500, '2026-11-10', 'ana@pix.com'),
  'Olá, Ana! novembro, R$ 1.500,00, vence 10/11. Pix: ana@pix.com',
  'RN-11: troca todos os campos'
);
select ok(
  public.aplicar_campos('Chave: {pix}', 'Ana', '2026-11-01', 1, '2026-11-10', null) = 'Chave: (chave Pix não cadastrada)',
  'sem chave Pix, a mensagem avisa em vez de ficar vazia'
);

-- ---------------------------------------------------------------------------
-- Conta nova e textos padrão
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'contadora.e@example.com', '{"nome": "Escritório E"}');

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "role": "authenticated"}', true);

update public.contadores set chave_pix = 'pix@example.com';

-- 13 e 14
select is((select count(*)::int from public.regua where texto = public.texto_padrao_regua(dias)), 4,
  'a régua nasce com os textos padrão');
select is((select texto_pendencia from public.contadores), public.texto_padrao_pendencia(),
  'o texto de pendência nasce com o padrão');

insert into public.clientes (id, nome, tipo, honorario, dia_vencimento, cobranca_inicio, email)
values ('e1000000-0000-0000-0000-000000000001', 'Maria Souza', 'MEI', 300, 10, '2029-12-01', 'maria@example.com');

insert into public.cobrancas (id, cliente_id, mes, vencimento, valor) values
  ('e2000000-0000-0000-0000-000000000012', 'e1000000-0000-0000-0000-000000000001', '2029-12-01', '2029-12-10', 300),
  ('e2000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', '2030-01-01', '2030-01-10', 300),
  ('e2000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', '2030-02-01', '2030-02-10', 300),
  ('e2000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000001', '2030-03-01', '2030-03-10', 300);
update public.cobrancas set extra = 50, motivo_extra = 'Declaração'
 where id = 'e2000000-0000-0000-0000-000000000002';

-- ---------------------------------------------------------------------------
-- Mensagem de um passo, com pendências (RN-19)
-- ---------------------------------------------------------------------------

-- 15 a 18
select is(
  (select texto from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'passo',
     (select id from public.regua where dias = -3))),
  E'Olá, Maria! Passando para lembrar que o honorário de março, no valor de R$ 300,00, vence em 10/03. Para pagar por Pix, use a chave pix@example.com. Obrigado!\n\nTambém estão em aberto: dezembro de 2029 (R$ 300,00), janeiro (R$ 300,00) e fevereiro (R$ 350,00). Total em aberto: R$ 1.250,00.',
  'mensagem do passo traz o mês e as pendências, com o total em aberto'
);
select is(
  (select assunto from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'passo',
     (select id from public.regua where dias = -3))),
  'Lembrete: honorário de março', 'assunto dos passos antes e no dia do vencimento'
);
select is(
  (select assunto from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'passo',
     (select id from public.regua where dias = 3))),
  'Honorário de março em aberto', 'assunto dos passos depois do vencimento'
);
select is(
  (select cobrancas from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'passo',
     (select id from public.regua where dias = 0))),
  array['e2000000-0000-0000-0000-000000000003', 'e2000000-0000-0000-0000-000000000012',
        'e2000000-0000-0000-0000-000000000001', 'e2000000-0000-0000-0000-000000000002']::uuid[],
  'a mensagem lista a cobrança do mês e as pendências, para o registro do envio'
);

-- ---------------------------------------------------------------------------
-- Mensagem de pendência (mês pago, meses anteriores em aberto)
-- ---------------------------------------------------------------------------

update public.cobrancas set pago_em = '2030-03-08', forma = 'pix'
 where id = 'e2000000-0000-0000-0000-000000000003';

-- 19 e 20
select is(
  (select texto from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'pendencia')),
  E'Olá, Maria! Passando para lembrar que há honorários em aberto, listados logo abaixo. Para pagar por Pix, use a chave pix@example.com. Se já pagou, pode me enviar o comprovante?\n\nEm aberto: dezembro de 2029 (R$ 300,00), janeiro (R$ 300,00) e fevereiro (R$ 350,00). Total: R$ 950,00.',
  'mensagem de pendência usa o texto de pendência e lista os meses em aberto'
);
select is(
  (select assunto from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'pendencia')),
  'Honorários em aberto', 'assunto da mensagem de pendência'
);

update public.cobrancas set pago_em = '2030-01-15', forma = 'pix'
 where id in ('e2000000-0000-0000-0000-000000000012', 'e2000000-0000-0000-0000-000000000001');

-- 21
select is(
  public.bloco_pendencias('e1000000-0000-0000-0000-000000000001', '2030-03-01', 300),
  'Também está em aberto: fevereiro (R$ 350,00). Total em aberto: R$ 650,00.',
  'uma pendência só: texto no singular'
);

update public.cobrancas set pago_em = '2030-02-15', forma = 'pix'
 where id = 'e2000000-0000-0000-0000-000000000002';

-- 22 e 23
select throws_ok(
  $$ select * from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'pendencia') $$,
  'P0002', null, 'sem pendências, não há mensagem de pendência'
);
select throws_ok(
  $$ select * from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'outro') $$,
  '22023', null, 'tipo de mensagem inválido é recusado'
);

-- ---------------------------------------------------------------------------
-- Prévia e textos padrão (RF-31, RF-33)
-- ---------------------------------------------------------------------------

-- 24 e 25
select is(public.previa_mensagem('Olá, {nome}! {valor} {pix}'), 'Olá, Maria! R$ 300,00 pix@example.com',
  'RF-33: prévia com cliente de exemplo e a chave Pix do contador');
select ok(public.previa_mensagem('Olá, {nome}!', 'pendencia') like E'Olá, Maria!\n\nEm aberto: % e %. Total: R$ 600,00.',
  'prévia do texto de pendência traz um bloco de exemplo');

update public.regua set texto = 'Texto editado' where dias = 0;
update public.contadores set texto_pendencia = 'Texto editado';

-- 26 a 28
select is(public.restaurar_texto_padrao((select id from public.regua where dias = 0)), public.texto_padrao_regua(0),
  'RF-31: restaura o texto padrão de um passo');
select is(public.restaurar_texto_pendencia(), public.texto_padrao_pendencia(),
  'restaura o texto de pendência padrão');
select is(public.texto_padrao_regua(7) like '%{valor}%{venc}%{pix}%', true,
  'os textos padrão usam os campos da mensagem');

-- ---------------------------------------------------------------------------
-- Isolamento
-- ---------------------------------------------------------------------------

reset role;
insert into auth.users (id, email) values ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'outro@example.com');
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "ffffffff-ffff-ffff-ffff-ffffffffffff", "role": "authenticated"}', true);

-- 29
select throws_ok(
  $$ select * from public.montar_mensagem('e1000000-0000-0000-0000-000000000001', '2030-03-01', 'passo') $$,
  'P0002', null, 'outro contador não monta mensagem para cliente que não é dele'
);

reset role;
set local role anon;

-- 30
select throws_ok(
  $$ select public.previa_mensagem('x') $$,
  '42501', null, 'visitante sem login não usa as funções de mensagem'
);

select * from finish();
rollback;
