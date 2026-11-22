-- Neximob: rotina diária de lembretes (ADR-0005)
--
-- Etapa 1, planejar: interno.planejar_lembretes(), chamada pelo Supabase Cron
-- às 9h de Brasília. Fica no esquema "interno", que não é exposto pela API.
--
-- Etapa 2, enviar: a Edge Function "enviar-lembretes" usa as funções rotina_*
-- abaixo. Elas ficam no esquema public para a Edge Function chamar pela API,
-- mas só o papel service_role (chave secreta) pode executá-las.

create schema if not exists interno;
revoke all on schema interno from public;

-- ---------------------------------------------------------------------------
-- Registro das execuções (RNF-09)
-- ---------------------------------------------------------------------------

create table interno.rotina_execucoes (
  id uuid primary key default gen_random_uuid(),
  data_referencia date not null,
  iniciou_em timestamptz not null default now(),
  terminou_em timestamptz,
  situacao text not null default 'em_andamento'
    check (situacao in ('em_andamento', 'concluida', 'falhou')),
  cobrancas_criadas int not null default 0,
  envios_planejados int not null default 0,
  envios_pulados int not null default 0,
  erro text
);

alter table interno.rotina_execucoes enable row level security;

create index rotina_execucoes_data_idx on interno.rotina_execucoes (data_referencia desc);

-- Canais que a rotina usa hoje. O WhatsApp entra na F4 (ADR-0002).
create or replace function interno.canais_habilitados()
returns public.canal_envio[]
language sql
immutable
set search_path = ''
as $$
  select array['email']::public.canal_envio[]
$$;

-- Lembretes de um intervalo de dias, um por cliente, canal e dia.
create or replace function interno.candidatos(p_desde date, p_ate date)
returns table (
  dia date,
  contador_id uuid,
  cliente_id uuid,
  ciclo date,
  regua_id uuid,
  dias smallint,
  tipo text,
  cobranca_id uuid,
  canal public.canal_envio
)
language sql
stable
set search_path = ''
as $$
  select d.dia::date, l.contador_id, l.cliente_id, l.ciclo, l.regua_id, l.dias, l.tipo, l.cobranca_id, ch.canal
    from generate_series(p_desde::timestamp, p_ate::timestamp, interval '1 day') as d(dia)
   cross join lateral public.lembretes_do_dia(d.dia::date) as l
    join public.clientes cl on cl.id = l.cliente_id
   cross join lateral (
     select x as canal
       from unnest(cl.canais) as x
      where x = any (interno.canais_habilitados())
        -- RN-17 e RN-24: só canais com contato válido.
        and (x <> 'email' or (cl.email is not null and cl.email_situacao = 'ok'))
        and (x <> 'whatsapp' or cl.telefone is not null)
   ) as ch
$$;

-- ---------------------------------------------------------------------------
-- Etapa 1: planejar
-- ---------------------------------------------------------------------------

-- 1. Garante a cobrança do mês corrente para os clientes ativos (RF-02).
-- 2. Calcula os lembretes de hoje e dos dias em que a rotina não rodou
--    (no máximo 30 dias para trás).
-- 3. Cria as cobranças dos ciclos que ainda não existem (passo −3 que cai no
--    mês anterior ao vencimento).
-- 4. Grava um envio por cliente, mês, passo e canal: o mais recente de cada
--    cliente fica "pendente"; os anteriores, "pulado" (RN-22). O banco não
--    aceita duplicata (RN-13), então rodar de novo não repete nada.
create or replace function interno.planejar_lembretes(p_hoje date default public.hoje_brasilia())
returns jsonb
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_execucao uuid;
  v_ultima date;
  v_desde date;
  v_criadas int := 0;
  v_criadas_ciclo int := 0;
  v_planejados int := 0;
  v_pulados int := 0;
