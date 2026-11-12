-- Neximob: mensagens de cobrança (RF-14, RF-31 a RF-33, RN-05, RN-11, RN-19)
--
-- Uma única função monta o texto das mensagens. A prévia da régua (RF-33), o
-- botão Cobrar (RF-14) e a rotina diária (ADR-0005) usam a mesma regra.

-- ---------------------------------------------------------------------------
-- Formatação (RF-32, Q-11)
-- ---------------------------------------------------------------------------

-- "R$ 1.234,56"
create or replace function public.formatar_reais(p_valor numeric)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'R$ ' || translate(to_char(p_valor, 'FM9,999,999,990.00'), ',.', '.,')
$$;

-- "novembro"
create or replace function public.nome_do_mes(p_data date)
returns text
language sql
immutable
set search_path = ''
as $$
  select (array['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
                'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'])[extract(month from p_data)::int]
$$;

-- "outubro", ou "dezembro de 2025" quando o ano é diferente do ano de referência.
create or replace function public.rotulo_do_mes(p_mes date, p_ano_referencia int)
returns text
language sql
immutable
set search_path = ''
as $$
  select public.nome_do_mes(p_mes)
         || case when extract(year from p_mes)::int <> p_ano_referencia
                 then ' de ' || extract(year from p_mes)::int
                 else '' end
$$;

-- RN-05: só o primeiro nome.
create or replace function public.primeiro_nome(p_nome text)
returns text
language sql
immutable
set search_path = ''
as $$
  select split_part(btrim(regexp_replace(coalesce(p_nome, ''), '\s+', ' ', 'g')), ' ', 1)
$$;

-- "a", "a e b", "a, b e c"
create or replace function public.juntar_lista(p_itens text[])
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(cardinality(p_itens), 0) = 0 then ''
    when cardinality(p_itens) = 1 then p_itens[1]
    else array_to_string(p_itens[1:cardinality(p_itens) - 1], ', ') || ' e ' || p_itens[cardinality(p_itens)]
  end
$$;

-- ---------------------------------------------------------------------------
-- Textos padrão (RF-31). O protótipo é a referência: se os textos dele forem
-- diferentes, substituir aqui.
-- ---------------------------------------------------------------------------

create or replace function public.nome_padrao_do_passo(p_dias int)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_dias
    when -3 then '3 dias antes'
    when 0 then 'No dia'
    when 3 then '3 dias depois'
    when 7 then '7 dias depois'
  end
$$;

create or replace function public.texto_padrao_regua(p_dias int)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_dias
    when -3 then 'Olá, {nome}! Passando para lembrar que o honorário de {mes}, no valor de {valor}, vence em {venc}. Para pagar por Pix, use a chave {pix}. Obrigado!'
    when 0 then 'Olá, {nome}! Lembrete: o honorário de {mes}, no valor de {valor}, vence em {venc}. Chave Pix: {pix}. Se já pagou, pode desconsiderar esta mensagem.'
    when 3 then 'Olá, {nome}! Ainda não identifiquei o pagamento do honorário de {mes}, no valor de {valor}, que venceu em {venc}. Se já pagou, pode me enviar o comprovante? Chave Pix: {pix}.'
    when 7 then 'Olá, {nome}! O honorário de {mes}, no valor de {valor}, está em aberto desde {venc}. Podemos combinar o pagamento? Chave Pix: {pix}.'
  end
$$;

create or replace function public.texto_padrao_pendencia()
returns text
language sql
immutable
set search_path = ''
as $$
  select 'Olá, {nome}! Passando para lembrar que há honorários em aberto, listados logo abaixo. Para pagar por Pix, use a chave {pix}. Se já pagou, pode me enviar o comprovante?'::text
$$;

alter table public.contadores
  alter column texto_pendencia set default public.texto_padrao_pendencia();

-- ---------------------------------------------------------------------------
-- Montagem
-- ---------------------------------------------------------------------------

-- Troca os campos {nome}, {mes}, {valor}, {venc} e {pix} (RN-11).
create or replace function public.aplicar_campos(
  p_texto text,
  p_nome text,
  p_mes date,
  p_valor numeric,
  p_vencimento date,
  p_pix text
)
returns text
language sql
immutable
set search_path = ''
as $$
  select
    replace(replace(replace(replace(replace(coalesce(p_texto, ''),
      '{nome}', public.primeiro_nome(p_nome)),
      '{mes}', coalesce(public.nome_do_mes(p_mes), '')),
      '{valor}', coalesce(public.formatar_reais(p_valor), '')),
      '{venc}', coalesce(to_char(p_vencimento, 'DD/MM'), '')),
      '{pix}', coalesce(nullif(btrim(p_pix), ''), '(chave Pix não cadastrada)'))
