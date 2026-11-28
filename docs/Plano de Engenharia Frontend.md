# Plano de Engenharia de Sistemas — Frontend Next.js (ADS)

| | |
|---|---|
| **Produto** | Neximob |
| **Versão** | 1.0 |
| **Data** | 27/11/2026 |
| **Autor** | Principal Systems Architect |
| **Base** | [PRD](./PRD.md) · [SRS](./SRS.md) · [Arquitetura](./Arquitetura.md) · [API](./API.md) · [Direção visual](./Dire%C3%A7%C3%A3o%20visual.md) · [Design System](./Design%20System.md) · [ADR-0001 a ADR-0009](./adr/README.md) |

Este documento fecha o desenho de engenharia de sistemas (ADS) do frontend do Neximob e quebra a implementação em **10 tarefas técnicas atômicas e sequenciais (`FE-01` a `FE-10`)** prontas para execução pelo **Senior Software Engineer (SWE)** e auditoria pelo **Staff QA & Security Auditor**.

---

## 1. Stack Tecnológica e Versões Exatas

| Camada | Pacote / Ferramenta | Versão exata | Papel arquitetural |
|---|---|---|---|
| Runtime de dev e build | Node.js + `pnpm` | Node `>=24`, `pnpm@11.5.1` | Gerenciamento determinístico de pacotes (`packageManager` fixado, zero `^` no `package.json`) |
| App Router & UI | `next`, `react`, `react-dom`, `react-server-dom-webpack` | `16.4.3` / `19.3.1` | Componentes de servidor (RSC), Server Actions, rotas e metadados |
| Runtime Cloudflare Workers | `vinext`, `@cloudflare/vite-plugin`, `@vitejs/plugin-rsc`, `@vitejs/plugin-react`, `vite`, `wrangler` | `1.4.5`, `1.70.2`, `0.5.39`, `6.3.0`, `8.3.0`, `4.169.0` | Execução nativa no `workerd` em dev e produção ([ADR-0009](./adr/0009-arquitetura-frontend-nextjs-vinext-tailwind-fontes.md)) |
| Estilização | `tailwindcss`, `@tailwindcss/postcss`, `postcss` | `4.3.5` | Tokens CSS semânticos em arquivo único (`src/app/neximob-theme.css`) |
| Banco e Autenticação | `@supabase/supabase-js`, `@supabase/ssr`, `server-only` | `2.119.2`, `0.12.7`, `0.0.1` | Acesso HTTPS com sessão do contador em cookies e RLS no Postgres ([ADR-0004](./adr/0004-isolamento-por-contador-rls.md), [ADR-0008](./adr/0008-login-email-e-senha.md)) |
| Validação e Ícones | `zod`, `lucide-react` | `4.6.7`, `1.66.0` | Validação nas fronteiras de entrada e ícones vetoriais acessíveis (`14px` em selos, `stroke-width: 2`) |
| Fontes variáveis (origem) | `@fontsource-variable/inter`, `@fontsource-variable/newsreader` (`devDependencies`) | `5.3.0`, `5.3.0` | Extração reprodutível dos **2 únicos arquivos `.woff2`** servidos em `public/fonts/` |
| Qualidade e Testes | `typescript`, `eslint`, `eslint-config-next`, `vitest` | `5.9.3`, `9.39.5`, `16.4.3`, `5.1.0` | Typecheck estrito (`strict: true`, sem `any`), lint e testes unitários rápidos sem rede |

> **Trava obrigatória de ambiente local (`pnpm-workspace.yaml`):** antes de rodar qualquer `pnpm install` ou `pnpm add`, DEVE existir `/home/jeandias/projects/neximob/pnpm-workspace.yaml` com `packages: ["."]` e `allowBuilds: { esbuild: true, workerd: true }`. Sem esse arquivo, o `pnpm` enxerga o `~/pnpm-workspace.yaml` global da máquina e altera `~/node_modules` fora do projeto.

---

## 2. Estrutura de Diretórios e Fronteiras de Módulo

