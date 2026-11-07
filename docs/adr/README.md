# Decisões de arquitetura (ADR)

Cada decisão de arquitetura ou de produto com impacto técnico fica registrada num arquivo próprio, com o contexto, a decisão, as alternativas e as consequências. O objetivo é que qualquer pessoa entenda **por que** o sistema é como é, e não só **como** ele é.

| ADR | Título | Status | Data |
|---|---|---|---|
| [0001](./0001-stack-nextjs-supabase.md) | Stack: Next.js + Supabase | Aceita | 07/11/2026 |
| [0002](./0002-whatsapp-modelos-fixos.md) | WhatsApp com modelos fixos aprovados; texto livre só no e-mail | Aceita | 07/11/2026 |
| [0003](./0003-cpf-cnpj-so-no-provedor.md) | CPF e CNPJ dos clientes ficam só no provedor de Pix | Aceita | 07/11/2026 |

**Próximas decisões:** isolamento de dados entre contadores, rotina diária, integrações (e-mail, WhatsApp, Pix), esquema físico do banco, hospedagem e região.

## Status

| Status | Significado |
|---|---|
| **Proposta** | Em discussão |
| **Aceita** | Em vigor |
| **Substituída** | Trocada por outra ADR, indicada no arquivo |

## Modelo

```markdown
# ADR-XXXX: Título

- **Status:** Proposta | Aceita | Substituída por ADR-YYYY
- **Data:** dd/mm/aaaa
- **Requisitos:** RF-xx, RNF-xx, Q-xx

## Contexto
O problema e as restrições.

## Decisão
O que foi decidido.

## Alternativas consideradas
O que foi descartado e por quê.

## Consequências
O que melhora, o que piora e os cuidados.
```
