# ADR-0001: Stack Next.js + Supabase

- **Status:** Aceita
- **Data:** 07/11/2026
- **Requisitos:** RNF-01, RNF-03, RNF-05, RNF-06, RF-34, RF-40 a RF-45

## Contexto

- O protótipo é uma página HTML com JavaScript puro, sem servidor. Os dados ficam no navegador.
- A versão final precisa de login por e-mail, banco de dados com uma conta por contador, rotina diária no servidor e integrações com e-mail, WhatsApp e Pix.
- O Briefing sugere Next.js e Supabase (ou Firebase), "para não montar servidor do zero", e pede para manter o visual do protótipo, tudo em português e funcionando no celular.
- É um projeto pequeno, que precisa chegar rápido ao uso com dados reais (F2).

## Decisão

| Parte | Escolha |
|---|---|
| Interface | **Next.js (React).** As telas do protótipo são reescritas como componentes, mantendo o visual |
| Servidor | **Rotas de servidor do Next.js**, para as ações que usam chaves secretas e para receber os avisos dos provedores (webhooks) |
| Banco de dados | **Postgres do Supabase**, com o modelo lógico do SRS (seção 5) |
| Login | **Supabase Auth**, com login por e-mail |
| Isolamento entre contadores | Políticas de acesso do Postgres (RLS). Detalhes numa ADR própria |
| Rotina diária | Agendamento no servidor. Detalhes numa ADR própria |

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Firebase | O banco principal (Firestore) é de documentos. O modelo do produto é relacional (contador → clientes → cobranças → envios), com somas e filtros por mês que ficam mais simples e mais seguros em SQL |
| JavaScript puro, como o protótipo | Serve para telas simples, mas login, rotas de servidor e webhooks exigiriam montar um servidor à parte |
| Servidor próprio (por exemplo, Node com Postgres gerenciado) | Mais infraestrutura para manter. O Supabase já entrega banco, login e políticas de acesso |

## Consequências

**Positivas**
- Login, banco e regras de acesso prontos: menos código de infraestrutura.
- Postgres padrão: as restrições do modelo (dia de vencimento de 1 a 28, uma cobrança por cliente e mês) ficam garantidas no próprio banco.
- O mesmo código atende o celular e o computador (RNF-01, RNF-03).

**Negativas e cuidados**
- Dependência do Supabase. **(proposto)** Mitigação: migrações SQL versionadas no repositório e preferência por recursos padrão do Postgres, para facilitar uma eventual troca.
- A chave de serviço do Supabase ignora as políticas de acesso. Ela só pode ser usada no servidor, nunca no navegador.
- Backups e limites dependem do plano contratado. Conferir o plano antes da F2 para cumprir a RNF-12.

## Pontos para as próximas ADRs

| Ponto | Sugestão |
|---|---|
| Hospedagem do Next.js | Vercel, pela integração nativa com o Next.js |
| Região do Supabase | São Paulo, perto dos usuários |
| Linguagem | TypeScript, para tipar o modelo de dados de ponta a ponta |
| Isolamento, rotina diária e integrações | Uma ADR para cada |