Regra central: **um módulo ou renderiza interface, ou acessa o Supabase no servidor, ou contém regras puras/validação — nunca os três juntos**. Nenhum componente `.tsx` chama `supabase.from(...)` ou `supabase.rpc(...)` diretamente.

```text
neximob/
├── public/
│   ├── _headers                      # Cache imutável de /fonts/* e cabeçalhos de segurança na borda
│   ├── fonts/                        # EXATOS 2 arquivos .woff2 variáveis (Inter + Newsreader)
│   │   ├── inter-latin-wght-normal.woff2
│   │   └── newsreader-latin-wght-normal.woff2
│   ├── brand/                        # SVGs e PNGs oficiais (DV-11, já entregues)
│   └── favicon.ico, icon.svg, apple-touch-icon.png, icon-*.png, site.webmanifest, og-image.png
├── src/
│   ├── proxy.ts                      # Renovação de sessão @supabase/ssr + redirecionamento otimista
│   ├── app/
│   │   ├── fonts.css                 # @font-face (swap) + font-synthesis: none
│   │   ├── neximob-theme.css         # Movido de docs/neximob-theme.css (fonte única DV-01)
│   │   ├── globals.css               # @import tailwindcss + fonts + neximob-theme + classes utilitárias
│   │   ├── layout.tsx                # <html lang="pt-BR">, script anti-flash, preload Inter, ToastProvider
│   │   ├── error.tsx                 # Tratamento amigável de falha inesperada (zero stack trace)
│   │   ├── not-found.tsx             # Página 404 com retorno ao painel
│   │   ├── (auth)/                   # Rotas públicas de conta (DV-07)
│   │   │   ├── layout.tsx            # Moldura centralizada max-w-[420px] com BrandLogo
│   │   │   ├── entrar/page.tsx
│   │   │   ├── criar-conta/page.tsx
│   │   │   ├── esqueci-senha/page.tsx
│   │   │   ├── nova-senha/page.tsx
│   │   │   └── confirmar-email/page.tsx
│   │   ├── auth/callback/route.ts    # Troca code PKCE por sessão + grava aceitar_termos pendente
│   │   ├── termos/page.tsx           # Termos de Uso (controlador vs operador LGPD, RF-43)
│   │   ├── privacidade/page.tsx      # Política de Privacidade (LGPD, RF-43)
│   │   ├── primeiros-passos/page.tsx # Onboarding curto pós-confirmação (Nome + Pix → 1º cliente)
│   │   └── (painel)/                 # Tela única autenticada (SRS C-07)
│   │       ├── page.tsx              # RSC: garantir_cobrancas + Promise.all do mês de referência
│   │       └── loading.tsx           # Esqueleto plano imediato nas proporções reais
│   ├── server/                       # Protegido com `import "server-only"` em todos os arquivos
│   │   ├── env.ts                    # Leitura preguiçosa e validada das variáveis públicas + guarda anti-service_role
│   │   ├── supabase/
│   │   │   └── server.ts             # createSupabaseServerClient() por requisição (cookies do next/headers)
│   │   ├── auth/
│   │   │   └── session.ts            # getAuthenticatedUser() e requireAuthenticatedUser() via auth.getUser()
│   │   ├── queries/
│   │   │   └── painel.ts             # carregarPainelDoMes(mes): resumo, cobranças, obrigações, prazos, régua, perfil e clientes
│   │   └── actions/                  # Server Actions retornando ActionResult<T> discriminado
│   │       ├── auth.ts               # entrarAction, criarContaAction, recuperarSenhaAction, definirNovaSenhaAction, sairAction
│   │       ├── clientes.ts           # criarClienteAction, editarClienteAction, alterarAtivoClienteAction, excluirClienteAction
│   │       ├── cobrancas.ts          # marcarPagoAction, desfazerPagamentoAction, ajustarValorMesAction, buscarMensagemCobrarAction, registrarEnvioManualAction, listarEnviosClienteAction
│   │       ├── obrigacoes.ts         # listarClientesObrigacaoAction, marcarObrigacaoAction
│   │       ├── regua.ts              # salvarPassoReguaAction, restaurarPassoReguaAction, salvarTextoPendenciaAction, restaurarTextoPendenciaAction, gerarPreviaReguaAction
│   │       └── conta.ts              # salvarPerfilAction, aceitarTermosAction, exportarDadosAction, excluirContaAction
│   ├── features/
│   │   ├── painel/                   # PainelUnicoShell, TopBar, SeletorMes, ResumoMesStrip, AbasPainel
│   │   ├── cobrancas/                # AbaCobrancas, FiltrosStatus, TabelaCobrancasDesktop, CartoesCobrancasMobile, StatusCobrancaBadge, ModalCobrar, ModalAjustarValor, ModalEnviosCliente, ModalMarcarPago
│   │   ├── clientes/                 # ModalFormularioCliente (criação/edição + RN-21), ModalConfirmarExclusao
│   │   ├── obrigacoes/               # AbaObrigacoes, CardObrigacaoChecklist, ListaProximosPrazos
│   │   ├── regua/                    # AbaRegua, CardChavePix, CardPassoRegua, CardTextoPendencia
│   │   └── conta/                    # MenuContaPopover, SeletorTema, ModalMeusDadosConta, FormulariosAuth, FluxoPrimeirosPassos
│   ├── components/ui/                # BrandLogo, ResponsiveDialog (modal ≥768px / bottom sheet <768px), ToastRegion, Switch, SkipLink
│   └── lib/                          # Módulos puros (zero dependência de React/Next, 100% cobertos por Vitest)
│       ├── result.ts                 # Tipo ActionResult<T> = { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> }
│       ├── database.types.ts         # Tipagem completa de tabelas, views, enums e RPCs de supabase/migrations/
│       ├── dates.ts                  # Mês corrente em America/Sao_Paulo ('AAAA-MM-01'), navegação de meses, parse/format dd/mm e rótulos
│       ├── format.ts                 # formatBRL, parseBRLInput, formatStatusCobranca, formatProximoLembrete, primeiroNome
│       ├── cobrancas-filter.ts       # Filtragem e contagem em memória dos 5 chips ('todos' | 'em_atraso' | 'vence_hoje' | 'a_vencer' | 'pagos')
│       ├── regua-vars.ts             # Detecção local de campos desconhecidos ({x}) e interpolação de prévia instantânea
│       ├── validation.ts             # Schemas Zod com mensagens em português exatas do Design System §5.4
│       └── errors.ts                 # Mapeamento seguro de códigos PostgREST/Supabase Auth para português
├── tests/unit/                       # Suíte Vitest (format, dates, validation, errors, cobrancas-filter, regua-vars, theme-tokens)
├── vite.config.ts
├── wrangler.jsonc
├── next.config.ts
├── postcss.config.mjs
├── pnpm-workspace.yaml
└── .env.example
```

