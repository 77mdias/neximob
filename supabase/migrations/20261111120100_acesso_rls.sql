-- Neximob: regras de acesso (ADR-0004)
--
-- Duas camadas:
--   1. RLS: o contador só vê e altera as linhas com o próprio contador_id.
--   2. Permissões por tabela e por coluna: o que o contador pode fazer com
--      essas linhas. Campos controlados pelo sistema (plano, situação do
--      e-mail, ids dos provedores, envios automáticos) só mudam pelo servidor,
--      com a chave secreta, que ignora a RLS (rotina diária e avisos dos
--      provedores).
--
-- O papel anon (visitante sem login) não acessa nenhuma tabela.

-- ---------------------------------------------------------------------------
-- RLS ligada em todas as tabelas
-- ---------------------------------------------------------------------------

alter table public.contadores        enable row level security;
alter table public.clientes          enable row level security;
alter table public.cobrancas         enable row level security;
alter table public.regua             enable row level security;
alter table public.obrigacoes_padrao enable row level security;
alter table public.obrigacoes        enable row level security;
alter table public.obrigacoes_feitas enable row level security;
alter table public.envios            enable row level security;
alter table public.envio_cobrancas   enable row level security;

-- ---------------------------------------------------------------------------
-- Permissões: começa sem nada para anon e authenticated
-- ---------------------------------------------------------------------------

revoke all on table
  public.contadores, public.clientes, public.cobrancas, public.regua,
  public.obrigacoes_padrao, public.obrigacoes, public.obrigacoes_feitas,
  public.envios, public.envio_cobrancas
from anon, authenticated;

-- ---------------------------------------------------------------------------
-- contadores: lê e altera só o próprio perfil; plano e e-mail não mudam por aqui
-- ---------------------------------------------------------------------------

create policy "contador acessa o próprio perfil"
on public.contadores for all
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

grant select on public.contadores to authenticated;
grant update (nome, chave_pix, termos_versao, termos_aceitos_em)
  on public.contadores to authenticated;

-- ---------------------------------------------------------------------------
-- clientes
-- ---------------------------------------------------------------------------

create policy "contador acessa só os próprios dados"
on public.clientes for all
to authenticated
using (contador_id = (select auth.uid()))
with check (contador_id = (select auth.uid()));

grant select, delete on public.clientes to authenticated;
grant insert (id, contador_id, nome, tipo, honorario, dia_vencimento, cobranca_inicio,
              telefone, email, canais, ativo)
  on public.clientes to authenticated;
-- email_situacao e provedor_cliente_id ficam de fora: são do sistema.
grant update (nome, tipo, honorario, dia_vencimento, cobranca_inicio,
              telefone, email, canais, ativo)
  on public.clientes to authenticated;

-- ---------------------------------------------------------------------------
-- cobrancas: cria (garantir_cobrancas), dá baixa e ajusta o extra; não apaga
-- ---------------------------------------------------------------------------

create policy "contador acessa só os próprios dados"
on public.cobrancas for all
to authenticated
using (contador_id = (select auth.uid()))
with check (contador_id = (select auth.uid()));

grant select on public.cobrancas to authenticated;
grant insert (id, contador_id, cliente_id, mes, vencimento, valor)
  on public.cobrancas to authenticated;
-- valor e vencimento mudam pela regra RN-14 (gatilho em clientes).
grant update (valor, vencimento, extra, motivo_extra, pago_em, forma)
  on public.cobrancas to authenticated;

-- ---------------------------------------------------------------------------
-- regua: os 4 passos são criados com a conta; o contador só liga, desliga e
-- edita o texto
-- ---------------------------------------------------------------------------

create policy "contador acessa só os próprios dados"
on public.regua for all
to authenticated
using (contador_id = (select auth.uid()))
with check (contador_id = (select auth.uid()));

grant select on public.regua to authenticated;
grant update (ativo, texto) on public.regua to authenticated;

-- ---------------------------------------------------------------------------
-- obrigacoes_padrao: leitura para todos os contadores; escrita só por migração
-- ---------------------------------------------------------------------------

create policy "contadores leem o calendário padrão"
on public.obrigacoes_padrao for select
to authenticated
using (true);

grant select on public.obrigacoes_padrao to authenticated;

-- ---------------------------------------------------------------------------
-- obrigacoes: o contador ajusta o próprio calendário (RF-23)
-- ---------------------------------------------------------------------------

create policy "contador acessa só os próprios dados"
on public.obrigacoes for all
to authenticated
using (contador_id = (select auth.uid()))
with check (contador_id = (select auth.uid()));

grant select, delete on public.obrigacoes to authenticated;
grant insert (id, contador_id, nome, tipos_cliente, periodicidade, prazo_dia, prazo_mes,
              competencia, personalizada, ativo)
  on public.obrigacoes to authenticated;
grant update (nome, tipos_cliente, periodicidade, prazo_dia, prazo_mes,
              competencia, personalizada, ativo)
  on public.obrigacoes to authenticated;

-- ---------------------------------------------------------------------------
-- obrigacoes_feitas: marcar e desmarcar (RF-21)
-- ---------------------------------------------------------------------------

create policy "contador acessa só os próprios dados"
on public.obrigacoes_feitas for all
to authenticated
using (contador_id = (select auth.uid()))
with check (contador_id = (select auth.uid()));

grant select, delete on public.obrigacoes_feitas to authenticated;
grant insert (id, contador_id, obrigacao_id, cliente_id, periodo)
  on public.obrigacoes_feitas to authenticated;

-- ---------------------------------------------------------------------------
-- envios: o contador lê todos os seus e só registra envios manuais (RF-14).
-- Os automáticos são escritos pela rotina diária (ADR-0005).
-- ---------------------------------------------------------------------------

create policy "contador lê os próprios envios"
on public.envios for select
to authenticated
using (contador_id = (select auth.uid()));

create policy "contador registra envio manual"
on public.envios for insert
to authenticated
with check (
  contador_id = (select auth.uid())
  and canal = 'manual'
  and status = 'enviado'
);

grant select on public.envios to authenticated;
grant insert (id, contador_id, cliente_id, mes, regua_id, canal, status, enviado_em)
  on public.envios to authenticated;

create policy "contador acessa só os próprios dados"
on public.envio_cobrancas for all
to authenticated
using (contador_id = (select auth.uid()))
with check (contador_id = (select auth.uid()));

grant select, insert on public.envio_cobrancas to authenticated;