begin
  insert into interno.rotina_execucoes (data_referencia) values (p_hoje) returning id into v_execucao;

  begin
    select max(e.data_referencia) into v_ultima
      from interno.rotina_execucoes e
     where e.situacao = 'concluida' and e.data_referencia < p_hoje;

    v_desde := greatest(coalesce(v_ultima + 1, p_hoje), p_hoje - 30);

    v_criadas := public.garantir_cobrancas(p_hoje);

    with novas as (
      insert into public.cobrancas (contador_id, cliente_id, mes, vencimento, valor)
      select distinct c.contador_id, c.cliente_id, c.ciclo,
             make_date(extract(year from c.ciclo)::int, extract(month from c.ciclo)::int, cl.dia_vencimento),
             cl.honorario
        from interno.candidatos(v_desde, p_hoje) c
        join public.clientes cl on cl.id = c.cliente_id
       where c.cobranca_id is null
      on conflict (contador_id, cliente_id, mes) do nothing
      returning 1
    )
    select count(*) into v_criadas_ciclo from novas;

    with ordenados as (
      select c.*,
             row_number() over (partition by c.cliente_id, c.canal order by c.dia desc, c.dias desc) as ordem
        from interno.candidatos(v_desde, p_hoje) c
    ),
    gravados as (
      insert into public.envios (contador_id, cliente_id, mes, regua_id, canal, status, tipo)
      select o.contador_id, o.cliente_id, o.ciclo, o.regua_id, o.canal,
             case when o.ordem = 1 then 'pendente' else 'pulado' end::public.status_envio,
             o.tipo
        from ordenados o
      on conflict (contador_id, cliente_id, mes, regua_id, canal) where canal <> 'manual' do nothing
      returning status
    )
    select count(*) filter (where status = 'pendente'), count(*) filter (where status = 'pulado')
      into v_planejados, v_pulados
      from gravados;

    update interno.rotina_execucoes
       set situacao = 'concluida',
           terminou_em = clock_timestamp(),
           cobrancas_criadas = v_criadas + v_criadas_ciclo,
           envios_planejados = v_planejados,
           envios_pulados = v_pulados
     where id = v_execucao;
  exception when others then
    update interno.rotina_execucoes
       set situacao = 'falhou', terminou_em = clock_timestamp(), erro = sqlerrm
     where id = v_execucao;
    return jsonb_build_object('situacao', 'falhou', 'erro', sqlerrm);
  end;

  return jsonb_build_object(
    'situacao', 'concluida',
    'desde', v_desde,
    'ate', p_hoje,
    'cobrancas_criadas', v_criadas + v_criadas_ciclo,
    'envios_planejados', v_planejados,
    'envios_pulados', v_pulados
  );
end;
$$;

revoke all on function interno.canais_habilitados() from public;
revoke all on function interno.candidatos(date, date) from public;
revoke all on function interno.planejar_lembretes(date) from public;

-- ---------------------------------------------------------------------------
-- Etapa 2: enviar (só service_role)
-- ---------------------------------------------------------------------------

-- Janela de envio: das 9h às 20h de Brasília (proposto na ADR-0005).
create or replace function public.rotina_dentro_da_janela(p_agora timestamptz default now())
returns boolean
language sql
immutable
set search_path = ''
as $$
  select extract(hour from (p_agora at time zone 'America/Sao_Paulo')) between 9 and 19
$$;

-- Separa um lote da fila e marca como "enviando". Pega os pendentes cuja
-- tentativa já pode acontecer e os que ficaram "enviando" por mais de 10
-- minutos (a função caiu no meio). "skip locked" impede que duas execuções
-- peguem o mesmo envio.
create or replace function public.rotina_reservar_envios(
  p_limite int default 50,
  p_agora timestamptz default now()
)
returns setof uuid
language plpgsql
volatile
set search_path = ''
as $$
begin
  if not public.rotina_dentro_da_janela(p_agora) then
    return;
  end if;

  return query
  with lote as (
    select e.id
      from public.envios e
     where e.canal <> 'manual'
       and (
         (e.status = 'pendente' and (e.proxima_tentativa_em is null or e.proxima_tentativa_em <= p_agora))
         or (e.status = 'enviando' and e.reservado_em < p_agora - interval '10 minutes')
       )
     order by e.criado_em
     limit greatest(p_limite, 1)
     for update skip locked
  )
  update public.envios e
     set status = 'enviando', reservado_em = p_agora
    from lote
   where e.id = lote.id
  returning e.id;
end;
$$;