---

## 3. Contratos Técnicos, Fluxos Críticos e Regras de Segurança

### 3.1 Contrato de Tema e Fontes (`DV-01`, `RNF-02`, `RNF-10`)
1. **Arquivo único de tema:** mover `docs/neximob-theme.css` → `src/app/neximob-theme.css` e acrescentar `--nx-input-bg` (`#faf9f5` no claro, `#191f22` no escuro) e `--nx-header-bg` (`rgba(255, 255, 255, 0.92)` no claro, `rgba(29, 35, 38, 0.92)` no escuro), expondo `--color-input-bg` e `--color-header-bg` dentro de `@theme inline`.
2. **Script síncrono anti-flash no `<head>` (`src/app/layout.tsx`):**
   ```js
   try {
     var t = localStorage.getItem("neximob-theme");
     if (t === "light" || t === "dark") document.documentElement.dataset.theme = t;
     else delete document.documentElement.dataset.theme;
   } catch (e) {}
   ```
3. **Alternância da logo sem flash (`BrandLogo`):** renderizar os pares `public/brand/logo-horizontal.svg` + `logo-horizontal-dark.svg` (ou `logo-mark*.svg` abaixo de `480 px`) alternados por classes CSS `.nx-only-light` / `.nx-only-dark` definidas em `globals.css` sobre `:root[data-theme="dark"]` e `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`.
4. **Fontes self-hosted (`src/app/fonts.css` + `public/fonts/`):**
   - Copiar `inter-latin-wght-normal.woff2` e `newsreader-latin-wght-normal.woff2` para `public/fonts/`.
   - Definir `@font-face` para `"Inter Variable"` (`font-weight: 400 600; font-display: swap`) e `"Newsreader Variable"` (`font-weight: 300 500; font-display: swap`), `--font-inter: "Inter Variable"`, `--font-newsreader: "Newsreader Variable"` em `:root` e `font-synthesis: none` em `html`.
   - Preload no `<head>` somente para `/fonts/inter-latin-wght-normal.woff2` (`as="font" type="font/woff2" crossOrigin="anonymous"`).