$$;

-- RF-32 (proposto): campos que o sistema não conhece, para avisar na edição.
create or replace function public.campos_desconhecidos(p_texto text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(distinct m[1] order by m[1]), '{}'::text[])
    from regexp_matches(coalesce(p_texto, ''), '(\{[^{}]*\})', 'g') as m
   where m[1] not in ('{nome}', '{mes}', '{valor}', '{venc}', '{pix}')
$$;

-- RN-19: bloco com as cobranças de meses anteriores ao ciclo ainda em aberto.
-- Com p_total_do_mes: "Também está em aberto: ... Total em aberto: ..."
-- Sem p_total_do_mes (só pendências): "Em aberto: ... Total: ..."
-- Devolve null quando não há pendências.
create or replace function public.bloco_pendencias(p_cliente_id uuid, p_ciclo date, p_total_do_mes numeric)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  with pendentes as (
    select c.mes, c.valor + c.extra as total
      from public.cobrancas c
     where c.cliente_id = p_cliente_id
       and c.mes < date_trunc('month', p_ciclo::timestamp)::date
       and c.pago_em is null
  ),
  resumo as (
    select array_agg(public.rotulo_do_mes(mes, extract(year from p_ciclo)::int)
                     || ' (' || public.formatar_reais(total) || ')' order by mes) as itens,
           sum(total) as soma,
           count(*) as quantidade
      from pendentes
  )
  select case
    when r.quantidade = 0 then null
    when p_total_do_mes is null then
      'Em aberto: ' || public.juntar_lista(r.itens) || '. Total: ' || public.formatar_reais(r.soma) || '.'
    else
      case when r.quantidade = 1 then 'Também está em aberto: ' else 'Também estão em aberto: ' end
      || public.juntar_lista(r.itens) || '. Total em aberto: '
      || public.formatar_reais(r.soma + p_total_do_mes) || '.'
  end
  from resumo r
$$;

-- Monta a mensagem de um cliente para o mês (ciclo) informado.
--   p_tipo = 'passo':     texto do passo da régua + bloco de pendências, se houver
--   p_tipo = 'pendencia': texto de pendência do contador + bloco de pendências
-- Devolve também as cobranças lembradas, para o registro do envio (RF-35).
-- Roda com a permissão de quem chama (RLS na tela; tudo na rotina diária).
create or replace function public.montar_mensagem(
  p_cliente_id uuid,
  p_mes date,
  p_tipo text,
  p_regua_id uuid default null
)
returns table (assunto text, texto text, cobrancas uuid[])
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_cliente public.clientes%rowtype;
  v_contador public.contadores%rowtype;
  v_cobranca public.cobrancas%rowtype;
  v_regua public.regua%rowtype;
  v_mes date := date_trunc('month', p_mes::timestamp)::date;
  v_valor numeric;
  v_vencimento date;
  v_bloco text;
  v_pendentes uuid[];
