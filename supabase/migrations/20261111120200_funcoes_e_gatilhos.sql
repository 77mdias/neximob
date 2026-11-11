-- Neximob: funções e gatilhos (F2)
--
-- As regras de negócio que precisam valer para qualquer cliente do banco
-- (tela, rotina diária, testes) ficam aqui, num lugar só.

-- ---------------------------------------------------------------------------
-- Datas
-- ---------------------------------------------------------------------------

-- "Hoje" no fuso de Brasília (RNF-08).
create or replace function public.hoje_brasilia()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- RN-02: situação da cobrança a partir do vencimento, do pagamento e de hoje.
-- Recebe "hoje" como parâmetro para poder ser testada com qualquer data.
create or replace function public.status_cobranca(p_vencimento date, p_pago_em date, p_hoje date)
returns public.situacao_cobranca
language sql
immutable
set search_path = ''
as $$
  select case
    when p_pago_em is not null   then 'pago'::public.situacao_cobranca
    when p_hoje < p_vencimento   then 'a_vencer'::public.situacao_cobranca
    when p_hoje = p_vencimento   then 'vence_hoje'::public.situacao_cobranca
    else 'atrasado'::public.situacao_cobranca
  end
$$;

-- ---------------------------------------------------------------------------
-- Cobranças com situação calculada (RF-10). Respeita a RLS de quem consulta.
-- ---------------------------------------------------------------------------

create view public.cobrancas_situacao
with (security_invoker = true)
as
select
  c.id,
  c.contador_id,
  c.cliente_id,
  c.mes,
  c.vencimento,
  c.valor,
  c.extra,
  c.valor + c.extra as total,
  c.motivo_extra,
  c.pago_em,
  c.forma,
  public.status_cobranca(c.vencimento, c.pago_em, public.hoje_brasilia()) as situacao,
  case
    when c.pago_em is null and public.hoje_brasilia() > c.vencimento
      then public.hoje_brasilia() - c.vencimento
    else 0
  end as dias_atraso
from public.cobrancas c;

revoke all on public.cobrancas_situacao from anon, authenticated;
grant select on public.cobrancas_situacao to authenticated;

-- ---------------------------------------------------------------------------
-- RF-02: garante a cobrança do mês para cada cliente ativo
-- ---------------------------------------------------------------------------

-- Cria as cobranças que faltam no mês informado, para os clientes ativos que
-- já começaram a ser cobrados (RN-21). Não duplica (uma por cliente e mês).
-- Roda com a permissão de quem chama: pela tela, só alcança os clientes do
-- contador logado; pela rotina diária (ADR-0005), alcança todos.
create or replace function public.garantir_cobrancas(p_mes date)
returns integer
language sql
security invoker
set search_path = ''
as $$
  with novas as (
    insert into public.cobrancas (contador_id, cliente_id, mes, vencimento, valor)
    select
      cl.contador_id,
      cl.id,
      date_trunc('month', p_mes::timestamp)::date,
      make_date(
        extract(year from p_mes)::int,
        extract(month from p_mes)::int,
        cl.dia_vencimento
      ),
      cl.honorario
    from public.clientes cl
    where cl.ativo
      and cl.cobranca_inicio <= date_trunc('month', p_mes::timestamp)::date
    on conflict (contador_id, cliente_id, mes) do nothing
    returning 1
  )
  select count(*)::integer from novas
$$;

revoke execute on function public.garantir_cobrancas(date) from public, anon;
grant execute on function public.garantir_cobrancas(date) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- RN-14: mudança de honorário ou de dia de vencimento vale para as cobranças
-- não pagas do mês corrente em diante. Cobranças pagas e antigas não mudam.
-- ---------------------------------------------------------------------------