### 3.2 Contrato de Sessão, `proxy.ts` e Aceite de Termos (`RF-40` a `RF-45`, `ADR-0008`)
1. **Isolamento no Worker:** `createSupabaseServerClient()` é chamada dentro de cada requisição RSC / Server Action / Route Handler; nunca guardar cliente em escopo global.
2. **Autorização real:** `requireAuthenticatedUser()` usa `await supabase.auth.getUser()`. Se não houver usuário autenticado, redireciona para `/entrar` (nas páginas) ou devolve `{ ok: false, error: "Sua sessão expirou. Entre novamente — o que você já salvou está seguro." }` (nas Server Actions).
3. **Fluxo PKCE de confirmação e recuperação (`/auth/callback/route.ts`):**
   - Recebe `?code=...&next=...` (ex.: `/primeiros-passos` no cadastro ou `/nova-senha` na recuperação).
   - Executa `supabase.auth.exchangeCodeForSession(code)`.
   - Se o usuário recém-autenticado tiver `user_metadata.termos_versao_pendente` (ou se ao carregar o painel `contadores.termos_aceitos_em` estiver `null` e houver metadado de aceite do cadastro), chama imediatamente `await supabase.rpc("aceitar_termos", { p_versao })` — garantindo o registro formal da LGPD (`RF-43`) assim que a sessão `authenticated` nasce.
   - Redireciona apenas para caminhos relativos internos (`next.startsWith("/") && !next.startsWith("//")`), bloqueando *open redirect*.
4. **Mensagens neutras de autenticação (`ADR-0008` item 9):**
   - Falha em `signInWithPassword`: se `Email not confirmed`, orientar a confirmar o e-mail enviado; nos demais casos de credencial, responder sempre *"E-mail ou senha incorretos."*
   - Pedido em `resetPasswordForEmail`: responder sempre *"Se este e-mail estiver cadastrado, enviaremos um link para criar uma nova senha."*

### 3.3 Contrato de Dados, Filtros em `0 ms` e Atualização Otimista (`≤ 250 ms`)
1. **Carga inicial única da tela (`src/server/queries/painel.ts`):**
   - Normaliza `?mes=AAAA-MM` para `'AAAA-MM-01'` (padrão: `hojeEmBrasilia()` truncado no dia 1).
   - Se `p_mes >= mesAtualBrasilia`, chama `await supabase.rpc("garantir_cobrancas", { p_mes })`.
   - Em seguida executa em paralelo (`Promise.all`):
     - `supabase.rpc("resumo_do_mes", { p_mes })`
     - `supabase.rpc("cobrancas_do_mes", { p_mes, p_filtro: "todos" })`
     - `supabase.rpc("obrigacoes_do_mes", { p_mes })`
     - `supabase.rpc("proximos_prazos", {})`
     - `supabase.from("regua").select("*").order("dias", { ascending: true })`
     - `supabase.from("contadores").select("*").single()`
     - `supabase.from("clientes").select("*").order("nome", { ascending: true })` (para edição rápida do cadastro completo e gestão de ativos/inativos sem round-trip extra ao abrir o modal `Editar cliente`!).