-- Tudo o que a Edge Function precisa para enviar um envio. Antes, confere de
-- novo se ele ainda deve sair (RN-09): se não, devolve cancelar = true e o
-- motivo.
create or replace function public.rotina_mensagem_do_envio(p_envio_id uuid)
returns table (
  envio_id uuid,
  canal public.canal_envio,
  cancelar boolean,
  motivo text,
  destinatario_nome text,
  destinatario_email text,
  contador_nome text,
  contador_email text,
  assunto text,
  texto text,
  cobrancas uuid[]
)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_envio public.envios%rowtype;
  v_cliente public.clientes%rowtype;
  v_contador public.contadores%rowtype;
  v_pago boolean;
  v_tem_pendencias boolean;
  v_mensagem record;
begin
  select * into v_envio from public.envios where id = p_envio_id;
  if not found then
    raise exception 'envio não encontrado' using errcode = 'P0002';
  end if;
  select * into v_cliente from public.clientes where id = v_envio.cliente_id;
  select * into v_contador from public.contadores where id = v_envio.contador_id;

  envio_id := v_envio.id;
  canal := v_envio.canal;
  destinatario_nome := v_cliente.nome;
  destinatario_email := v_cliente.email;
  contador_nome := v_contador.nome;
  contador_email := v_contador.email;
  cancelar := false;

  select c.pago_em is not null into v_pago
    from public.cobrancas c
   where c.contador_id = v_envio.contador_id and c.cliente_id = v_envio.cliente_id and c.mes = v_envio.mes;

  select exists (
    select 1 from public.cobrancas c
     where c.cliente_id = v_envio.cliente_id and c.mes < v_envio.mes and c.pago_em is null
  ) into v_tem_pendencias;

  if not v_cliente.ativo then
    cancelar := true; motivo := 'cliente inativo';
  elsif v_envio.canal = 'email' and (v_cliente.email is null or v_cliente.email_situacao <> 'ok') then
    cancelar := true; motivo := 'cliente sem e-mail válido';
  elsif v_envio.tipo = 'passo' and coalesce(v_pago, false) then
    cancelar := true; motivo := 'cobrança paga antes do envio';
  elsif v_envio.tipo = 'pendencia' and not v_tem_pendencias then
    cancelar := true; motivo := 'pendências pagas antes do envio';
  end if;

  if not cancelar then
    select * into v_mensagem
      from public.montar_mensagem(v_envio.cliente_id, v_envio.mes, v_envio.tipo, v_envio.regua_id);
    assunto := v_mensagem.assunto;
    texto := v_mensagem.texto;
    cobrancas := v_mensagem.cobrancas;
  end if;

  return next;
end;
$$;

-- Registra o resultado de um envio.
--   'enviado':          aceito pelo provedor; liga o envio às cobranças lembradas
--   'falha_temporaria': nova tentativa em 5 min, 30 min e 2 h; depois, falhou
--   'falha_definitiva': falhou, sem nova tentativa (endereço inválido etc.)
--   'cancelado':        não deve mais sair (RN-09)
create or replace function public.rotina_registrar_resultado(
  p_envio_id uuid,
  p_resultado text,
  p_provedor_mensagem_id text default null,
  p_erro text default null,
  p_cobrancas uuid[] default null,
  p_agora timestamptz default now()
)
returns public.status_envio
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_envio public.envios%rowtype;
  v_status public.status_envio;
begin
  select * into v_envio from public.envios where id = p_envio_id for update;
  if not found then
    raise exception 'envio não encontrado' using errcode = 'P0002';
  end if;

  if p_resultado = 'enviado' then
    update public.envios
       set status = 'enviado', enviado_em = p_agora, provedor_mensagem_id = p_provedor_mensagem_id,
           erro = null, reservado_em = null
     where id = p_envio_id;
    insert into public.envio_cobrancas (envio_id, cobranca_id, contador_id)
    select p_envio_id, c, v_envio.contador_id from unnest(coalesce(p_cobrancas, '{}'::uuid[])) as c
    on conflict do nothing;
    v_status := 'enviado';
  elsif p_resultado = 'falha_temporaria' then
    if v_envio.tentativas + 1 >= 4 then
      v_status := 'falhou';
      update public.envios
         set status = 'falhou', tentativas = tentativas + 1, erro = p_erro, reservado_em = null
       where id = p_envio_id;
    else
      v_status := 'pendente';
      update public.envios
         set status = 'pendente',
             tentativas = tentativas + 1,
             erro = p_erro,
             reservado_em = null,
             proxima_tentativa_em = p_agora + (array[interval '5 minutes', interval '30 minutes', interval '2 hours'])[v_envio.tentativas + 1]
       where id = p_envio_id;
    end if;
  elsif p_resultado = 'falha_definitiva' then
    v_status := 'falhou';
    update public.envios
       set status = 'falhou', tentativas = tentativas + 1, erro = p_erro, reservado_em = null
     where id = p_envio_id;
  elsif p_resultado = 'cancelado' then
    v_status := 'cancelado';
    update public.envios
       set status = 'cancelado', erro = p_erro, reservado_em = null
     where id = p_envio_id;
  else
    raise exception 'resultado inválido: %', p_resultado using errcode = '22023';
  end if;

  return v_status;