create or replace function public.aplicar_mudancas_do_cliente()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.cobrancas c
     set valor = new.honorario,
         vencimento = make_date(
           extract(year from c.mes)::int,
           extract(month from c.mes)::int,
           new.dia_vencimento
         )
   where c.cliente_id = new.id
     and c.contador_id = new.contador_id
     and c.pago_em is null
     and c.mes >= date_trunc('month', public.hoje_brasilia()::timestamp)::date;
  return null;
end;
$$;

create trigger clientes_honorario_ou_vencimento_alterado
after update of honorario, dia_vencimento on public.clientes
for each row
when (old.honorario is distinct from new.honorario
      or old.dia_vencimento is distinct from new.dia_vencimento)
execute function public.aplicar_mudancas_do_cliente();

-- ---------------------------------------------------------------------------
-- RN-24 (proposto): ao corrigir o e-mail, a situação volta para "ok"
-- ---------------------------------------------------------------------------

create or replace function public.reiniciar_situacao_do_email()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.email is distinct from old.email then
    new.email_situacao := 'ok';
  end if;
  return new;
end;
$$;

create trigger clientes_email_alterado
before update of email on public.clientes
for each row
execute function public.reiniciar_situacao_do_email();

-- ---------------------------------------------------------------------------
-- RF-42: conta nova recebe o perfil, a régua padrão e o calendário padrão
-- ---------------------------------------------------------------------------

-- Textos iniciais dos lembretes por e-mail. O protótipo é a referência de
-- textos: se os dele forem diferentes, substituir aqui.
create or replace function public.criar_conta_do_contador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ano_padrao smallint;
begin
  insert into public.contadores (id, nome, email)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    new.email
  );

  -- RN-08: 3 dias antes, no dia e 3 dias depois ligados; 7 dias depois desligado.
  insert into public.regua (contador_id, dias, nome, ativo, texto) values
    (new.id, -3, '3 dias antes', true,
     'Olá, {nome}! Passando para lembrar que o honorário de {mes}, no valor de {valor}, vence em {venc}. Para pagar por Pix, use a chave {pix}. Obrigado!'),
    (new.id, 0, 'No dia', true,
     'Olá, {nome}! Lembrete: o honorário de {mes}, no valor de {valor}, vence em {venc}. Chave Pix: {pix}. Se já pagou, pode desconsiderar esta mensagem.'),
    (new.id, 3, '3 dias depois', true,
     'Olá, {nome}! Ainda não identifiquei o pagamento do honorário de {mes}, no valor de {valor}, que venceu em {venc}. Se já pagou, pode me enviar o comprovante? Chave Pix: {pix}.'),
    (new.id, 7, '7 dias depois', false,
     'Olá, {nome}! O honorário de {mes}, no valor de {valor}, está em aberto desde {venc}. Podemos combinar o pagamento? Chave Pix: {pix}.');

  -- Q-08: copia o calendário padrão mais recente até o ano corrente.
  select max(p.ano) into v_ano_padrao
    from public.obrigacoes_padrao p
   where p.ano <= extract(year from public.hoje_brasilia());

  insert into public.obrigacoes
    (contador_id, padrao_id, nome, tipos_cliente, periodicidade, prazo_dia, prazo_mes, competencia)
  select new.id, p.id, p.nome, p.tipos_cliente, p.periodicidade, p.prazo_dia, p.prazo_mes, p.competencia
    from public.obrigacoes_padrao p
   where p.ano = v_ano_padrao;

  return new;
end;
$$;

revoke execute on function public.criar_conta_do_contador() from public, anon, authenticated;

create trigger ao_criar_usuario
after insert on auth.users
for each row
execute function public.criar_conta_do_contador();

-- Mantém o e-mail do perfil igual ao do login.
create or replace function public.sincronizar_email_do_contador()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.contadores set email = new.email where id = new.id;
  return null;
end;
$$;

revoke execute on function public.sincronizar_email_do_contador() from public, anon, authenticated;

create trigger ao_alterar_email_do_usuario
after update of email on auth.users
for each row
when (old.email is distinct from new.email)
execute function public.sincronizar_email_do_contador();