2. **Filtros da aba Cobranças sem erro `22023` (`src/lib/cobrancas-filter.ts`):**
   - A RPC `cobrancas_do_mes` no banco aceita apenas `'todos' | 'em_atraso' | 'a_vencer' | 'pagos'`. Já a interface (`DV-04`, `Design System.md` §5.2) oferece os 5 chips: `Todos`, `Em atraso`, `Vence hoje`, `A vencer`, `Pagos`.
   - Como `cobrancas_do_mes(p_mes, 'todos')` já retorna todas as cobranças do mês na ordem canônica da `RF-11`, `filtrarCobrancas` e `contarFiltrosCobrancas` operam em memória em `0 ms`:
     - `todos`: todas as linhas;
     - `em_atraso`: `situacao === "atrasado" || meses_em_aberto_anteriores > 0` (idêntico à linha 386 da migração SQL — `RN-18`);
     - `vence_hoje`: `situacao === "vence_hoje"`;
     - `a_vencer`: `situacao === "a_vencer"` (ou quando filtrado separadamente do chip `Vence hoje`; documentado e coberto por teste unitário);
     - `pagos`: `situacao === "pago"`.
   - Trocar de filtro (`?filtro=...`) ou de aba (`?aba=cobrancas|obrigacoes|regua`) usa `window.history.replaceState` sem disparar requisição ao servidor.
3. **Retorno otimista em `≤ 250 ms` (`DV-04`, `DV-05`):**
   - `Marcar pago` (padrão rápido: hoje + `pix`, com opção de escolher forma/data em menu ou janela) e `Desfazer` atualizam a linha/cartão e os 4 cards do Resumo via `useOptimistic`, disparam toast acessível (`"Pagamento de {Nome} registrado."` com ação `Desfazer` por 6 s) e executam `marcarPagoAction` / `desfazerPagamentoAction` + `revalidatePath("/")`.
   - `Marcar obrigação` no checklist expandido atualiza imediatamente `"X de Y feitos"`, a barra de `4 px` e o card `"Guias a fazer"`.

### 3.4 Segurança, Variáveis de Ambiente e Cabeçalhos (`RNF-06`, `RNF-07`, `RNF-16`)
- **Variáveis permitidas no Worker / Next.js (`.env.example`):**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` (padrão `http://127.0.0.1:3000` em dev)
- **Proibições absolutas (verificadas em `src/server/env.ts` e teste unitário):**
  - Nunca declarar, ler ou expor `SUPABASE_SERVICE_ROLE_KEY` no app Next.js/Worker;
  - Nunca criar campo, coluna, estado ou log de CPF ou CNPJ (`RN-20`, `ADR-0003`);
  - Nunca gravar `.env` com segredos reais no Git;
  - Nunca expor mensagens cruas de stack trace; traduzir códigos PostgREST em `src/lib/errors.ts` (`23514`, `23505`, `23503`, `42501`, `22023`, `P0002`).
- **Cabeçalhos HTTP (`public/_headers` + `next.config.ts`):**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
  - Cache estático: `/fonts/*` com `public, max-age=31536000, immutable`; `/brand/*` com `public, max-age=86400`.

---

## 4. Quebra em Tarefas Técnicas Atômicas e Sequenciais (`FE-01` a `FE-10`)

A ordem respeita estritamente as dependências técnicas e a sequência definida na [Direção visual](./Dire%C3%A7%C3%A3o%20visual.md) (`DV-11` → `DV-01` → `DV-10` → `DV-03` → `DV-02` → `DV-04` → `DV-05` → `DV-07` → `DV-06` → CI).

