# ADR-0009: Arquitetura do frontend Next.js (vinext na Cloudflare, Tailwind v4, fontes self-hosted e sessão SSR)

- **Status:** Aceita
- **Data:** 27/11/2026
- **Autor:** Principal Systems Architect
- **Requisitos:** RF-01 a RF-45, RNF-01 a RNF-03, RNF-05 a RNF-08, RNF-10, RNF-13, RNF-16, DV-01 a DV-11
- **Atualiza:** [ADR-0006](./0006-hospedagem-cloudflare-supabase-sao-paulo.md) (substitui o adaptador OpenNext pelo `vinext`)

## Contexto

Com o backend no Supabase pronto (migrações, RLS, 175 testes pgTAP e Edge Functions) e o Design System + prévias visuais aprovados (`DV-01` a `DV-11`), precisamos fechar a engenharia interna do app Next.js antes da codificação:

1. **Adaptador na Cloudflare Workers:** a ADR-0006 (09/11/2026) citava `@opennextjs/cloudflare`. Em 16/11/2026, a Cloudflare passou a recomendar oficialmente o **`vinext`** (reimplementação da superfície do Next.js 16 sobre Vite + `@cloudflare/vite-plugin`) para projetos novos nos Workers.
2. **Onde vive o tema (`neximob-theme.css`) e como evitar flash de tema (RNF-02, DV-01):** o app precisa seguir `prefers-color-scheme` por padrão e aceitar escolha manual (`Sistema · Claro · Escuro`) salva no navegador sem piscar na primeira pintura, inclusive trocando a logo entre claro e escuro.
3. **Como servir `Inter` e `Newsreader` nos Workers (DV-01, RNF-05, RNF-10):** a `DV-01` limita a no máximo 2 famílias e 4 arquivos `.woff2` com `font-display: swap` e zero peso sintetizado; a `RNF-10` pede tela principal em até 2 s no 4G com 300 clientes; e a LGPD (`RNF-05`, `RNF-16`) desaconselha buscar fontes na CDN do Google (que expõe o IP do contador e, no `vinext`, é o comportamento de `next/font/google`).
4. **Ícones, sessão SSR, latência de filtros e aceite de termos (RF-43):**
   - No Next.js 16 e no `vinext`, declarar `icons` em `metadata` desliga rotas de ícone dentro de `src/app/`;
   - No `workerd`, objetos de I/O e clientes de sessão não podem ser globais entre requisições;
   - Com confirmação de e-mail obrigatória (`enable_confirmations = true`, ADR-0008), `signUp` não abre sessão imediata, então `rpc('aceitar_termos')` não pode rodar antes da confirmação;
   - A função `cobrancas_do_mes(p_mes, p_filtro)` aceita `'todos' | 'em_atraso' | 'a_vencer' | 'pagos'`, enquanto a barra visual (`DV-04`) destaca também o filtro rápido `Vence hoje (N)`.

## Decisão

### 1. Runtime Next.js 16 sobre `vinext` na Cloudflare Workers
- Usamos **Next.js 16** (App Router em `src/app/`, React 19.3, TypeScript 5 estrito) executado pelo **`vinext`** sobre **Vite 8** + **`@cloudflare/vite-plugin`** + **`wrangler`** (`wrangler.jsonc` com `main: "vinext/server/app-router-entry"` e `nodejs_compat`).
- Todo o código da aplicação usa os imports padrão `next/*` (`next/navigation`, `next/headers`, `next/server`, `next/link`), sem acoplamento proprietário na árvore de UI.
- Gerenciador `pnpm` com **versões exatas** no `package.json` (sem `^`) e **`pnpm-workspace.yaml` próprio na raiz** (`packages: ["."]`), isolando o repositório de workspaces globais da máquina de desenvolvimento.

### 2. Fonte única do tema Tailwind CSS v4 (`src/app/neximob-theme.css`)
- O arquivo `docs/neximob-theme.css` passa a viver em **`src/app/neximob-theme.css`** (fonte única de verdade da `DV-01`, sem cópia duplicada em `docs/`), importado por `src/app/globals.css` via `@tailwindcss/postcss`.
- Incorporam-se ao arquivo os dois tokens validados na prévia visual aprovada: `--nx-input-bg` (`#faf9f5` claro / `#191f22` escuro) e `--nx-header-bg` (`rgba(255,255,255,0.92)` claro / `rgba(29,35,38,0.92)` escuro).
- **Zero flash de tema e de marca:** um script inline síncrono mínimo no `<head>` de `src/app/layout.tsx` lê `localStorage.getItem("neximob-theme")` e define `data-theme="light"` ou `"dark"` em `<html>` apenas quando há escolha manual explícita; no modo `"system"`, remove `data-theme` e deixa o bloco `@media (prefers-color-scheme: dark)` agir nativamente. O componente de logo renderiza os SVGs claro e escuro de `public/brand/` alternados por CSS puro, sem esperar hidratação.

### 3. Fontes variáveis self-hosted na borda (`public/fonts/`)
- **Não usar `next/font/google`.** Copiamos de `@fontsource-variable/inter` e `@fontsource-variable/newsreader` exatamente **2 arquivos `.woff2` variáveis** para `public/fonts/`:
  1. `public/fonts/inter-latin-wght-normal.woff2` (pesos `400–600`, `tabular-nums`, subset `latin` `U+0000–00FF` cobrindo toda a acentuação em português e símbolos monetários);
  2. `public/fonts/newsreader-latin-wght-normal.woff2` (pesos `300–500`, estilo normal, subset `latin` `U+0000–00FF`).