end;
$$;

-- Avisos do Resend (ADR-0007). Devolve false se o e-mail não é conhecido.
--   email.delivered  → entregue
--   email.bounced    → falhou; e-mail do cliente vira "devolvido" (RN-24)
--   email.complained → falhou; e-mail do cliente vira "spam" (RN-24)
--   email.failed     → falhou
-- Os demais eventos são ignorados.
create or replace function public.rotina_registrar_evento_email(
  p_provedor_mensagem_id text,
  p_evento text
)
returns boolean
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_envio public.envios%rowtype;
begin
  select * into v_envio
    from public.envios
   where provedor_mensagem_id = p_provedor_mensagem_id and canal = 'email'
   for update;
  if not found then
    return false;
  end if;

  if p_evento = 'email.delivered' then
    update public.envios set status = 'entregue'
     where id = v_envio.id and status = 'enviado';
  elsif p_evento in ('email.bounced', 'email.complained', 'email.failed') then
    update public.envios
       set status = 'falhou',
           erro = case p_evento
                    when 'email.bounced' then 'e-mail devolvido'
                    when 'email.complained' then 'marcado como spam pelo destinatário'
                    else 'o provedor não conseguiu enviar'
                  end
     where id = v_envio.id;
    if p_evento in ('email.bounced', 'email.complained') then
      update public.clientes
         set email_situacao = case p_evento when 'email.bounced' then 'devolvido' else 'spam' end::public.situacao_email
       where id = v_envio.cliente_id;
    end if;
  end if;

  return true;
end;
$$;

-- Problemas da rotina, para o alerta das 9h30 (ADR-0005).
create or replace function public.rotina_verificar_saude(p_agora timestamptz default now())
returns table (problema text)
language plpgsql
stable
set search_path = ''
as $$
declare
  v_hoje date := (p_agora at time zone 'America/Sao_Paulo')::date;
  v_execucao interno.rotina_execucoes%rowtype;
  v_atrasados int;
begin
  select * into v_execucao
    from interno.rotina_execucoes e
   where e.data_referencia = v_hoje
   order by e.iniciou_em desc
   limit 1;

  if not found then
    problema := 'o planejamento de hoje não rodou';
    return next;
  elsif v_execucao.situacao = 'falhou' then
    problema := 'o planejamento de hoje falhou: ' || coalesce(v_execucao.erro, 'sem detalhe');
    return next;
  elsif v_execucao.situacao = 'em_andamento' and v_execucao.iniciou_em < p_agora - interval '15 minutes' then
    problema := 'o planejamento de hoje não terminou';
    return next;
  end if;

  if public.rotina_dentro_da_janela(p_agora) then
    select count(*) into v_atrasados
      from public.envios e
     where e.status = 'pendente'
       and e.canal <> 'manual'
       and coalesce(e.proxima_tentativa_em, e.criado_em) < p_agora - interval '2 hours';
    if v_atrasados > 0 then
      problema := v_atrasados || ' envio(s) pendente(s) há mais de 2 horas';
      return next;
    end if;
  end if;
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.rotina_reservar_envios(int, timestamptz)',
    'public.rotina_mensagem_do_envio(uuid)',
    'public.rotina_registrar_resultado(uuid, text, text, text, uuid[], timestamptz)',
    'public.rotina_registrar_evento_email(text, text)',
    'public.rotina_verificar_saude(timestamptz)'
  ]
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end;
$$;

-- rotina_verificar_saude lê interno.rotina_execucoes com a permissão de quem
-- chama: o service_role (que ignora a RLS) precisa enxergar o esquema e a tabela.
grant usage on schema interno to service_role;
grant select on interno.rotina_execucoes to service_role;