### `FE-01` · Bootstrap do Projeto, Isolamento `pnpm` e Configuração Cloudflare (`vinext`)
- **Escopo:** Inicializar o projeto na raiz de `~/projects/neximob` preservando integralmente `docs/`, `supabase/`, `.github/` e `public/`.
- **Entregáveis:**
  - `pnpm-workspace.yaml` (**primeiro arquivo a criar**, com `packages: ["."]` e `allowBuilds: { esbuild: true, workerd: true }`);
  - `package.json` (`"type": "module"`, versões exatas sem `^`, scripts `dev`, `build`, `preview`, `deploy`, `lint`, `typecheck`, `test`, `fonts:sync`);
  - `tsconfig.json` (`strict: true`, `@/*` → `./src/*`), `vite.config.ts` (`vinext()` + `cloudflare()`), `wrangler.jsonc` (`nodejs_compat`, `assets`, bloco `previews`), `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `vitest.config.ts`, `.gitignore` atualizado (`.next`, `.vinext`, `dist`, `.wrangler`, `node_modules`, `.env*.local`) e `.env.example`.
- **Critério de conclusão:** `pnpm install` instala somente dentro de `~/projects/neximob/node_modules` sem tocar em `~/pnpm-lock.yaml`.

### `FE-02` · Tokens Tailwind v4, Fontes Self-Hosted (`.woff2`) e Kit de Marca (`DV-11` + `DV-01`)
- **Escopo:** Ligar o sistema visual aprovado em arquivo único de tema e servir as 2 fontes variáveis estáticas.
- **Entregáveis:**
  - Copiar `inter-latin-wght-normal.woff2` e `newsreader-latin-wght-normal.woff2` para `public/fonts/` + criar `public/_headers`;
  - Mover `docs/neximob-theme.css` para `src/app/neximob-theme.css` (adicionando `--nx-input-bg` e `--nx-header-bg` nos dois temas e em `@theme inline`) e atualizar a referência em `docs/Design System.md`;
  - Criar `src/app/fonts.css`, `src/app/globals.css`, `src/components/ui/brand-logo.tsx` (troca claro/escuro por CSS puro), `src/features/conta/theme-store.ts` (`Sistema · Claro · Escuro` via `useSyncExternalStore`) e `src/app/layout.tsx` (metadados completos apontando para `public/`, `viewportFit: "cover"`, script anti-flash e preload da fonte Inter — **sem** criar `icon.*` em `src/app/`).
- **Critério de conclusão:** Apenas 2 arquivos `.woff2` em `public/fonts/`, zero chamada a `fonts.googleapis.com`, zero flash de tema.

### `FE-03` · Primitivos de Acessibilidade Base (`DV-10`)
- **Escopo:** Construir a infraestrutura reutilizável de acessibilidade para toda a tela única e janelas.
- **Entregáveis:**
  - `SkipLink` (`"Pular para o conteúdo"` visível no primeiro `Tab` apontando para `#conteudo-principal`);
  - Marcos semânticos `<header>`, `<nav aria-label="Navegação principal">` e `<main id="conteudo-principal">`;
  - Componente `TabsAcessiveis` WAI-ARIA (`role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`, navegação por setas `←`/`→`, `Home` e `End`);
  - `ResponsiveDialog` (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, *focus trap*, fechamento com `Escape`, devolução de foco ao botão acionador; modal centralizado `max-w-[480px]` em `≥ 768 px` e *bottom sheet* largura total em `< 768 px`);
  - `ToastRegion` (`role="status" aria-live="polite"` para confirmações/desfazer e `role="alert"` para erros) e `Switch` acessível (`role="switch"`, `aria-checked`, alvo mínimo `44×44 px`).
- **Critério de conclusão:** Navegação integral por teclado com anel de foco `2 px` nos dois temas e respeito a `prefers-reduced-motion`.

### `FE-04` · Camada Pura de Domínio, Tipos do Banco, Validação Zod e Erros (`API` + `SRS`)
- **Escopo:** Implementar toda a lógica determinística e tipagem do esquema físico antes das telas.
- **Entregáveis:**
  - `src/lib/database.types.ts` espelhando 100% de `supabase/migrations/*.sql` (tabelas, view `cobrancas_situacao`, 8 enums e todas as RPCs da tela);
  - `src/lib/dates.ts`, `src/lib/format.ts`, `src/lib/cobrancas-filter.ts`, `src/lib/regua-vars.ts`, `src/lib/validation.ts` (RN-07 dia 1–28, valor > 0, telefone `+55`, e-mail, extra c/ motivo, termos obrigatórios), `src/lib/errors.ts` e `src/lib/result.ts`;
  - Clientes Supabase e guarda de ambiente em `src/server/env.ts`, `src/server/supabase/server.ts`, `src/server/auth/session.ts` e `src/proxy.ts`.