- Os dois arquivos são servidos diretamente pelo **Cloudflare Workers Static Assets** no mesmo domínio HTTP/3 com `Cache-Control: public, max-age=31536000, immutable` (`public/_headers`), consumindo **0 ms de CPU do Worker** e zero conexão externa.
- `src/app/fonts.css` declara `@font-face` com `font-display: swap` e `html { font-synthesis: none; }`. Apenas `inter-latin-wght-normal.woff2` recebe `<link rel="preload">` no `<head>`, priorizando a leitura imediata da tabela/cartões no 4G.

### 4. Ícones e ativos estáticos exclusivamente em `public/`
- Todos os favicons, ícones PWA, `site.webmanifest`, `og-image.png` e variações da marca permanecem em `public/` e `public/brand/`, declarados via `metadata` e `viewport` em `src/app/layout.tsx`.
- **Proibido** criar `favicon.ico`, `icon.*` ou `apple-icon.*` dentro de `src/app/`, evitando o conflito em que `metadata.icons` desativa rotas de ícone por arquivo no Next 16 / `vinext`.

### 5. Sessão SSR por requisição, `src/proxy.ts` e aceite de termos (RF-43)
- O cliente Supabase de servidor (`@supabase/ssr`) é instanciado **por requisição** em `src/server/supabase/server.ts` (`import "server-only"`), nunca em variável global de módulo.
- `src/proxy.ts` renova o cookie de sessão a cada navegação e faz o redirecionamento rápido entre rotas públicas (`/entrar`, `/criar-conta`, `/esqueci-senha`) e autenticadas (`/`, `/primeiros-passos`). Toda Server Action e todo Server Component revalida o usuário com `supabase.auth.getUser()` (nunca `getSession()`).
- **Aceite de termos com confirmação de e-mail (`RF-43`):** no cadastro (`signUp`), o formulário exige o checkbox desmarcado por padrão e grava `termos_versao_pendente` nos metadados do usuário (`raw_user_meta_data`). Na rota `/auth/callback/route.ts` — logo após `exchangeCodeForSession` estabelecer a sessão autenticada — e como guarda idempotente ao abrir o painel se `contadores.termos_aceitos_em` for nulo, o servidor executa `rpc('aceitar_termos', { p_versao })`.

### 6. Fluxo de dados da tela única, filtros em `0 ms` e mutações otimistas (`≤ 250 ms`)
- Ao abrir `/` (mês de referência em `?mes=AAAA-MM`, padrão mês corrente em `America/Sao_Paulo`), o Server Component chama `garantir_cobrancas(p_mes)` e em seguida um único `Promise.all` paralelo com `resumo_do_mes(p_mes)`, `cobrancas_do_mes(p_mes, 'todos')`, `obrigacoes_do_mes(p_mes)`, `proximos_prazos()`, `regua` e `contadores`. Páginas autenticadas enviam `Cache-Control: private, no-store`.
- Como `cobrancas_do_mes(p_mes, 'todos')` já traz todas as linhas ordenadas do mês (até centenas de clientes por contador), os 5 filtros visuais (`Todos`, `Em atraso`, `Vence hoje`, `A vencer`, `Pagos`) e a troca entre as 3 abas (`Cobranças`, `Obrigações`, `Régua`) filtram em memória e sincronizam a URL via `window.history.replaceState` em **0 ms**, sem nova ida ao banco e sem violar o check da RPC (`22023`) no filtro `Vence hoje`.
- Mutações frequentes (`Marcar pago`, `Desfazer`, `Marcar obrigação`) usam Server Actions validadas com Zod + `useOptimistic` no cliente para resposta visual e anúncio `aria-live="polite"` em **menos de 250 ms**, seguidas de `revalidatePath("/")`.

## Alternativas consideradas

| Alternativa | Por que não |
|---|---|
| Manter `@opennextjs/cloudflare` (ADR-0006 original) | Substituído pelo `vinext` na recomendação oficial da Cloudflare para projetos novos em Next.js 16; `vinext` roda direto no `workerd` no dev local e gera builds mais leves e rápidos |
| `next/font/google` | No `vinext`, carrega da CDN do Google em vez de embutir no projeto: piora a latência em 4G (2 handshakes extras) e envia o IP do usuário ao Google sem necessidade (LGPD) |
| Duplicar `neximob-theme.css` em `docs/` e `src/` | Duas cópias divergem com o tempo e violam o critério da `DV-01` de arquivo único de tokens |
| Consultar o banco a cada troca de filtro de status ou de aba | Adiciona 150–400 ms por clique no 4G, consome CPU do Worker à toa e exigiria migração extra no Postgres para o chip `Vence hoje` |
| Chamar `rpc('aceitar_termos')` imediatamente após `signUp` | Falha com `42501` quando `enable_confirmations = true`, pois o usuário ainda é `anon` até confirmar o e-mail |

## Consequências

**Positivas**
- Mesmo código App Router padrão do Next.js 16 rodando nativamente no `workerd` em dev e produção.
- Cumprimento estrito de `DV-01` (1 arquivo de tema, 2 famílias e 2 arquivos `.woff2` self-hosted), `DV-04` (`≤ 250 ms` otimista), `RNF-10` (1 carga paralela no servidor + `0 ms` em filtros/abas) e `RNF-05`/`RNF-16` (zero vazamento de dados/IP para terceiros, zero chave secreta no Worker).
- Build, lint, typecheck e testes unitários rodam no CI sem nenhum segredo nem banco em execução (`src/lib/database.types.ts` versionado).

**Cuidados**
- Qualquer nova migração SQL deve regenerar ou atualizar `src/lib/database.types.ts` no mesmo pull request.
- Em futuras trocas de arquivos de imagem em `public/brand/`, usar novo nome de arquivo para evitar retenção de cache de 24 h no navegador.
