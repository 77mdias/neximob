# Neximob

Sistema simples para o contador autônomo ou de escritório pequeno: cadastra o cliente uma vez e o sistema cuida da cobrança mensal dos honorários e do checklist de prazos fiscais.

> Nas fontes originais (Documentação do Produto e Briefing), o produto se chamava "Agenda Contábil"; no protótipo, "Prazo Certo".

## Documentação

| Documento | Conteúdo |
|---|---|
| [PRD](docs/PRD.md) | Problema, público, objetivos, escopo, roadmap e decisões |
| [SRS](docs/SRS.md) | Requisitos, regras de negócio, modelo de dados e questões |
| [Mapa de fluxo](docs/Mapa%20de%20fluxo.md) | Telas e caminhos do usuário |
| [Arquitetura](docs/Arquitetura.md) | Componentes, esquema físico, segurança, ambientes e publicação |
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

O passo a passo de configuração de cada ambiente está na [API](docs/API.md), seção 6.
