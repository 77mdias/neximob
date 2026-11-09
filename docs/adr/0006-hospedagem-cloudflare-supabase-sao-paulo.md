# ADR-0006: Hospedagem na Cloudflare, Supabase em São Paulo e TypeScript

- **Status:** Aceita
- **Data:** 09/11/2026
- **Requisitos:** RNF-03, RNF-08, RNF-10, RNF-12, RNF-16
- **Completa:** ADR-0001 (pontos pendentes de hospedagem, região e linguagem)

## Contexto

- A ADR-0001 definiu Next.js + Supabase e deixou em aberto onde hospedar o Next.js, em que região criar o Supabase e qual linguagem usar.
- A sugestão inicial era a Vercel. O plano gratuito da Vercel é só para uso pessoal, não comercial, e a Agenda Contábil é um produto vendido por assinatura (RF-50).
- Os usuários são contadores no Brasil, e os dados de clientes estão sujeitos à LGPD.
- A rotina diária roda inteira no Supabase (ADR-0005), então a hospedagem do Next.js não afeta os lembretes.

## Decisão

| Ponto | Decisão |
|---|---|
| Hospedagem do Next.js | **Cloudflare Workers**, com o adaptador oficial **OpenNext** (`@opennextjs/cloudflare`). É o caminho que a própria Cloudflare recomenda para Next.js; o adaptador antigo para Cloudflare Pages (`next-on-pages`) foi descontinuado |
| Região do Supabase | **São Paulo** (América do Sul). A região é escolhida na criação do projeto e não muda depois sem migração |
| Linguagem | **TypeScript** no Next.js e nas Edge Functions, com os tipos do banco gerados pela CLI do Supabase |
| Acesso ao banco a partir da Cloudflare | Pela API do Supabase (`supabase-js`), por HTTPS, com a sessão do contador. Não há conexão direta ao Postgres a partir dos Workers |

**(proposto)** Deploy pelo Wrangler (CLI da Cloudflare), disparado a partir do GitHub, com um ambiente de testes separado do de produção.

## Por que Cloudflare

| # | Motivo |
|---|---|
| 1 | **Permite uso comercial** sem exigir o plano pago da Vercel |
| 2 | **Perto dos usuários e do banco.** Os Workers rodam no data center da Cloudflare mais próximo de quem acessa. Para contadores no Brasil, isso fica perto do Supabase em São Paulo, sem configurar região |
| 3 | **Custo baixo e previsível**, adequado à proposta de app barato |
| 4 | **Não muda nada no resto da arquitetura**: banco, login, isolamento e rotina diária continuam no Supabase |

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Vercel, plano gratuito | Não permite uso comercial |
| Vercel, plano pago | Viável, mas com custo maior para um produto que ainda está em validação |
| Cloudflare Pages com `next-on-pages` | Adaptador descontinuado; a recomendação atual é Workers com OpenNext |
| Servidor próprio (VPS) com Node | Mais infraestrutura para manter (atualizações, certificados, disponibilidade) |

## Consequências

**Positivas**
- Uso comercial liberado e custo baixo.
- Os dados ficam no Brasil, no Supabase em São Paulo. A Cloudflare só processa as requisições.
- TypeScript com tipos gerados do banco: uma coluna renomeada quebra a compilação, e não a tela em produção.

**Negativas e cuidados**
- **Limite de CPU no plano gratuito de Workers: 10 ms por requisição.** O tempo esperando o Supabase não conta, mas a montagem das páginas no servidor conta. Uma requisição acima do limite falha. **Recomendação:** usar o plano gratuito no desenvolvimento e na validação, medir, e prever o plano pago de Workers antes de contadores usarem o app com dados reais. O plano pago também tem limite maior de requisições por dia e de tamanho do código.
- **Supabase em produção também precisa do plano pago:** o gratuito pausa projetos sem uso e não atende aos backups diários da RNF-12. Conferir os planos e preços atuais antes da F2.
- **O adaptador OpenNext acompanha o Next.js com algum atraso.** Antes de atualizar a versão do Next.js, conferir se o adaptador já suporta a nova versão.
- **Recursos que precisam de configuração própria na Cloudflare:** otimização de imagens e cache de páginas. O app é quase todo dinâmico, por contador, e quase não depende disso.
- **Chaves.** Na Cloudflare ficam só a URL do Supabase e a chave pública (`publishable`/`anon`), que já é feita para o navegador. A chave secreta do Supabase não precisa ir para a Cloudflare: a rotina já roda no Supabase (ADR-0005), e **(proposto)** os avisos dos provedores (webhooks de Pix e WhatsApp) também podem ser recebidos por Edge Functions do Supabase. Isso será decidido na ADR das integrações.
