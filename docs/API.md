# API do backend: Neximob

**Contrato entre o front e o backend**

| | |
|---|---|
| **Produto** | Neximob |
| **Versão** | 1.0 |
| **Data** | 12/11/2026 |
| **Implementação** | [`supabase/migrations/`](../supabase/migrations) e [`supabase/functions/`](../supabase/functions) |
| **Documentos relacionados** | [SRS](./SRS.md) · [Arquitetura](./Arquitetura.md) · [Decisões de arquitetura (ADR)](./adr/README.md) |

Este documento diz o que o front chama para cada tela e ação, o que volta e quais erros tratar. O backend cobre as fases F2 (base) e F3 (cobrança por e-mail). WhatsApp e Pix (F4) e assinatura (F5) ainda não estão implementados.

---

## 1. Como o front acessa o backend

O front usa a biblioteca `@supabase/supabase-js` com a **chave pública** do Supabase e a **sessão do contador** (ADR-0001, ADR-0006). Toda leitura e gravação passa pela RLS: o contador só alcança os próprios dados (ADR-0004).

| Forma | Exemplo | Quando |
|---|---|---|
| **Supabase Auth** | `supabase.auth.signInWithPassword({ email, password })` | Cadastro, login, recuperação, saída |
| **Tabela direta** | `supabase.from('clientes').insert({...})` | Cadastros simples (clientes, régua, perfil, calendário) |
| **Função (RPC)** | `supabase.rpc('resumo_do_mes', { p_mes: '2026-11-01' })` | Consultas da tela e ações com regra de negócio |
| **Edge Function** | `supabase.functions.invoke('excluir-conta', { body })` | Só a exclusão de conta |

**Convenções**

| Item | Formato |
|---|---|
| Mês de referência | Data do dia 1 do mês: `'2026-11-01'` |
| Datas | `'AAAA-MM-DD'`, no fuso de Brasília |
| Valores | Reais, com duas casas (`numeric`) |
| Identificadores | UUID |
| Erros | Objeto do PostgREST: `{ code, message, details, hint }` (seção 5) |

---

## 2. Conta e login (ADR-0008)

| Ação | Chamada | Requisito |
|---|---|---|
| Criar conta | `supabase.auth.signUp({ email, password, options: { data: { nome }, emailRedirectTo } })`. O banco cria o perfil, a régua padrão e o calendário padrão sozinho | RF-40, RF-42 |
| Confirmar e-mail | O link do e-mail volta para o app, que troca o código pela sessão (`exchangeCodeForSession`) | RF-40 |
| Entrar | `supabase.auth.signInWithPassword({ email, password })` | RF-40 |
| Esqueci minha senha | `supabase.auth.resetPasswordForEmail(email, { redirectTo })` e, na tela de nova senha, `supabase.auth.updateUser({ password })` | RF-45 |
| Sair | `supabase.auth.signOut()` | RF-45 |
| Aceitar os termos | `rpc('aceitar_termos', { p_versao })` → data e hora do aceite | RF-43 |
| Ler o perfil | `from('contadores').select('*').single()` | RF-42 |
| Alterar o perfil | `from('contadores').update({ nome, chave_pix, texto_pendencia })` | RF-33, RF-42 |
| Exportar os dados | `rpc('exportar_meus_dados')` → JSON com perfil, clientes, cobranças, régua, obrigações e envios | RF-44 |
| Excluir a conta | `functions.invoke('excluir-conta', { body: { confirmacao: 'EXCLUIR' } })`. Apaga tudo em cascata | RF-44 |

Senha com no mínimo 8 caracteres. O e-mail precisa ser confirmado antes do primeiro acesso.

---

## 3. Operações por tela

### 3.1 Topo e resumo do mês

| Ação | Chamada | Requisito |
|---|---|---|
| Abrir um mês | `rpc('garantir_cobrancas', { p_mes })` → quantas cobranças foram criadas. Chamar ao abrir o mês corrente ou um mês futuro; não duplica | RF-02 |
| Resumo do mês | `rpc('resumo_do_mes', { p_mes })` | RF-03 |

`resumo_do_mes` devolve uma linha:

| Campo | Significado |
|---|---|
| `recebido` | Soma das cobranças pagas do mês |
| `a_receber` | Soma das cobranças em aberto do mês |
| `percentual_recebido` | Inteiro de 0 a 100, para a barra do card "Recebido" |
| `em_aberto_meses_anteriores` | Total em aberto de meses anteriores (linha abaixo de "A receber") |
| `clientes_em_atraso` | Clientes com alguma cobrança atrasada, deste mês ou de antes |
| `guias_a_fazer` | Guias que faltam marcar nas obrigações do mês |

### 3.2 Aba Cobranças

| Ação | Chamada | Requisito |
|---|---|---|
| Lista do mês | `rpc('cobrancas_do_mes', { p_mes, p_filtro })`, com `p_filtro` = `'todos'`, `'em_atraso'`, `'a_vencer'` ou `'pagos'`. Já vem na ordem certa | RF-10, RF-11, RF-15, RF-18 |
| Marcar como pago | `rpc('registrar_pagamento', { p_cobranca_id, p_forma, p_data })`. `p_data` é opcional (padrão: hoje) | RF-12 |
| Desfazer pagamento | `rpc('desfazer_pagamento', { p_cobranca_id })` | RF-12 |
| Ajustar o valor do mês | `rpc('ajustar_valor_do_mes', { p_cobranca_id, p_extra, p_motivo })` → total do mês. Extra zero desfaz | RF-13 |
| Botão Cobrar (mensagem) | `rpc('mensagem_para_cobrar', { p_cobranca_id })` → `regua_id`, `dias`, `assunto`, `texto`, `cobrancas` | RF-14 |
| Registrar o envio manual | `rpc('registrar_envio_manual', { p_cobranca_id })` → id do envio. Chamar depois que o contador copiar a mensagem | RF-14 |
| Envios de um cliente | `from('envios').select('*').eq('cliente_id', id).order('criado_em', { ascending: false })` | RF-35 |

`cobrancas_do_mes` devolve uma linha por cobrança:

| Campo | Significado |
|---|---|
| `cobranca_id`, `cliente_id`, `cliente_nome`, `tipo` | Identificação |
| `vencimento`, `valor`, `extra`, `total`, `motivo_extra` | Valores do mês (total = valor + extra) |
| `situacao` | `pago`, `a_vencer`, `vence_hoje` ou `atrasado` (RN-02) |
| `dias_atraso` | Dias desde o vencimento, se em aberto |
| `pago_em`, `forma` | Pagamento, se houver |
| `meses_em_aberto_anteriores`, `total_em_aberto_anteriores` | Pendências de meses anteriores, para o selo "N meses em aberto" (RN-18) |
| `proximo_lembrete`, `proximo_lembrete_tipo` | Data e tipo (`passo` ou `pendencia`) do próximo lembrete automático. Só para o mês corrente ou futuros |
| `sem_contato` | Cliente sem e-mail e sem telefone: não recebe lembrete automático (RN-17) |
| `email_situacao` | `ok`, `devolvido` ou `spam`: com problema, o e-mail não recebe lembretes até ser corrigido (RN-24) |

Rótulos da situação na tela (RF-10): `pago` → "Pago"; `a_vencer` → "Vence dia X"; `vence_hoje` → "Vence hoje"; `atrasado` → "Atrasado há N dias".

### 3.3 Clientes

| Ação | Chamada | Requisito |
|---|---|---|
| Cadastrar | `from('clientes').insert({ nome, tipo, honorario, dia_vencimento, cobranca_inicio, telefone, email, canais })` | RF-01, RF-05 |
| Editar | `from('clientes').update({...}).eq('id', id)` | RF-04 |
| Inativar ou reativar | `from('clientes').update({ ativo }).eq('id', id)` | RF-06 |
| Excluir | `from('clientes').delete().eq('id', id)`. Apaga cobranças, envios e marcações do cliente | RF-04 |

- `tipo`: `MEI`, `SIMPLES` ou `PF`. `dia_vencimento`: de 1 a 28. `telefone`: formato `+55` com DDD (`+5511999990000`).
- `cobranca_inicio` (RN-21): se o dia de vencimento deste mês já passou, perguntar se a cobrança começa **este mês** (dia 1 do mês corrente) ou no **próximo** (dia 1 do mês seguinte, o padrão). Se não passou, enviar o mês corrente.
- `canais`: por padrão `['email', 'whatsapp']`. Na F3 só o e-mail é usado.
- Mudar o honorário ou o dia de vencimento atualiza sozinho as cobranças em aberto do mês corrente em diante (RN-14).
- Corrigir o e-mail volta `email_situacao` para `ok`. O front não altera `email_situacao` nem `provedor_cliente_id` (são do sistema).