begin
  if p_tipo is null or p_tipo not in ('passo', 'pendencia') then
    raise exception 'tipo de mensagem inválido: %', p_tipo using errcode = '22023';
  end if;

  select * into v_cliente from public.clientes where id = p_cliente_id;
  if not found then
    raise exception 'cliente não encontrado' using errcode = 'P0002';
  end if;

  select * into v_contador from public.contadores where id = v_cliente.contador_id;

  select * into v_cobranca
    from public.cobrancas
   where contador_id = v_cliente.contador_id and cliente_id = p_cliente_id and mes = v_mes;

  v_valor := coalesce(v_cobranca.valor + v_cobranca.extra, v_cliente.honorario);
  v_vencimento := coalesce(
    v_cobranca.vencimento,
    make_date(extract(year from v_mes)::int, extract(month from v_mes)::int, v_cliente.dia_vencimento)
  );

  select coalesce(array_agg(c.id order by c.mes), '{}'::uuid[]) into v_pendentes
    from public.cobrancas c
   where c.cliente_id = p_cliente_id and c.mes < v_mes and c.pago_em is null;

  if p_tipo = 'passo' then
    select * into v_regua
      from public.regua
     where id = p_regua_id and contador_id = v_cliente.contador_id;
    if not found then
      raise exception 'passo da régua não encontrado' using errcode = 'P0002';
    end if;

    v_bloco := public.bloco_pendencias(p_cliente_id, v_mes, v_valor);
    assunto := case
      when v_regua.dias <= 0 then 'Lembrete: honorário de ' || public.nome_do_mes(v_mes)
      else 'Honorário de ' || public.nome_do_mes(v_mes) || ' em aberto'
    end;
    texto := public.aplicar_campos(v_regua.texto, v_cliente.nome, v_mes, v_valor, v_vencimento, v_contador.chave_pix)
             || coalesce(E'\n\n' || v_bloco, '');
    cobrancas := (case when v_cobranca.id is not null then array[v_cobranca.id] else '{}'::uuid[] end)
                 || v_pendentes;
  else
    v_bloco := public.bloco_pendencias(p_cliente_id, v_mes, null);
    if v_bloco is null then
      raise exception 'o cliente não tem pendências de meses anteriores' using errcode = 'P0002';
    end if;
    assunto := 'Honorários em aberto';
    texto := public.aplicar_campos(v_contador.texto_pendencia, v_cliente.nome, v_mes, v_valor, v_vencimento, v_contador.chave_pix)
             || E'\n\n' || v_bloco;
    cobrancas := v_pendentes;
  end if;

  return next;
end;
$$;

-- RF-33: prévia com um cliente de exemplo e a chave Pix do contador logado.
create or replace function public.previa_mensagem(p_texto text, p_tipo text default 'passo')
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  with exemplo as (
    select date_trunc('month', public.hoje_brasilia()::timestamp)::date as mes,
           (select c.chave_pix from public.contadores c where c.id = (select auth.uid())) as pix
  )
  select public.aplicar_campos(p_texto, 'Maria Souza', e.mes, 300.00,
                               e.mes + 9, e.pix)
         || case when p_tipo = 'pendencia' then
              E'\n\nEm aberto: '
              || public.juntar_lista(array[
                   public.nome_do_mes((e.mes - interval '2 months')::date) || ' (R$ 300,00)',
                   public.nome_do_mes((e.mes - interval '1 month')::date) || ' (R$ 300,00)'])
              || '. Total: R$ 600,00.'
            else '' end
    from exemplo e
$$;

-- RF-31 (proposto): volta o texto de um passo ao padrão.
create or replace function public.restaurar_texto_padrao(p_regua_id uuid)
returns text
language sql
volatile
security invoker
set search_path = ''
as $$
  update public.regua r
     set texto = public.texto_padrao_regua(r.dias)
   where r.id = p_regua_id
  returning r.texto
$$;

-- Volta o texto de pendência do contador logado ao padrão.
create or replace function public.restaurar_texto_pendencia()
returns text
language sql
volatile
security invoker
set search_path = ''
as $$
  update public.contadores c
     set texto_pendencia = public.texto_padrao_pendencia()
   where c.id = (select auth.uid())
  returning c.texto_pendencia
$$;

-- ---------------------------------------------------------------------------
-- Conta nova passa a usar os textos padrão acima (substitui a versão anterior)
-- ---------------------------------------------------------------------------

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
  insert into public.regua (contador_id, dias, nome, ativo, texto)
  select new.id, d.dias, public.nome_padrao_do_passo(d.dias), d.dias <> 7, public.texto_padrao_regua(d.dias)
    from unnest(array[-3, 0, 3, 7]) as d(dias);

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

-- ---------------------------------------------------------------------------
-- Permissões: funções que leem dados só para quem está logado e para o sistema
-- ---------------------------------------------------------------------------

revoke execute on function public.bloco_pendencias(uuid, date, numeric) from public, anon;
revoke execute on function public.montar_mensagem(uuid, date, text, uuid) from public, anon;
revoke execute on function public.previa_mensagem(text, text) from public, anon;
revoke execute on function public.restaurar_texto_padrao(uuid) from public, anon;
revoke execute on function public.restaurar_texto_pendencia() from public, anon;

grant execute on function public.bloco_pendencias(uuid, date, numeric) to authenticated, service_role;
grant execute on function public.montar_mensagem(uuid, date, text, uuid) to authenticated, service_role;
grant execute on function public.previa_mensagem(text, text) to authenticated, service_role;
grant execute on function public.restaurar_texto_padrao(uuid) to authenticated, service_role;
grant execute on function public.restaurar_texto_pendencia() to authenticated, service_role;
