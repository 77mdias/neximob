-- Agenda Contábil: esquema inicial (F2)
--
-- Modelo lógico: docs/SRS.md, seção 5.
-- Isolamento entre contadores: docs/adr/0004-isolamento-por-contador-rls.md
-- As políticas de acesso (RLS) e as permissões ficam na migração seguinte.
--
-- Convenções:
--   * toda tabela de dados do contador tem contador_id, com valor padrão auth.uid();
--   * chaves estrangeiras entre tabelas do contador são compostas (id, contador_id),
--     para o banco recusar referências ao dado de outro contador;
--   * chaves únicas começam por contador_id: assim, tentar gravar com os ids de
--     outro contador dá "não encontrado" (chave estrangeira), e nunca "chave
--     duplicada", que revelaria que aquele dado existe;
--   * meses de referência são guardados como o dia 1 do mês (date).

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------

create type public.tipo_cliente as enum ('MEI', 'SIMPLES', 'PF');

create type public.periodicidade as enum ('mensal', 'anual');

-- RN-23: a obrigação mostra a competência do período anterior ao prazo (DAS, DEFIS...)
-- ou do mesmo período.
create type public.competencia as enum ('periodo_anterior', 'mesmo_periodo');

create type public.canal_envio as enum ('email', 'whatsapp', 'manual');

-- ADR-0005 e ADR-0007.
create type public.status_envio as enum (
  'pendente', 'enviando', 'enviado', 'falhou', 'pulado', 'cancelado', 'entregue', 'lido'
);

create type public.forma_pagamento as enum ('pix', 'transferencia', 'dinheiro', 'outro');

-- RN-24 (proposto): situação do e-mail do cliente, atualizada pelos avisos do Resend.
create type public.situacao_email as enum ('ok', 'devolvido', 'spam');

-- RN-02.
create type public.situacao_cobranca as enum ('pago', 'a_vencer', 'vence_hoje', 'atrasado');

-- ---------------------------------------------------------------------------
-- Contadores (um por usuário do Supabase Auth)
-- ---------------------------------------------------------------------------

create table public.contadores (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 200),
  email text not null unique,
  chave_pix text check (chave_pix is null or char_length(chave_pix) <= 140),
  plano text not null default 'gratuito',
  termos_versao text,
  termos_aceitos_em timestamptz,
  criado_em timestamptz not null default now()
);

comment on table public.contadores is
  'Conta do contador. O id é o id do usuário no Supabase Auth (ADR-0004).';

-- ---------------------------------------------------------------------------
-- Clientes do contador
-- ---------------------------------------------------------------------------

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  contador_id uuid not null default auth.uid()
    references public.contadores (id) on delete cascade,
  nome text not null check (char_length(btrim(nome)) between 1 and 200),
  tipo public.tipo_cliente not null,
  honorario numeric(12, 2) not null check (honorario > 0),
  -- RN-07: de 1 a 28, para existir em todos os meses.
  dia_vencimento smallint not null check (dia_vencimento between 1 and 28),
  -- RN-21: mês da primeira cobrança (dia 1 do mês).
  cobranca_inicio date not null
    default date_trunc('month', now() at time zone 'America/Sao_Paulo')::date
    check (extract(day from cobranca_inicio) = 1),
  -- Formato internacional: +55, DDD e número.
  telefone text check (telefone is null or telefone ~ '^\+55[0-9]{10,11}$'),
  email text check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  email_situacao public.situacao_email not null default 'ok',
  -- Q-05: por padrão, todos os canais; na hora do envio só valem os que têm contato.
  canais public.canal_envio[] not null default array['email', 'whatsapp']::public.canal_envio[]
    check (not ('manual' = any (canais))),
  ativo boolean not null default true,
  -- ADR-0003: identificador do pagador no provedor de Pix. Nunca CPF ou CNPJ.
  provedor_cliente_id text,
  criado_em timestamptz not null default now(),
  unique (id, contador_id)
);

create index clientes_contador_id_idx on public.clientes (contador_id);

-- ---------------------------------------------------------------------------
-- Cobranças (uma por cliente e mês)
-- ---------------------------------------------------------------------------

create table public.cobrancas (
  id uuid primary key default gen_random_uuid(),
  contador_id uuid not null default auth.uid()
    references public.contadores (id) on delete cascade,
  cliente_id uuid not null,
  -- Mês de referência (dia 1 do mês).
  mes date not null check (extract(day from mes) = 1),
  -- Data de vencimento guardada na cobrança, para que mudar o dia de vencimento
  -- do cliente não altere cobranças antigas.
  vencimento date not null,
  -- RN-01 e RN-14: valor = honorário daquele mês; total = valor + extra.
  valor numeric(12, 2) not null check (valor > 0),
  extra numeric(12, 2) not null default 0 check (extra >= 0),
  motivo_extra text,
  pago_em date,
  forma public.forma_pagamento,
  provedor_cobranca_id text,
  criado_em timestamptz not null default now(),
  unique (contador_id, cliente_id, mes),
  unique (id, contador_id),
  foreign key (cliente_id, contador_id)
    references public.clientes (id, contador_id) on delete cascade,
  check (date_trunc('month', vencimento::timestamp)::date = mes),
  -- RF-13: motivo obrigatório quando há serviço extra.
  check (extra = 0 or nullif(btrim(motivo_extra), '') is not null),
  -- RF-12: data e forma do pagamento andam juntas.
  check ((pago_em is null) = (forma is null))
);

create index cobrancas_cliente_id_idx on public.cobrancas (cliente_id);

-- ---------------------------------------------------------------------------
-- Régua de cobrança (4 passos por contador)
-- ---------------------------------------------------------------------------