### 3.4 Aba Obrigações

| Ação | Chamada | Requisito |
|---|---|---|
| Obrigações do mês | `rpc('obrigacoes_do_mes', { p_mes })` | RF-20 a RF-22 |
| Checklist de uma obrigação | `rpc('clientes_da_obrigacao', { p_obrigacao_id, p_mes })` → `cliente_id`, `nome`, `tipo`, `feito`, `feito_em` | RF-21 |
| Marcar ou desmarcar | `rpc('marcar_obrigacao', { p_obrigacao_id, p_cliente_id, p_mes, p_feito })` | RF-21 |
| Próximos prazos do ano | `rpc('proximos_prazos', { p_a_partir, p_meses })`. Ambos opcionais (padrão: hoje e 12 meses) | RF-24 |
| Calendário editável (F5) | `from('obrigacoes')`: inserir, editar (com `personalizada: true`), desativar (`ativo: false`) ou excluir | RF-23 |

`obrigacoes_do_mes` e `proximos_prazos` devolvem:

| Campo | Significado |
|---|---|
| `obrigacao_id`, `nome`, `periodicidade` | Identificação (`mensal` ou `anual`) |
| `prazo` | Data do prazo naquele mês |
| `periodo` | `AAAA-MM` (mensal) ou `AAAA` (anual) |
| `competencia` | Texto para mostrar ao lado do vencimento: "outubro", "dezembro de 2025" ou "2025" (RN-23) |
| `total_clientes`, `feitos` | Para o "X de Y feitos" e a barra |
| `situacao_prazo` | `a_vencer`, `vence_hoje`, `vencida`, `concluida` (todos feitos) ou `sem_clientes` |
| `dias_para_o_prazo` | Para o aviso "Faltam N dias" (negativo quando já venceu) |

### 3.5 Aba Régua de cobrança

| Ação | Chamada | Requisito |
|---|---|---|
| Passos | `from('regua').select('*').order('dias')` → os 4 passos (−3, 0, 3, 7) | RF-30 |
| Ligar, desligar, editar o texto | `from('regua').update({ ativo, texto }).eq('id', id)` | RF-31 |
| Restaurar o texto padrão | `rpc('restaurar_texto_padrao', { p_regua_id })` | RF-31 |
| Texto de pendência | `contadores.texto_pendencia` (ler e alterar pelo perfil); `rpc('restaurar_texto_pendencia')` | RF-31, Q-02 |
| Campos desconhecidos | `rpc('campos_desconhecidos', { p_texto })` → lista, por exemplo `['{nomee}']` | RF-32 |
| Prévia | `rpc('previa_mensagem', { p_texto, p_tipo })`, com `p_tipo` = `'passo'` (padrão) ou `'pendencia'` | RF-33 |
| Chave Pix | `contadores.chave_pix` | RF-33 |

Campos aceitos nos textos: `{nome}` (primeiro nome), `{mes}` ("novembro"), `{valor}` ("R$ 1.234,56"), `{venc}` ("10/11") e `{pix}`. As pendências de meses anteriores entram sozinhas, num bloco no fim da mensagem (RN-19). No WhatsApp (F4), os textos serão modelos fixos (ADR-0002); a aba só mostrará a prévia.

### 3.6 Leitura direta disponível

| Tabela ou view | Para quê |
|---|---|
| `contadores` | Perfil do contador |
| `clientes` | Cadastro |
| `cobrancas` e a view `cobrancas_situacao` | Cobranças, com situação e total calculados |
| `regua` | Passos da régua |
| `obrigacoes`, `obrigacoes_padrao`, `obrigacoes_feitas` | Calendário e marcações |
| `envios`, `envio_cobrancas` | Histórico de envios (RF-35) |

---

## 4. Valores possíveis

| Tipo | Valores |
|---|---|
| `tipo_cliente` | `MEI`, `SIMPLES`, `PF` |
| `forma_pagamento` | `pix`, `transferencia`, `dinheiro`, `outro` |
| `situacao_cobranca` | `pago`, `a_vencer`, `vence_hoje`, `atrasado` |
| `status_envio` | `pendente`, `enviando`, `enviado`, `entregue`, `lido`, `falhou`, `pulado`, `cancelado` |
| `canal_envio` | `email`, `whatsapp`, `manual` |
| `situacao_email` | `ok`, `devolvido`, `spam` |
| `situacao_prazo` | `a_vencer`, `vence_hoje`, `vencida`, `concluida`, `sem_clientes` |

