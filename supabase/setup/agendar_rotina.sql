-- Neximob: agendamento da rotina diária (ADR-0005)
--
-- Rodar UMA VEZ em cada ambiente (local, testes e produção), no editor SQL do
-- Supabase ou com psql, depois das migrações. Não é uma migração porque usa
-- segredos e endereços próprios de cada ambiente.
--
-- Antes, criar os dois segredos no Vault (troque os valores):
--
--   select vault.create_secret('https://<referencia-do-projeto>.supabase.co/functions/v1', 'neximob_url_funcoes');
--   select vault.create_secret('<mesmo valor de NEXIMOB_SEGREDO_CRON>', 'neximob_segredo_cron');
--
-- No Supabase local, a URL das funções é http://host.docker.internal:54321/functions/v1
--
-- Horários em UTC (o Cron do Supabase usa UTC; Brasília é UTC−3, sem horário de verão):
--   12h00        planejar os lembretes do dia (9h em Brasília)
--   12h–22h55    enviar a fila a cada 5 minutos (9h às 19h55 em Brasília)
--   12h30        conferir a saúde da rotina e alertar (9h30 em Brasília)

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- Chamada a uma Edge Function, com o segredo do Cron.
create or replace function interno.chamar_funcao(p_nome text)
returns bigint
language sql
security definer
set search_path = ''
as $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'neximob_url_funcoes') || '/' || p_nome,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'neximob_segredo_cron')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  )
$$;

revoke all on function interno.chamar_funcao(text) from public;

select cron.schedule('neximob-planejar-lembretes', '0 12 * * *',
  $$ select interno.planejar_lembretes() $$);

select cron.schedule('neximob-enviar-lembretes', '*/5 12-22 * * *',
  $$ select interno.chamar_funcao('enviar-lembretes') $$);

select cron.schedule('neximob-alerta-rotina', '30 12 * * *',
  $$ select interno.chamar_funcao('alerta-rotina') $$);

-- Conferir:
--   select jobname, schedule, active from cron.job where jobname like 'neximob-%';
-- Histórico de execuções:
--   select * from cron.job_run_details order by start_time desc limit 20;