create table public.regua (
  id uuid primary key default gen_random_uuid(),
  contador_id uuid not null default auth.uid()
    references public.contadores (id) on delete cascade,
  -- RF-30: 3 dias antes, no dia, 3 dias depois e 7 dias depois.
  dias smallint not null check (dias in (-3, 0, 3, 7)),
  nome text not null,
  ativo boolean not null,
  -- Texto do e-mail. No WhatsApp valem os modelos fixos (ADR-0002).
  texto text not null check (char_length(texto) between 1 and 2000),
  unique (contador_id, dias),
  unique (id, contador_id)
);

-- ---------------------------------------------------------------------------
-- Calendário fiscal
-- ---------------------------------------------------------------------------

-- Q-08: calendário padrão publicado pela plataforma, por ano. Sem contador_id.
create table public.obrigacoes_padrao (
  id uuid primary key default gen_random_uuid(),
  ano smallint not null check (ano between 2020 and 2100),
  codigo text not null,
  nome text not null,
  tipos_cliente public.tipo_cliente[] not null check (cardinality(tipos_cliente) > 0),
  periodicidade public.periodicidade not null,
  prazo_dia smallint not null check (prazo_dia between 1 and 31),
  -- Só para obrigações anuais.
  prazo_mes smallint check (prazo_mes between 1 and 12),
  competencia public.competencia not null default 'periodo_anterior',
  unique (ano, codigo),
  check ((periodicidade = 'mensal') = (prazo_mes is null))
);

-- Cópia do calendário na conta do contador, que ele pode ajustar (RF-23).
create table public.obrigacoes (
  id uuid primary key default gen_random_uuid(),
  contador_id uuid not null default auth.uid()
    references public.contadores (id) on delete cascade,
  padrao_id uuid references public.obrigacoes_padrao (id) on delete set null,
  nome text not null check (char_length(btrim(nome)) between 1 and 200),
  tipos_cliente public.tipo_cliente[] not null check (cardinality(tipos_cliente) > 0),
  periodicidade public.periodicidade not null,
  prazo_dia smallint not null check (prazo_dia between 1 and 31),
  prazo_mes smallint check (prazo_mes between 1 and 12),
  competencia public.competencia not null default 'periodo_anterior',
  -- Q-08: o contador ajustou esta obrigação.
  personalizada boolean not null default false,
  ativo boolean not null default true,
  unique (id, contador_id),
  check ((periodicidade = 'mensal') = (prazo_mes is null))
);

create index obrigacoes_contador_id_idx on public.obrigacoes (contador_id);

create table public.obrigacoes_feitas (
  id uuid primary key default gen_random_uuid(),
  contador_id uuid not null default auth.uid()
    references public.contadores (id) on delete cascade,
  obrigacao_id uuid not null,
  cliente_id uuid not null,
  -- RN-06: AAAA-MM para obrigação mensal, AAAA para anual.
  periodo text not null check (periodo ~ '^[0-9]{4}(-(0[1-9]|1[0-2]))?$'),
  feito_em timestamptz not null default now(),
  unique (contador_id, obrigacao_id, cliente_id, periodo),
  foreign key (obrigacao_id, contador_id)
    references public.obrigacoes (id, contador_id) on delete cascade,
  foreign key (cliente_id, contador_id)
    references public.clientes (id, contador_id) on delete cascade
);

create index obrigacoes_feitas_cliente_id_idx on public.obrigacoes_feitas (cliente_id);

-- ---------------------------------------------------------------------------
-- Envios (registro e, na F3, fila da rotina diária: ADR-0005)
-- ---------------------------------------------------------------------------

create table public.envios (
  id uuid primary key default gen_random_uuid(),
  contador_id uuid not null default auth.uid()
    references public.contadores (id) on delete cascade,
  cliente_id uuid not null,
  -- Mês da régua (dia 1 do mês).
  mes date not null check (extract(day from mes) = 1),
  regua_id uuid not null,
  canal public.canal_envio not null,
  status public.status_envio not null default 'pendente',
  tentativas smallint not null default 0 check (tentativas >= 0),
  proxima_tentativa_em timestamptz,
  enviado_em timestamptz,
  erro text,
  provedor_mensagem_id text,
  criado_em timestamptz not null default now(),
  unique (id, contador_id),
  foreign key (cliente_id, contador_id)
    references public.clientes (id, contador_id) on delete cascade,
  foreign key (regua_id, contador_id)
    references public.regua (id, contador_id) on delete cascade
);

-- RN-13: um envio automático por cliente, mês, passo e canal.
-- Envios manuais (botão Cobrar) podem se repetir.
create unique index envios_automaticos_uk
  on public.envios (contador_id, cliente_id, mes, regua_id, canal)
  where canal <> 'manual';

create index envios_contador_id_idx on public.envios (contador_id);
create index envios_cliente_mes_idx on public.envios (cliente_id, mes);

-- Cobranças incluídas em cada envio: a do mês e as pendências (RN-19).
create table public.envio_cobrancas (
  envio_id uuid not null,
  cobranca_id uuid not null,
  contador_id uuid not null default auth.uid()
    references public.contadores (id) on delete cascade,
  primary key (contador_id, envio_id, cobranca_id),
  foreign key (envio_id, contador_id)
    references public.envios (id, contador_id) on delete cascade,
  foreign key (cobranca_id, contador_id)
    references public.cobrancas (id, contador_id) on delete cascade
);

create index envio_cobrancas_envio_id_idx on public.envio_cobrancas (envio_id);
create index envio_cobrancas_cobranca_id_idx on public.envio_cobrancas (cobranca_id);
