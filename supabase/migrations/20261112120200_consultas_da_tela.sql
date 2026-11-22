-- Neximob: consultas e ações da tela (F2)
--
-- Tudo roda com a permissão de quem chama (security invoker): a RLS garante
-- que o contador só alcança os próprios dados. O contrato para o front está
-- em docs/API.md.

-- ---------------------------------------------------------------------------
-- Auxiliares de data das obrigações
-- ---------------------------------------------------------------------------

create or replace function public.ultimo_dia_do_mes(p_data date)
returns int
language sql
immutable
set search_path = ''
as $$
  select extract(day from (date_trunc('month', p_data::timestamp) + interval '1 month - 1 day'))::int
$$;

-- Prazo da obrigação no mês informado, ou null se ela não vence nesse mês.
-- Dia maior que o último dia do mês vira o último dia (ex.: 31 em abril → 30).
create or replace function public.prazo_no_mes(
  p_periodicidade public.periodicidade,
  p_prazo_dia smallint,
  p_prazo_mes smallint,
  p_mes date
)
returns date
language sql
immutable
set search_path = ''
as $$
  select case
    when p_periodicidade = 'mensal' or p_prazo_mes = extract(month from p_mes)::int then
      make_date(extract(year from p_mes)::int, extract(month from p_mes)::int,
                least(p_prazo_dia::int, public.ultimo_dia_do_mes(p_mes)))
  end
$$;

