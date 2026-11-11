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
| [ADRs](docs/adr/README.md) | Decisões de arquitetura, uma por arquivo |

## Banco de dados

O esquema e os testes ficam em [`supabase/`](supabase):

- `supabase/migrations/`: tabelas, regras de acesso (RLS), funções e calendário padrão;
- `supabase/tests/database/`: testes pgTAP do isolamento entre contadores e das regras de negócio.

Para rodar os testes, com a [CLI do Supabase](https://supabase.com/docs/guides/local-development/cli/getting-started) e o Docker instalados:

```bash
supabase start
supabase test db
```
