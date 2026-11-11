-- Agenda Contábil: calendário fiscal padrão de 2026 (RF-20, Q-08)
--
-- ATENÇÃO: datas de exemplo, como no protótipo. Precisam ser conferidas por
-- um contador antes do lançamento. O app não ajusta sozinho prazos que caem
-- em fim de semana ou feriado (Q-06); a correção é feita aqui, no calendário
-- do ano, ou pelo contador na própria conta (RF-23).
--
-- Competência mostrada (RN-23): período anterior ao do prazo.
--   DAS-MEI e DAS: mês anterior. DEFIS, DASN-SIMEI e IRPF: ano anterior.

insert into public.obrigacoes_padrao
  (ano, codigo, nome, tipos_cliente, periodicidade, prazo_dia, prazo_mes, competencia)
values
  (2026, 'DAS-MEI',    'DAS-MEI',        array['MEI']::public.tipo_cliente[],     'mensal', 20, null, 'periodo_anterior'),
  (2026, 'DAS',        'DAS do Simples', array['SIMPLES']::public.tipo_cliente[], 'mensal', 20, null, 'periodo_anterior'),
  (2026, 'DEFIS',      'DEFIS',          array['SIMPLES']::public.tipo_cliente[], 'anual',  31, 3,    'periodo_anterior'),
  (2026, 'DASN-SIMEI', 'DASN-SIMEI',     array['MEI']::public.tipo_cliente[],     'anual',  31, 5,    'periodo_anterior'),
  (2026, 'IRPF',       'IRPF',           array['PF']::public.tipo_cliente[],      'anual',  31, 5,    'periodo_anterior');
