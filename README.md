# Neximob

Sistema simples para o contador autônomo ou de escritório pequeno: cadastra o cliente uma vez e o sistema cuida da cobrança mensal dos honorários e do checklist de prazos fiscais.

> Nas fontes originais (Documentação do Produto e Briefing), o produto se chamava "Agenda Contábil".

## Documentação

| Documento | Conteúdo |
|---|---|
| [PRD](docs/PRD.md) | Problema, público, objetivos, escopo, roadmap e decisões |
| [SRS](docs/SRS.md) | Requisitos, regras de negócio, modelo de dados e questões |
| [Mapa de fluxo](docs/Mapa%20de%20fluxo.md) | Telas e caminhos do usuário |
| [Direção visual](docs/Dire%C3%A7%C3%A3o%20visual.md) | Visual do app: o que vem da referência, status, histórias de interface e prioridade |
| [Design System](docs/Design%20System.md) | Tokens claro/escuro, contraste WCAG, telas, microcopy e acessibilidade |
| [Arquitetura](docs/Arquitetura.md) | Componentes, esquema físico, segurança, ambientes e publicação |
| [Plano de Engenharia Frontend](docs/Plano%20de%20Engenharia%20Frontend.md) | Desenho de sistemas do app Next.js e tarefas atômicas (`FE-01` a `FE-10`) |
| [API](docs/API.md) | O que o front chama para cada tela e ação |
| [ADRs](docs/adr/README.md) | Decisões de arquitetura, uma por arquivo |

## Backend

O backend fica em [`supabase/`](supabase) e cobre as fases F2 (base) e F3 (cobrança por e-mail):

- `supabase/migrations/`: tabelas, regras de acesso (RLS), regras de negócio, funções da tela e rotina diária;
- `supabase/functions/`: Edge Functions (envio dos lembretes, avisos do Resend, alerta da rotina, exclusão de conta);
- `supabase/tests/database/`: 175 testes pgTAP;
- `supabase/setup/agendar_rotina.sql`: agendamento da rotina, rodado uma vez por ambiente.

Para rodar os testes, com a [CLI do Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started), o Docker e o [Deno](https://deno.com) instalados:

```bash
supabase start
supabase test db
deno test supabase/functions/_shared
```

Os mesmos testes rodam sozinhos no GitHub Actions a cada pull request ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

O passo a passo de configuração de cada ambiente está na [API](docs/API.md), seção 6.

## Frontend (Next.js + vinext)

O app web fica em [`src/`](src) e usa Next.js 16 (App Router) empacotado com `vinext` para Cloudflare Workers, Tailwind CSS v4, fontes variáveis auto-hospedadas em [`public/fonts/`](public/fonts) e autenticação SSR com Supabase.

### Desenvolvimento local

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local` apontando para o Supabase local (`supabase start`) ou projeto de desenvolvimento. Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no app web.

### Verificações

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