- **Critério de conclusão:** Suíte unitária `Vitest` cobrindo formatação BRL/datas, singular/plural (`Atrasado há 1 dia` vs `5 dias`), RN-07, RN-18 nos filtros, detecção de `{campo_invalido}`, tradutor de códigos PostgREST e contraste/tokens.

### `FE-05` · Selos de Status (`DV-03`) + Topo e Resumo do Mês (`DV-02`)
- **Escopo:** Construir o cabeçalho fixo, seletor de mês, título em dois tempos e a faixa de 4 indicadores do mês.
- **Entregáveis:**
  - `StatusCobrancaBadge` (`Pago`, `Vence dia X`, `Vence hoje`, `Atrasado há N dia(s)`) sempre com ícone `14×14` + texto + pílula pastel com borda nos dois temas (separando claramente o vermelho vivo de atraso do botão sólido Vinho);
  - `TopBar` fixa (`56 px` mobile / `64 px` desktop, `backdrop-blur`), seletor `< Mês de AAAA >` + pílula `Voltar ao mês atual`, botão `+ Novo cliente` no topo (`md+`) e barra fixa inferior no polegar (`< 768 px`, `48 px` altura + `safe-area-inset-bottom`);
  - Título do mês em `Newsreader` + complemento em `Inter` (*"faltam R$ X de N clientes"* ou *"tudo em dia neste mês"*);
  - `ResumoMesStrip` contínua em `--nx-surface` (`grid-cols-4` em `lg+`, `grid-cols-2` em `390 px` sem rolagem lateral): `Recebido` (com barra `4 px`), `A receber` (+ linha de meses anteriores se `> 0`), `Em atraso` (clicável → filtra `Em atraso`) e `Guias a fazer` (clicável → abre aba `Obrigações`).

### `FE-06` · Lista de Cobranças Responsiva e Baixa Otimista (`DV-04`)
- **Escopo:** Implementar a aba principal em tabela calibrada no desktop e cartões no celular, ligada às Server Actions de cobrança.
- **Entregáveis:**
  - `src/server/actions/cobrancas.ts` (`marcarPagoAction`, `desfazerPagamentoAction`, `ajustarValorMesAction`, `buscarMensagemCobrarAction`, `registrarEnvioManualAction`, `listarEnviosClienteAction`);
  - Barra de chips de filtro com contagem (`Todos`, `Em atraso`, `Vence hoje`, `A vencer`, `Pagos`) em `0 ms` via `replaceState`;
  - `TabelaCobrancasDesktop` (`≥ 768 px`) com `table-layout: fixed` nas proporções aprovadas **`26% / 15,5% / 17% / 19% / 22,5%`**, `vertical-align: top`, `padding-right: 24px` em `Valor do mês`, linha única em `Cliente` (com chip `MEI`/`Simples`/`PF` e avisos `E-mail devolvido` / `Sem contato cadastrado`) e `Próximo lembrete`, sublinha de extra (`+ R$ X · motivo`), sublinha de pendência (`+ N mês(es) anterior(es)`) e botões `Cobrar` (ghost), `Marcar pago`/`Desfazer` (borda sutil + check, sem preenchimento Vinho) e menu `•••`;
  - `CartoesCobrancasMobile` (`< 768 px`) com alvos `≥ 44×44 px`;
  - Atualização otimista (`≤ 250 ms`) + toast com `Desfazer` (6 s) + estados vazios (zero clientes e filtro vazio).

