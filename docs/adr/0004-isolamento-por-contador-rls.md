# ADR-0004: Isolamento dos dados entre contadores com RLS

- **Status:** Aceita
- **Data:** 09/11/2026
- **Requisitos:** RF-41, RNF-05, RNF-06, Q-14

## Contexto

- Cada contador guarda dados de terceiros: nomes, contatos, valores e situação fiscal dos clientes. Um contador ver os dados de outro seria um incidente de LGPD e acabaria com a confiança no produto.
- Com o Supabase (ADR-0001), o navegador pode consultar o banco diretamente pela API do Supabase, usando a sessão do contador. Se o isolamento dependesse só do código das telas ou das rotas, um único erro exporia os dados.
- Na F2, vale uma conta por contador (Q-14).

## Decisão

O isolamento é garantido **no banco**, pelas políticas de acesso por linha do Postgres (RLS, *Row Level Security*).

1. **RLS ligada em todas as tabelas** do esquema exposto pela API (`public`), sem exceção. Um teste automatizado falha se alguma tabela estiver sem RLS.
2. **`contadores.id` é o id do usuário no Supabase Auth** (`auth.users.id`).
3. **Coluna `contador_id` em todas as tabelas de dados do contador**: `clientes`, `cobrancas`, `envios`, `envio_cobrancas`, `regua`, `obrigacoes` e `obrigacoes_feitas`. A informação fica repetida de propósito, mesmo quando daria para descobrir o contador por outra tabela, para que cada política seja uma comparação simples. Nos registros criados pela sessão do contador, o valor padrão é `auth.uid()`.
4. **A mesma política em todas essas tabelas**, para o papel `authenticated`, com índice na coluna filtrada:

   ```sql
   alter table cobrancas enable row level security;

   create policy "contador acessa só os próprios dados"
   on cobrancas for all
   to authenticated
   using (contador_id = (select auth.uid()))
   with check (contador_id = (select auth.uid()));

   create index cobrancas_contador_id_idx on cobrancas (contador_id);
   ```

   `(select auth.uid())`, em vez de `auth.uid()` direto, faz o Postgres calcular o valor uma vez por consulta, e não uma vez por linha. Essa é a recomendação da documentação do Supabase.
5. **Chaves estrangeiras compostas**, para que o banco recuse qualquer linha que aponte para o dado de outro contador, mesmo por erro de código ou pela chave de serviço:

   ```sql
   alter table clientes
     add constraint clientes_id_contador_uk unique (id, contador_id);

   alter table cobrancas
     add constraint cobrancas_cliente_fk
     foreign key (cliente_id, contador_id) references clientes (id, contador_id);
   ```

   O mesmo vale para `envios` → `clientes` e `regua`, `envio_cobrancas` → `envios` e `cobrancas`, e `obrigacoes_feitas` → `obrigacoes` e `clientes`.
6. **Tabelas de referência globais** (por exemplo, o calendário fiscal padrão, `obrigacoes_padrao`, decisão da Q-08) têm política só de leitura para `authenticated`. Não existe política de escrita: só a plataforma as altera, por migração.
7. **A chave secreta do Supabase (`service_role`) ignora a RLS.** Ela só é usada no servidor, em dois pontos: a rotina diária e os avisos dos provedores (webhooks). Nunca vai para o navegador nem para variáveis `NEXT_PUBLIC_*`, e o código que a usa sempre filtra por `contador_id` explicitamente. As ações do contador nas rotas do Next.js usam a sessão dele, e a RLS continua valendo.
8. **Views** são criadas com `security_invoker = true`, para que respeitem a RLS de quem consulta. Funções `security definer` são evitadas; quando forem indispensáveis, fixam o `search_path` e filtram por `auth.uid()`.
9. **Testes automatizados** com pgTAP, rodados pela CLI do Supabase (`supabase test db`) a cada mudança:
   - existem dois contadores, A e B;
   - em cada tabela, B não lê, não altera, não apaga e não cria linhas de A;
   - B não consegue inserir uma linha com o `contador_id` de A;
   - B não consegue criar uma cobrança que aponte para um cliente de A;
   - toda tabela do esquema `public` tem RLS ligada.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Filtrar por contador só no código (rotas e consultas) | Um esquecimento expõe dados. Além disso, o navegador acessa o banco diretamente pela API do Supabase |
| Um esquema ou um banco por contador | Migrações e operação muito mais complexas, sem necessidade para o porte esperado |
| Políticas que descobrem o contador por consultas encadeadas, sem repetir `contador_id` | Mais lentas e mais fáceis de errar. Cada tabela teria uma política diferente |

## Consequências

**Positivas**
- O isolamento vale mesmo que uma tela ou rota tenha um erro.
- Políticas iguais em todas as tabelas, fáceis de revisar e de testar.
- As chaves compostas impedem referências cruzadas também nos processos do servidor.

**Negativas e cuidados**
- O `contador_id` repetido precisa ser consistente. As chaves compostas garantem isso.
- A chave secreta é o ponto sensível. Ela fica só nas variáveis de ambiente do servidor, com uso restrito aos dois pontos acima, e deve ser trocada se houver suspeita de vazamento.
- **(proposto)** Não existe acesso de "administrador" pelo app. Atendimentos de suporte usam o painel do Supabase, com registro de quem acessou e por quê.
- Se a Q-14 mudar e um escritório passar a ter vários usuários, `contador_id` passa a identificar a conta do escritório, e a política passa a verificar se o usuário participa dessa conta (tabela de membros). A mudança fica concentrada nas políticas.