-- RN-06: período da marcação. Mensal: AAAA-MM. Anual: AAAA.
create or replace function public.periodo_da_obrigacao(p_periodicidade public.periodicidade, p_mes date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case p_periodicidade
    when 'mensal' then to_char(p_mes, 'YYYY-MM')
    else to_char(p_mes, 'YYYY')
  end
$$;

-- RN-23: competência mostrada ao lado do vencimento.
create or replace function public.rotulo_competencia(
  p_periodicidade public.periodicidade,
  p_competencia public.competencia,
  p_prazo date
)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when p_periodicidade = 'mensal' and p_competencia = 'periodo_anterior' then
      public.rotulo_do_mes((p_prazo - interval '1 month')::date, extract(year from p_prazo)::int)
    when p_periodicidade = 'mensal' then
      public.nome_do_mes(p_prazo)
    when p_competencia = 'periodo_anterior' then
      (extract(year from p_prazo)::int - 1)::text
    else
      extract(year from p_prazo)::int::text
  end
$$;

-- ---------------------------------------------------------------------------
-- Obrigações (RF-20 a RF-22, RF-24)
-- ---------------------------------------------------------------------------

-- Obrigações que vencem no mês, com "X de Y feitos" e a situação do prazo.
create or replace function public.obrigacoes_do_mes(p_mes date)
returns table (
  obrigacao_id uuid,
  nome text,
  periodicidade public.periodicidade,
  prazo date,
  periodo text,
  competencia text,
  total_clientes int,
  feitos int,
  situacao_prazo text,
  dias_para_o_prazo int
)
language sql
stable
security invoker
set search_path = ''
as $$
  with do_mes as (
    select o.id, o.contador_id, o.nome, o.periodicidade, o.tipos_cliente, o.competencia,
           public.prazo_no_mes(o.periodicidade, o.prazo_dia, o.prazo_mes, p_mes) as prazo,
           public.periodo_da_obrigacao(o.periodicidade, p_mes) as periodo
      from public.obrigacoes o
     where o.ativo
  ),
  contagem as (
    select d.id,
           (select count(*)
              from public.clientes cl
             where cl.contador_id = d.contador_id
               and cl.ativo
               and cl.tipo = any (d.tipos_cliente)
               and cl.criado_em < ((date_trunc('month', p_mes::timestamp) + interval '1 month')
                                   at time zone 'America/Sao_Paulo')) as total,
           (select count(*)
              from public.obrigacoes_feitas f
              join public.clientes cl on cl.id = f.cliente_id
             where f.obrigacao_id = d.id
               and f.periodo = d.periodo
               and cl.ativo
               and cl.tipo = any (d.tipos_cliente)) as feitos
      from do_mes d
     where d.prazo is not null
  )
  select d.id,
         d.nome,
         d.periodicidade,
         d.prazo,
         d.periodo,
         public.rotulo_competencia(d.periodicidade, d.competencia, d.prazo),
         c.total::int,
         c.feitos::int,
         case
           when c.total = 0 then 'sem_clientes'
           when c.feitos >= c.total then 'concluida'
           when public.hoje_brasilia() > d.prazo then 'vencida'
           when public.hoje_brasilia() = d.prazo then 'vence_hoje'
           else 'a_vencer'
         end,
         (d.prazo - public.hoje_brasilia())::int
    from do_mes d
    join contagem c on c.id = d.id
   order by d.prazo, d.nome
$$;

-- Checklist de uma obrigação no mês: clientes do tipo e quem já foi feito.
create or replace function public.clientes_da_obrigacao(p_obrigacao_id uuid, p_mes date)
returns table (cliente_id uuid, nome text, tipo public.tipo_cliente, feito boolean, feito_em timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select cl.id, cl.nome, cl.tipo, f.id is not null, f.feito_em
    from public.obrigacoes o
    join public.clientes cl
      on cl.contador_id = o.contador_id
     and cl.ativo
     and cl.tipo = any (o.tipos_cliente)
    left join public.obrigacoes_feitas f
      on f.obrigacao_id = o.id
     and f.cliente_id = cl.id
     and f.periodo = public.periodo_da_obrigacao(o.periodicidade, p_mes)
   where o.id = p_obrigacao_id
   order by cl.nome
$$;

-- RF-21: marca ou desmarca a obrigação de um cliente no mês.
create or replace function public.marcar_obrigacao(
  p_obrigacao_id uuid,
  p_cliente_id uuid,
  p_mes date,
  p_feito boolean default true
)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_obrigacao public.obrigacoes%rowtype;
  v_tipo public.tipo_cliente;
  v_periodo text;
begin
  select * into v_obrigacao from public.obrigacoes where id = p_obrigacao_id;
  if not found then
    raise exception 'obrigação não encontrada' using errcode = 'P0002';
  end if;

  select tipo into v_tipo from public.clientes where id = p_cliente_id;
  if not found then
    raise exception 'cliente não encontrado' using errcode = 'P0002';
  end if;
  if not (v_tipo = any (v_obrigacao.tipos_cliente)) then
    raise exception 'esta obrigação não se aplica a esse tipo de cliente' using errcode = '22023';
  end if;

  v_periodo := public.periodo_da_obrigacao(v_obrigacao.periodicidade, p_mes);

  if p_feito then
    insert into public.obrigacoes_feitas (obrigacao_id, cliente_id, periodo)
    values (p_obrigacao_id, p_cliente_id, v_periodo)
    on conflict (contador_id, obrigacao_id, cliente_id, periodo) do nothing;
  else
    delete from public.obrigacoes_feitas
     where obrigacao_id = p_obrigacao_id and cliente_id = p_cliente_id and periodo = v_periodo;
  end if;

  return p_feito;
end;
$$;

-- RF-24: próximos prazos a partir de uma data, nos próximos meses.
create or replace function public.proximos_prazos(
  p_a_partir date default public.hoje_brasilia(),
  p_meses int default 12
)
returns table (
  obrigacao_id uuid,
  nome text,
  periodicidade public.periodicidade,
  prazo date,
  periodo text,
  competencia text,
  total_clientes int,
  feitos int,
  situacao_prazo text,
  dias_para_o_prazo int
)
language sql
stable
security invoker
set search_path = ''
as $$
  select o.*
    from generate_series(
           date_trunc('month', p_a_partir::timestamp),
           date_trunc('month', p_a_partir::timestamp) + make_interval(months => greatest(p_meses, 1) - 1),
           interval '1 month'
         ) as g(mes)
   cross join lateral public.obrigacoes_do_mes(g.mes::date) as o
   where o.prazo >= p_a_partir
   order by o.prazo, o.nome
$$;

-- ---------------------------------------------------------------------------
-- Resumo do mês (RF-03)
-- ---------------------------------------------------------------------------

create or replace function public.resumo_do_mes(p_mes date)
returns table (
  mes date,
  recebido numeric,
  a_receber numeric,
  percentual_recebido int,
  em_aberto_meses_anteriores numeric,
  clientes_em_atraso int,
  guias_a_fazer int
)
language sql
stable
security invoker
set search_path = ''
as $$
  with referencia as (
    select date_trunc('month', p_mes::timestamp)::date as mes
  ),
  do_mes as (
    select coalesce(sum(c.valor + c.extra) filter (where c.pago_em is not null), 0) as recebido,
           coalesce(sum(c.valor + c.extra) filter (where c.pago_em is null), 0) as a_receber
      from public.cobrancas c, referencia r
     where c.mes = r.mes
  ),
  anteriores as (
    select coalesce(sum(c.valor + c.extra), 0) as total
      from public.cobrancas c, referencia r
     where c.mes < r.mes and c.pago_em is null
  ),
  atraso as (
    select count(distinct c.cliente_id) as clientes
      from public.cobrancas c, referencia r
     where c.mes <= r.mes
       and c.pago_em is null
       and c.vencimento < public.hoje_brasilia()
  ),
  guias as (
    select coalesce(sum(o.total_clientes - o.feitos), 0) as faltam
      from referencia r, public.obrigacoes_do_mes(r.mes) o
  )
  select r.mes,
         d.recebido,
         d.a_receber,
         case when d.recebido + d.a_receber = 0 then 0
              else round(100 * d.recebido / (d.recebido + d.a_receber))::int end,
         a.total,
         t.clientes::int,
         g.faltam::int
    from referencia r, do_mes d, anteriores a, atraso t, guias g
$$;

-- ---------------------------------------------------------------------------
-- Cobranças do mês (RF-10, RF-11, RF-15, RF-18)
-- ---------------------------------------------------------------------------

-- p_filtro: 'todos', 'em_atraso', 'a_vencer' ou 'pagos'.
-- Ordem (RF-11): atrasados (mais dias primeiro), vence hoje, a vencer (data
-- mais próxima primeiro), pagos (pagamento mais recente primeiro).
create or replace function public.cobrancas_do_mes(p_mes date, p_filtro text default 'todos')
returns table (
  cobranca_id uuid,
  cliente_id uuid,
  cliente_nome text,
  tipo public.tipo_cliente,
  mes date,
  vencimento date,
  valor numeric,
  extra numeric,
  total numeric,
  motivo_extra text,
  situacao public.situacao_cobranca,
  dias_atraso int,
  pago_em date,
  forma public.forma_pagamento,
  meses_em_aberto_anteriores int,
  total_em_aberto_anteriores numeric,
  proximo_lembrete date,
  proximo_lembrete_tipo text,
  sem_contato boolean,
  email_situacao public.situacao_email
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_mes date := date_trunc('month', p_mes::timestamp)::date;
  v_mes_atual date := date_trunc('month', public.hoje_brasilia()::timestamp)::date;
begin
  if p_filtro is null or p_filtro not in ('todos', 'em_atraso', 'a_vencer', 'pagos') then
    raise exception 'filtro inválido: %', p_filtro using errcode = '22023';
  end if;

  return query
  with pendencias as (
    select c.cliente_id, count(*)::int as quantidade, sum(c.valor + c.extra) as total
      from public.cobrancas c
     where c.mes < v_mes and c.pago_em is null
     group by c.cliente_id
  ),
  proximos as (
    select * from public.proximos_lembretes(public.hoje_brasilia())
     where v_mes >= v_mes_atual
  ),
  linhas as (
    select cs.id as cobranca_id,
           cl.id as cliente_id,
           cl.nome as cliente_nome,
           cl.tipo,
           cs.mes,
           cs.vencimento,
           cs.valor,
           cs.extra,
           cs.total,
           cs.motivo_extra,
           cs.situacao,
           cs.dias_atraso,
           cs.pago_em,
           cs.forma,
           coalesce(p.quantidade, 0) as meses_em_aberto_anteriores,
           coalesce(p.total, 0) as total_em_aberto_anteriores,
           case when cs.pago_em is null or coalesce(p.quantidade, 0) > 0 then px.dia end as proximo_lembrete,
           case when cs.pago_em is null or coalesce(p.quantidade, 0) > 0 then px.tipo end as proximo_lembrete_tipo,
           (cl.email is null and cl.telefone is null) as sem_contato,
           cl.email_situacao
      from public.cobrancas_situacao cs
      join public.clientes cl on cl.id = cs.cliente_id
      left join pendencias p on p.cliente_id = cl.id
      left join proximos px on px.cliente_id = cl.id
     where cs.mes = v_mes
  )
  select l.*
    from linhas l
   where p_filtro = 'todos'
      or (p_filtro = 'em_atraso' and (l.situacao = 'atrasado' or l.meses_em_aberto_anteriores > 0))
      or (p_filtro = 'a_vencer' and l.situacao in ('a_vencer', 'vence_hoje'))
      or (p_filtro = 'pagos' and l.situacao = 'pago')
   order by
     case l.situacao when 'atrasado' then 1 when 'vence_hoje' then 2 when 'a_vencer' then 3 else 4 end,
     case when l.situacao = 'atrasado' then l.dias_atraso end desc nulls last,
     case when l.situacao in ('a_vencer', 'vence_hoje') then l.vencimento end asc nulls last,
     case when l.situacao = 'pago' then l.pago_em end desc nulls last,
     l.cliente_nome;
end;
$$;

-- ---------------------------------------------------------------------------
-- Ações sobre a cobrança (RF-12, RF-13, RF-14)
-- ---------------------------------------------------------------------------

-- RF-12: baixa manual.
create or replace function public.registrar_pagamento(
  p_cobranca_id uuid,
  p_forma public.forma_pagamento,
  p_data date default public.hoje_brasilia()
)
returns date
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_pago_em date;
begin
  update public.cobrancas
     set pago_em = p_data, forma = p_forma
   where id = p_cobranca_id
  returning pago_em into v_pago_em;
  if not found then
    raise exception 'cobrança não encontrada' using errcode = 'P0002';
  end if;
  return v_pago_em;
end;
$$;

-- RF-12: desfaz a baixa; a situação volta a ser calculada pela data.
create or replace function public.desfazer_pagamento(p_cobranca_id uuid)
returns void
language plpgsql
volatile
security invoker
set search_path = ''
as $$
begin
  update public.cobrancas set pago_em = null, forma = null where id = p_cobranca_id;
  if not found then
    raise exception 'cobrança não encontrada' using errcode = 'P0002';
  end if;
end;
$$;

-- RF-13: serviço extra só deste mês. Extra zero desfaz o ajuste.
create or replace function public.ajustar_valor_do_mes(
  p_cobranca_id uuid,
  p_extra numeric,
  p_motivo text default null
)
returns numeric
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_total numeric;
begin
  update public.cobrancas
     set extra = coalesce(p_extra, 0),
         motivo_extra = case when coalesce(p_extra, 0) = 0 then null else nullif(btrim(p_motivo), '') end
   where id = p_cobranca_id
  returning valor + extra into v_total;
  if not found then
    raise exception 'cobrança não encontrada' using errcode = 'P0002';
  end if;
  return v_total;
end;
$$;

-- RF-14 e RN-03: mensagem do botão Cobrar. Atrasado → passo +3; vence hoje
-- → passo 0; a vencer → passo −3. Usa o texto mesmo com o passo desligado (Q-03).
create or replace function public.mensagem_para_cobrar(p_cobranca_id uuid)
returns table (regua_id uuid, dias smallint, assunto text, texto text, cobrancas uuid[])
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_cobranca public.cobrancas%rowtype;
  v_situacao public.situacao_cobranca;
  v_dias smallint;
  v_regua_id uuid;
begin
  select * into v_cobranca from public.cobrancas where id = p_cobranca_id;
  if not found then
    raise exception 'cobrança não encontrada' using errcode = 'P0002';
  end if;

  v_situacao := public.status_cobranca(v_cobranca.vencimento, v_cobranca.pago_em, public.hoje_brasilia());
  if v_situacao = 'pago' then
    raise exception 'esta cobrança já está paga' using errcode = '22023';
  end if;

  v_dias := case v_situacao when 'atrasado' then 3 when 'vence_hoje' then 0 else -3 end;

  select r.id into v_regua_id
    from public.regua r
   where r.contador_id = v_cobranca.contador_id and r.dias = v_dias;

  return query
  select v_regua_id, v_dias, m.assunto, m.texto, m.cobrancas
    from public.montar_mensagem(v_cobranca.cliente_id, v_cobranca.mes, 'passo', v_regua_id) m;
end;
$$;

-- RF-14: registra que o contador enviou a mensagem por conta própria.
create or replace function public.registrar_envio_manual(p_cobranca_id uuid)
returns uuid
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_cobranca public.cobrancas%rowtype;
  v_mensagem record;
  v_envio_id uuid;
begin
  select * into v_cobranca from public.cobrancas where id = p_cobranca_id;
  if not found then
    raise exception 'cobrança não encontrada' using errcode = 'P0002';
  end if;

  select * into v_mensagem from public.mensagem_para_cobrar(p_cobranca_id);

  insert into public.envios (cliente_id, mes, regua_id, canal, status, enviado_em, tipo)
  values (v_cobranca.cliente_id, v_cobranca.mes, v_mensagem.regua_id, 'manual', 'enviado', now(), 'passo')
  returning id into v_envio_id;

  insert into public.envio_cobrancas (envio_id, cobranca_id)
  select v_envio_id, c from unnest(v_mensagem.cobrancas) as c;

  return v_envio_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Conta (RF-43, RF-44)
-- ---------------------------------------------------------------------------

-- RF-43: registra o aceite dos termos na versão informada.
create or replace function public.aceitar_termos(p_versao text)
returns timestamptz
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  v_aceite timestamptz;
begin
  if nullif(btrim(p_versao), '') is null then
    raise exception 'informe a versão dos termos' using errcode = '22023';
  end if;
  update public.contadores
     set termos_versao = btrim(p_versao), termos_aceitos_em = now()
   where id = (select auth.uid())
  returning termos_aceitos_em into v_aceite;
  if not found then
    raise exception 'conta não encontrada' using errcode = 'P0002';
  end if;
  return v_aceite;
end;
$$;

-- RF-44: todos os dados da conta, num JSON só.
create or replace function public.exportar_meus_dados()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'exportado_em', now(),
    'contador', (select to_jsonb(c) from public.contadores c),
    'clientes', coalesce((select jsonb_agg(to_jsonb(x) order by x.nome) from public.clientes x), '[]'::jsonb),
    'cobrancas', coalesce((select jsonb_agg(to_jsonb(x) order by x.mes, x.cliente_id) from public.cobrancas x), '[]'::jsonb),
    'regua', coalesce((select jsonb_agg(to_jsonb(x) order by x.dias) from public.regua x), '[]'::jsonb),
    'obrigacoes', coalesce((select jsonb_agg(to_jsonb(x) order by x.nome) from public.obrigacoes x), '[]'::jsonb),
    'obrigacoes_feitas', coalesce((select jsonb_agg(to_jsonb(x) order by x.periodo) from public.obrigacoes_feitas x), '[]'::jsonb),
    'envios', coalesce((select jsonb_agg(to_jsonb(x) order by x.criado_em) from public.envios x), '[]'::jsonb),
    'envio_cobrancas', coalesce((select jsonb_agg(to_jsonb(x)) from public.envio_cobrancas x), '[]'::jsonb)
  )
$$;

-- ---------------------------------------------------------------------------
-- Permissões: só para quem está logado (e para o sistema)
-- ---------------------------------------------------------------------------

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.obrigacoes_do_mes(date)',
    'public.clientes_da_obrigacao(uuid, date)',
    'public.marcar_obrigacao(uuid, uuid, date, boolean)',
    'public.proximos_prazos(date, int)',
    'public.resumo_do_mes(date)',
    'public.cobrancas_do_mes(date, text)',
    'public.registrar_pagamento(uuid, public.forma_pagamento, date)',
    'public.desfazer_pagamento(uuid)',
    'public.ajustar_valor_do_mes(uuid, numeric, text)',
    'public.mensagem_para_cobrar(uuid)',
    'public.registrar_envio_manual(uuid)',
    'public.aceitar_termos(text)',
    'public.exportar_meus_dados()'
  ]
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated, service_role', f);
  end loop;
end;
$$;