### `FE-07` · Abas Obrigações e Régua de Cobrança (`DV-05`)
- **Escopo:** Construir as duas abas secundárias completas com mutações reais no Supabase.
- **Entregáveis:**
  - `src/server/actions/obrigacoes.ts` + `AbaObrigacoes`: bloco *"Obrigações deste mês"* (título + vencimento + competência `RN-23`, selo `Vencida`/`Vence hoje`/`Faltam N dias`, `"X de Y feitos"`, barra `4 px`, checklist expansível de clientes elegíveis com checkboxes `44×44 px` e atualização imediata do card `Guias a fazer`) + bloco *"Próximos prazos do ano"*;
  - `src/server/actions/regua.ts` + `AbaRegua`: card superior **Chave Pix padrão**, 4 cards dos passos (`-3, 0, +3, +7`) com `Switch` acessível (`role="switch"`), chips de inserção de variáveis (`{nome}`, `{mes}`, `{valor}`, `{venc}`, `{pix}`), validação inline antes de salvar caso haja campo desconhecido (`{x}`), botão `Restaurar padrão`, card de **Texto de pendência** (`Q-02`), prévia ao vivo com cliente de exemplo e prévia somente leitura do WhatsApp (`Modelo fixo`, `ADR-0002`).

### `FE-08` · Autenticação, Confirmação PKCE, Termos LGPD e Primeiro Acesso (`DV-07`)
- **Escopo:** Implementar todo o ciclo de conta do contador (`RF-40` a `RF-45`).
- **Entregáveis:**
  - `src/server/actions/auth.ts`, `src/server/actions/conta.ts` e `src/app/auth/callback/route.ts` (com gravação automática de `aceitar_termos` pós-confirmação);
  - Páginas `/entrar`, `/criar-conta` (senha `≥ 8` caracteres c/ mostrar/ocultar e checkbox de Termos/Privacidade **desmarcado por padrão**), `/confirmar-email`, `/esqueci-senha`, `/nova-senha`, `/termos` e `/privacidade`;
  - `/primeiros-passos` (2 etapas curtas: Nome + Chave Pix com `Configurar depois` → Cadastrar primeiro cliente ou `Ir direto para o painel`).

### `FE-09` · Janelas de Ação e Gestão da Conta (`DV-06` + `RF-01`, `RF-04` a `RF-06`, `RF-13`, `RF-14`, `RF-35`, `RF-44`)
- **Escopo:** Fechar todos os modais/bottom sheets sobre a tela única sem perder o contexto da lista.
- **Entregáveis:**
  - `src/server/actions/clientes.ts` + `ModalFormularioCliente` (Novo/Editar cliente, máscara monetária `R$`, dia `1–28`, telefone `+55`, canais, opção `RN-21` quando o vencimento do mês já passou: *"Cobrar a partir do próximo mês (padrão)"* vs *"Cobrar ainda este mês (nasce atrasada)"*);
  - `ModalCobrar` (`mensagem_para_cobrar` → `Copiar mensagem` c/ estado `Copiada!` 2 s + `Registrar envio manual`);
  - `ModalAjustarValor` (honorário fixo + extra + motivo + nota *"Vale só para {Mês}. O honorário fixo não muda."*);
  - `ModalEnviosCliente` (histórico `RF-35` com destaque para falhas/devoluções) e `ModalConfirmarExclusao` (operecendo também **Inativar cliente** como opção recomendada `Q-15` e exclusão definitiva com foco inicial em `Cancelar`);
  - `ModalMeusDadosConta` no menu do avatar: editar Nome/Pix, `Exportar dados` (download JSON da `exportar_meus_dados`) e `Excluir conta` (confirmação digitando `EXCLUIR` → Edge Function `excluir-conta`).

### `FE-10` · Integração Contínua (`.github/workflows/ci.yml`), Verificação Completa e Documentação
- **Escopo:** Garantir qualidade de produção em todos os portões automatizados sem depender de segredos no CI.
- **Entregáveis:**
  - Atualizar `.github/workflows/ci.yml` adicionando o job `app` (`pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`) em paralelo aos jobs `banco` e `edge-functions`;
  - Atualizar `README.md` com os comandos de desenvolvimento do frontend;
  - Executar localmente todos os portões (`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`) até 100% verde e registrar o resultado na nota `Neximob.md` do Obsidian.
  - **Restrição operacional:** não executar `git commit`, `git checkout`, `git switch`, `git stash` ou `git push` sem solicitação explícita do usuário na conversa.