---

## 5. Erros

| Código | Quando acontece | Sugestão de mensagem |
|---|---|---|
| `23514` | Regra do cadastro: dia de vencimento fora de 1 a 28, telefone fora do formato, extra sem motivo, pagamento sem forma | Explicar o campo, por exemplo "O dia de vencimento deve ser de 1 a 28" |
| `23505` | Duplicata, por exemplo duas cobranças do mesmo cliente no mesmo mês | "Este registro já existe" |
| `23503` | Referência a um registro que não existe ou não é do contador | "Registro não encontrado" |
| `42501` | Sem permissão: dado de outro contador, campo do sistema ou sessão expirada | Pedir para entrar de novo, se a sessão expirou |
| `22023` | Valor inválido: filtro desconhecido, cobrança já paga no botão Cobrar, obrigação que não se aplica ao tipo do cliente | Mostrar a `message` do erro |
| `P0002` | Registro não encontrado | "Registro não encontrado" |

As mensagens (`message`) das funções já vêm em português.

---

## 6. Backend interno (não chamar pelo front)

| Peça | O que faz | Quem chama |
|---|---|---|
| `interno.planejar_lembretes()` | Planeja os lembretes do dia e recupera dias perdidos | Supabase Cron, 9h de Brasília |
| Edge Function `enviar-lembretes` | Envia a fila pelo Resend | Supabase Cron, a cada 5 minutos, das 9h às 20h |
| Edge Function `alerta-rotina` | Alerta por e-mail se a rotina falhar | Supabase Cron, 9h30 |
| Edge Function `avisos-email` | Recebe os avisos do Resend (entregue, devolvido, spam, falhou) | Resend |
| Funções `rotina_*` | Fila, mensagem do envio, resultado, avisos, saúde | Só as Edge Functions (`service_role`) |

**Configuração por ambiente**
1. Aplicar as migrações (`supabase db push`).
2. Cadastrar as variáveis das Edge Functions (modelo em [`supabase/functions/.env.example`](../supabase/functions/.env.example)) e publicar as funções (`supabase functions deploy`).
3. Criar os dois segredos no Vault e rodar [`supabase/setup/agendar_rotina.sql`](../supabase/setup/agendar_rotina.sql).
4. No Resend, cadastrar o aviso (webhook) para `https://<projeto>.supabase.co/functions/v1/avisos-email`, com os eventos `email.delivered`, `email.bounced`, `email.complained` e `email.failed`. Copiar o segredo de assinatura para `RESEND_WEBHOOK_SECRET`.
5. No Supabase Auth, configurar o SMTP do Resend e as URLs de retorno do app (confirmação e nova senha).

---

## 7. Requisitos cobertos pelo backend

| Requisitos | Situação no backend |
|---|---|
| RF-01 a RF-06 (clientes e resumo) | Pronto |
| RF-10 a RF-15, RF-18 (cobranças) | Pronto |
| RF-16 (envio real) | Pronto para e-mail; WhatsApp na F4 |
| RF-17 (Pix com baixa automática) | F4, depende do provedor (Q-17, Q-18) |
| RF-20 a RF-24 (obrigações) | Pronto. A tela do calendário editável (RF-23) é da F5, mas a tabela já aceita as alterações |
| RF-30 a RF-35 (régua e rotina) | Pronto |
| RF-40 a RF-45 (conta) | Pronto (Supabase Auth, funções e exclusão de conta) |
| RF-50 (assinatura) | F5 |
| RF-60 (página do cliente) | Em aberto |

---

## 8. Rodar e testar localmente

```bash
supabase start                      # Supabase local (precisa de Docker)
supabase test db                    # 175 testes pgTAP do banco
deno test supabase/functions/_shared  # 21 testes das Edge Functions
supabase functions serve --env-file supabase/functions/.env
supabase gen types typescript --local > tipos-do-banco.ts   # tipos para o front
```

---

## 9. Histórico do documento

| Versão | Data | Alteração |
|---|---|---|
| 1.0 | 12/11/2026 | Primeira versão: backend das fases F2 e F3 |
