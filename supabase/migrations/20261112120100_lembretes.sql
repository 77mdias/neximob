-- Neximob: cálculo dos lembretes de cada dia (RN-04, RN-09, RN-18, RN-19, RN-21)
--
-- Regra do "alvo" (SRS, seção 4.3): para cada passo ligado, o vencimento a
-- que ele se refere hoje é hoje − dias do passo. O alvo pode ser de outro mês:
-- o passo −3 de quem vence no dia 2 cai no fim do mês anterior, e os passos +3
-- e +7 de quem vence no fim do mês caem no início do mês seguinte.
--
-- A mesma função serve à tela ("próximo lembrete", RF-15) e à rotina diária
-- (ADR-0005), para as duas nunca calcularem de jeitos diferentes.

-- ---------------------------------------------------------------------------
-- Envios: tipo da mensagem e controle da fila (ADR-0005)
-- ---------------------------------------------------------------------------

alter table public.envios
  add column tipo text not null default 'passo' check (tipo in ('passo', 'pendencia')),
  add column reservado_em timestamptz;

grant insert (tipo) on public.envios to authenticated;

create index envios_fila_idx on public.envios (status, proxima_tentativa_em)
  where status in ('pendente', 'enviando');

-- ---------------------------------------------------------------------------
-- Lembretes que acontecem num dia
-- ---------------------------------------------------------------------------

-- Para cada cliente ativo e cada passo ligado, devolve o lembrete do dia, se
-- houver:
--   tipo 'passo':     a cobrança do ciclo está em aberto (ou ainda não foi criada);
--   tipo 'pendencia': a cobrança do ciclo está paga, há pendências de meses
--                     anteriores e o passo é o "No dia" (uma vez por mês).
-- Roda com a permissão de quem chama: pela tela, só os clientes do contador.
create or replace function public.lembretes_do_dia(p_dia date)
returns table (
  contador_id uuid,
  cliente_id uuid,
  ciclo date,
  regua_id uuid,
  dias smallint,
  tipo text,
  cobranca_id uuid
)
language sql
stable
security invoker
set search_path = ''
as $$
  with candidatos as (
    select cl.contador_id,
           cl.id as cliente_id,
           cl.cobranca_inicio,
           r.id as regua_id,
           r.dias,
           date_trunc('month', (p_dia - r.dias::int)::timestamp)::date as ciclo
      from public.clientes cl
      join public.regua r
        on r.contador_id = cl.contador_id
       and r.ativo
     where cl.ativo
       and extract(day from (p_dia - r.dias::int)) = cl.dia_vencimento
  )
  select c.contador_id,
         c.cliente_id,
         c.ciclo,
         c.regua_id,
         c.dias,
         case when cb.pago_em is null then 'passo' else 'pendencia' end,
         cb.id
    from candidatos c
    left join public.cobrancas cb
      on cb.contador_id = c.contador_id
     and cb.cliente_id = c.cliente_id
     and cb.mes = c.ciclo
   where c.ciclo >= c.cobranca_inicio
     and (
       cb.pago_em is null
       or (
         c.dias = 0
         and exists (
           select 1
             from public.cobrancas p
            where p.contador_id = c.contador_id
              and p.cliente_id = c.cliente_id
              and p.mes < c.ciclo
              and p.pago_em is null
         )
       )
     )
$$;

-- RF-15 e RN-04: próximo lembrete automático de cada cliente, de hoje em
-- diante (até 45 dias), ignorando os que já foram enviados ou pulados.
create or replace function public.proximos_lembretes(p_hoje date default public.hoje_brasilia())
returns table (cliente_id uuid, dia date, ciclo date, regua_id uuid, dias smallint, tipo text)
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct on (l.cliente_id)
         l.cliente_id, d.dia::date, l.ciclo, l.regua_id, l.dias, l.tipo
    from generate_series(p_hoje::timestamp, (p_hoje + 45)::timestamp, interval '1 day') as d(dia)
   cross join lateral public.lembretes_do_dia(d.dia::date) as l
   where not exists (
     select 1
       from public.envios e
      where e.contador_id = l.contador_id
        and e.cliente_id = l.cliente_id
        and e.mes = l.ciclo
        and e.regua_id = l.regua_id
        and e.canal <> 'manual'
        and e.status in ('enviado', 'entregue', 'lido', 'pulado')
   )
   order by l.cliente_id, d.dia
$$;

revoke execute on function public.lembretes_do_dia(date) from public, anon;
revoke execute on function public.proximos_lembretes(date) from public, anon;
grant execute on function public.lembretes_do_dia(date) to authenticated, service_role;
grant execute on function public.proximos_lembretes(date) to authenticated, service_role;
