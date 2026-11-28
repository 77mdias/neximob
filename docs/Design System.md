# Design System & Especificação UX/UI — Neximob

| | |
|---|---|
| **Versão** | 1.0 |
| **Data** | 27/11/2026 |
| **Autor** | Staff UX/UI Product Designer |
| **Histórias cobertas** | DV-11 (entregue), DV-01 (tokens fechados), DV-10 (contrato A11y), DV-03 (selos claro/escuro), especificação de DV-02, DV-04, DV-05, DV-06 e DV-07 |
| **Arquivos entregues** | [`src/app/neximob-theme.css`](../src/app/neximob-theme.css) · [`docs/previews/index.html`](./previews/index.html) (+ 7 capturas `@2x` em `docs/previews/`) · [`public/brand/`](../public/brand/README.md) · `public/favicon.ico`, `icon.svg`, `apple-touch-icon.png`, `icon-*.png`, `site.webmanifest`, `og-image.png` |
| **Documentos relacionados** | [Direção visual](./Dire%C3%A7%C3%A3o%20visual.md) · [Mapa de fluxo](./Mapa%20de%20fluxo.md) · [PRD](./PRD.md) · [SRS](./SRS.md) · [API](./API.md) |

---

## 1. Decisões fechadas de UX/UI

Esta especificação parte diretamente do [Mapa de fluxo](./Mapa%20de%20fluxo.md), do [PRD](./PRD.md) e da [Direção visual](./Dire%C3%A7%C3%A3o%20visual.md) v0.2, fechando todas as decisões abertas antes da implementação:

| Decisão | Definição fechada | Justificativa |
|---|---|---|
| **Par tipográfico** | **Newsreader** (serifa variável, pesos 300–500) + **Inter** (sans variável, pesos 400–600) | 2 famílias e apenas **2 arquivos `.woff2` variáveis** (bem abaixo do limite de 4 arquivos da DV-01), `font-display: swap`, zero peso sintetizado e `tabular-nums` nativo excelente no Inter para valores em `R$`. |
| **Fundo do tema claro** | `#FFFFFF` (puro e plano) | Mantém a calma editorial do Pairio, preserva o contraste `5,46:1` do Oliva (`#6A6A61`) em metadados e reserva o **Areia (`#DDDCC5` / `#F4F3EB`)** para destacar o bloco do **Resumo do mês**. |
| **Vinho no tema escuro** | Botão primário em `#611427` com texto `#FFFFFF` (`12,82:1`) + borda `1,5px` `#DF7A91` (`5,55:1` sobre `#1D2326`). Links, aba ativa, barra de `%` e foco em `#DF7A91` (`5,55:1` sobre `#1D2326` e `4,95:1` sobre `#252C30`). | Preserva o botão Vinho da marca nos dois temas, cumpre WCAG 1.4.11 (`≥ 3:1` no limite do controle) e entrega leitura AA em todos os elementos interativos no tema escuro. |
| **Vinho da logo no tema escuro** | `#C64865` (`3,42:1` sobre `#1D2326`), com Grafite substituído por Areia (`#DDDCC5`, `11,45:1`) | Cumpre DV-11 (`≥ 3:1`) sem deixar a logo com aparência rosa pastel. |
| **Raios de borda** | Escala contida: **6 px** (botões e inputs — raio único), **8 px** (cards e tabelas), **12 px** (modais/drawers), **9999 px** (selos e switches) | Combina com os ângulos retos e 45° da logo do Neximob e elimina a inconsistência de raios de botão (8 px vs 12 px) apontada na referência. |
| **Troca de tema (RNF-02)** | Segue `prefers-color-scheme` por padrão, com seletor manual (`Sistema · Claro · Escuro`) no menu da conta persistido em `localStorage` (`neximob-theme`) | Sem flash de tema errado (script inline mínimo no `<head>` antes da pintura inicial). |

---

## 2. Tokens de Cor e Planilha de Contraste (WCAG 2.1)

Todos os tokens estão prontos em [`src/app/neximob-theme.css`](../src/app/neximob-theme.css) no formato Tailwind CSS v4 (`@theme inline` + variáveis `--nx-*`). Regra de proporção **90 / 8 / 2**: ~90% fundo neutro (`#FFFFFF` ou `#1D2326`), ~8% superfície de resumo (`#F4F3EB` / `#DDDCC5` ou `#252C30`), ≤ 2% acento Vinho (`#611427` / `#DF7A91`).

### 2.1 Tema Claro (`light`)

| Token | Hex | Origem | Uso exato | Contraste medido (WCAG) |
|---|---|---|---|---|
| `--nx-bg` | `#FFFFFF` | Base | Fundo da página, navbar (`92%` + blur), tabelas e cartões | — |
| `--nx-surface` | `#F4F3EB` | Derivado de `#DDDCC5` | Faixa do Resumo do mês (os 4 cards KPI) | — |
| `--nx-surface-brand` | `#DDDCC5` | **Areia oficial** | Destaque editorial, badge de marca, fundo dos favicons/app icons | — |
| `--nx-surface-subtle` | `#FAF9F5` | Derivado | Linhas alternadas (zebra) e hover discreto de linha | — |
| `--nx-surface-muted` | `#ECEBE2` | Derivado | Botão secundário, chips de filtro inativos | — |
| `--nx-text` | `#1D2326` | **Grafite oficial** | Títulos, nomes de clientes, valores em `R$` | `15,90:1` s/ `#FFF` (AAA) · `14,29:1` s/ `#F4F3EB` (AAA) · `11,45:1` s/ `#DDDCC5` (AAA) |
| `--nx-text-strong` | `#343B3E` | Derivado | Células de tabela, rótulos de campo, botões secundários | `11,41:1` s/ `#FFF` (AAA) · `10,25:1` s/ `#F4F3EB` (AAA) |
| `--nx-text-body` | `#4A4E4B` | Derivado | Descrições, prévia de mensagem, textos sobre `#DDDCC5` | `8,46:1` s/ `#FFF` (AAA) · `7,60:1` s/ `#F4F3EB` (AAA) · `6,09:1` s/ `#DDDCC5` (AA) |
| `--nx-text-muted` | `#6A6A61` | **Oliva oficial** | Complemento do título em dois tempos, subtítulos, datas, metadados | `5,46:1` s/ `#FFF` (AA) · `4,90:1` s/ `#F4F3EB` (AA) · **proibido** em texto pequeno s/ `#DDDCC5` (`3,93:1`) |
| `--nx-border` | `#DDDCD0` | Derivado | Borda de `1px` em cards, tabelas, navbar e separadores | Decorativo |
| `--nx-border-strong` | `#958976` | **Taupe oficial** | Borda de inputs, checkboxes, switches desligados e ícones neutros | `3,43:1` s/ `#FFF` (AA UI) · `3,08:1` s/ `#F4F3EB` (AA UI) · **nunca** texto pequeno |
| `--nx-accent` | `#611427` | **Vinho oficial** | Botão primário (`+ Novo cliente`), aba ativa, links, barra `% recebido`, anel de foco | `12,82:1` c/ `#FFF` (AAA) · `11,52:1` s/ `#F4F3EB` (AAA) · `9,23:1` s/ `#DDDCC5` (AAA) |
| `--nx-accent-hover` | `#4B0E1D` | Derivado | `:hover` do botão primário | `15,22:1` c/ `#FFF` (AAA) |

### 2.2 Tema Escuro (`dark`)

| Token | Hex | Origem | Uso exato | Contraste medido (WCAG) |
|---|---|---|---|---|
| `--nx-bg` | `#1D2326` | **Grafite oficial** | Fundo raiz da página e navbar (`92%` + blur) | — |
| `--nx-surface` | `#252C30` | Derivado | Resumo do mês (4 cards KPI), cartões mobile, cabeçalho da tabela | — |
| `--nx-surface-brand` | `#2E363B` | Derivado | Chips neutros destacados e superfícies de apoio | — |
| `--nx-surface-subtle` | `#21282C` | Derivado | Linhas alternadas (zebra) e hover discreto | — |
| `--nx-surface-muted` | `#31393E` | Derivado | Botão secundário e filtros inativos | — |
| `--nx-surface-elevated` | `#283035` | Derivado | Modais, drawers e menus flutuantes | — |
| `--nx-text` | `#F2F1E8` | Derivado de `#DDDCC5` | Títulos, KPIs grandes, texto de máxima hierarquia | `14,03:1` s/ `#1D2326` (AAA) · `12,50:1` s/ `#252C30` (AAA) |
| `--nx-text-strong` | `#DDDCC5` | **Areia oficial** | Nomes na lista, valores em `R$`, rótulos de formulário | `11,45:1` s/ `#1D2326` (AAA) · `10,20:1` s/ `#252C30` (AAA) |
| `--nx-text-body` | `#C5C3B0` | Derivado | Descrições e prévia da régua | `8,94:1` s/ `#1D2326` (AAA) · `7,97:1` s/ `#252C30` (AAA) |
| `--nx-text-muted` | `#A69B89` | Derivado de `#958976` | Complemento de título, metadados, datas secundárias | `5,81:1` s/ `#1D2326` (AA) · `5,18:1` s/ `#252C30` (AA) |
| `--nx-border` | `#374046` | Derivado | Borda de `1px` em cards, tabelas e divisores | Decorativo |
| `--nx-border-strong` | `#958976` | **Taupe oficial** | Borda de inputs, switches desligados e ícones neutros | `4,63:1` s/ `#1D2326` (AA) · `4,13:1` s/ `#252C30` (AA UI) |
| `--nx-accent` | `#DF7A91` | Vinho claro (`346°`) | Links, indicador de aba ativa, barra `% recebido`, anel de foco | `5,55:1` s/ `#1D2326` (AA) · `4,95:1` s/ `#252C30` (AA) |
| `--nx-accent-btn-bg` | `#611427` | **Vinho oficial** | Fundo do botão primário com texto `#FFFFFF` e borda `1,5px #DF7A91` | Texto `12,82:1` (AAA) · Borda `5,55:1` s/ `#1D2326` (AA UI) |
| `--nx-accent-hover` | `#7A1B32` | Derivado | `:hover` do botão primário no tema escuro | Texto `10,34:1` c/ `#FFF` (AAA) |

---

## 3. Selos de Status (DV-03) e Separação entre Vinho e Atrasado

### Regra de separação cromática (Vinho vs. Atrasado)
Para eliminar qualquer confusão entre o acento da marca (**Vinho `#611427`**) e o alerta de atraso:
1. **Diferença de matiz e saturação:** Vinho é escuro e frio (`345°`, baixa luminosidade); **Atrasado** usa vermelho vivo (`4°–6°`, alta saturação).
2. **Diferença de forma:** o botão primário usa preenchimento sólido (`#611427`); selos de status **nunca** usam preenchimento sólido forte — sempre pílula com fundo pastel/translúcido + borda `1px` + ícone `14px` (`stroke-width: 2`) + texto explícito.
3. **Nunca depender só da cor:** todo status traz **ícone distinto + texto + cor**.

| Status | Ícone (`14×14`) | Microcopy exata | Tema Claro (texto / fundo / borda) | Contraste Claro | Tema Escuro (texto / fundo / borda) | Contraste Escuro |
|---|---|---|---|---|---|---|
| **Pago** | `CheckCircle2` | `Pago` | `#0F6E4A` / `#EBF8F2` / `#A7DEC6` | `5,74:1` (AA) | `#6EE7B7` / `#14332A` / `#255B4B` | `8,97:1` (AAA) |
| **A vencer** | `Calendar` | `Vence dia {X}` | `#343B3E` / `#ECEBE2` / `#D4D2C5` | `9,53:1` (AAA) | `#DDDCC5` / `#31393E` / `#49545B` | `8,47:1` (AAA) |
| **Vence hoje** | `Clock` | `Vence hoje` | `#8A4500` / `#FEF6E6` / `#F3CD8B` | `6,66:1` (AA) | `#FCD34D` / `#3B2D14` / `#6B4F1D` | `9,27:1` (AAA) |
| **Atrasado** | `AlertCircle` | `Atrasado há {N} dia(s)` | `#B42318` / `#FEF0EE` / `#F5B8B0` | `5,92:1` (AA) | `#FF9387` / `#3F1B1D` / `#783236` | `7,05:1` (AAA) |

> **Atenção ao singular/plural:** `Atrasado há 1 dia` (nunca `1 dias`); `Atrasado há 5 dias`.

---

## 4. Tipografia, Espaçamento e Motion

### 4.1 Escala tipográfica do app

| Papel | Família | Desktop | Mobile | Peso | Line-height | Tracking | Uso |
|---|---|---|---|---|---|---|---|
| `month-title` | Newsreader | `32 px` | `26 px` | `400` | `1.15` | `-0.02em` | Título do mês em dois tempos: *"Novembro de 2026"* (`--nx-text`) + complemento *"faltam R$ 3.200,00 de 18 clientes"* (`Inter 15 px`, `--nx-text-muted`) |
| `kpi-value` | Newsreader | `28 px` | `22 px` | `500` | `1.1` | `-0.02em` | Os 4 valores grandes do Resumo do mês (sempre com `tabular-nums`) |
| `section-title` | Inter | `18 px` | `16 px` | `600` | `1.35` | `-0.01em` | Títulos de modal, seções de Obrigações e Régua |
| `ui-body` | Inter | `14 px` | `14 px` | `400 / 500` | `1.45` | `0` | Linhas da tabela, nome do cliente, prévia da mensagem, inputs (`16 px` no mobile para impedir zoom automático do iOS!) |
| `ui-money` | Inter | `14 px` | `15 px` | `600` | `1.4` | `0` | Valores em tabela/cartão (`R$ 1.234,56`, `tabular-nums`, alinhado à direita na tabela) |
| `ui-label` | Inter | `12 px` | `12 px` | `600` | `1.35` | `0.02em` | Rótulos dos cards KPI, cabeçalhos da tabela, badges de status |
| `ui-caption` | Inter | `12 px` | `12 px` | `400` | `1.4` | `0` | Próximo lembrete, competência da obrigação, textos de ajuda |

### 4.2 Grid, espaço e elevação
- **Base:** `4 px`. Contêiner principal: `max-w-[1152px] mx-auto px-4 md:px-8 lg:px-12`.
- **Ritmo vertical do app:** `24 px` entre blocos principais (`header` → resumo → abas → lista).
- **Superfícies planas:** borda `1px solid var(--nx-border)` sem sombra em cards e tabelas. Sombra (`--nx-shadow-popover` / `--nx-shadow-modal`) **exclusivamente** em modais, drawers, menus suspensos e toasts.
- **Motion:** transições curtas (`150 ms` hover/foco/toggle, `220 ms` abertura de modal/drawer e barra de progresso). Zero animação ociosa rodando em repouso. Em `prefers-reduced-motion: reduce`, apenas opacidade (`150 ms`).

---

## 5. Especificação de Telas, Componentes e Microcopy

### 5.1 Topo e Resumo do Mês (DV-02)
- **Header fixo (`56 px` mobile / `64 px` desktop):** `bg-bg/92 backdrop-blur-md border-b border-border`.
  - Esquerda: `logo-horizontal.svg` (claro) / `logo-horizontal-dark.svg` (escuro). Em `< 480 px`, apenas `logo-mark*.svg` (`28 px` altura) para liberar espaço ao seletor de mês.
  - Centro/Esquerda: Seletor de mês (`<` **Novembro de 2026** `>`) com `aria-label="Mês anterior"` e `"Próximo mês"`. Quando fora do mês corrente, exibe pílula secundária `Voltar ao mês atual`.
  - Direita: Botão primário `+ Novo cliente` (desktop `md+`) + menu da conta (ícone avatar com iniciais, abre popover com `Meus dados e chave Pix`, seletor `Tema: Sistema / Claro / Escuro`, `Exportar dados`, `Sair`).
  - **Mobile (`< 768 px`):** o botão `+ Novo cliente` fica fixo na barra inferior (`bottom-4 inset-x-4`, altura `48 px`, `shadow-popover`), ao alcance do polegar, respeitando `env(safe-area-inset-bottom)`.
- **Resumo do mês (4 cards em `--nx-surface`):**
  - Desktop (`1440 px` / `lg+`): `grid-cols-4 gap-4`. Mobile (`390 px`): `grid-cols-2 gap-3` (os 4 cards cabem sem rolagem lateral!).
  - **Card 1 — Recebido:** valor em `R$`, legenda `{X}% do mês` e barra de progresso horizontal `4 px` (trilha `--nx-border`, preenchimento `--nx-accent`).
  - **Card 2 — A receber:** valor em `R$`, legenda `{N} em aberto`.
  - **Card 3 — Em atraso:** contagem de clientes em `--nx-status-overdue-fg` quando `> 0` (e `--nx-text` quando `0`), legenda `{R$ total}` ou `Nenhum em atraso`. Clicável para ativar diretamente o filtro `Em atraso`.
  - **Card 4 — Guias a fazer:** `{restantes} de {total}` no mês, legenda `Ver obrigações`. Clicável para ir à aba `Obrigações`.

### 5.2 Abas e Lista de Cobranças (DV-04)
- **Navegação por abas (`role="tablist"`):** `Cobranças`, `Obrigações`, `Régua de cobrança`. Indicador inferior `2 px` em `--nx-accent`; aba ativa em `--nx-text` (`font-semibold`), inativas em `--nx-text-muted`.
- **Filtros de status (chips pílula com contagem):** `Todos (N)` · `Em atraso (N)` · `Vence hoje (N)` · `A vencer (N)` · `Pagos (N)`. Filtro ativo com fundo `--nx-accent-tint`, borda `--nx-accent` e texto `--nx-accent` (no claro `#611427`, no escuro `#DF7A91`).
- **Desktop (`≥ 768 px`):** tabela plana dentro de contêiner `rounded-md border border-border`, com grade fixa em `lg+` (`table-layout: fixed`, proporções `26% / 15,5% / 17% / 19% / 22,5%`), alinhamento pelo topo (`vertical-align: top`) para que a primeira linha de todas as colunas fique nivelada mesmo quando uma célula tiver linha secundária, e respiro de `24 px` à direita da coluna de valor antes de `Status`:
  1. **Cliente** (`26%`, esquerda): nome + tipo `MEI` / `Simples` / `PF` em chip discreto na mesma linha; se `RN-24` e-mail devolvido, ícone de alerta + microcopy `E-mail devolvido`; se `RN-17` sem e-mail/telefone, `Sem contato cadastrado`.
  2. **Valor do mês** (`15,5%`, direita, `padding-right: 24px`, `tabular-nums`): se houver serviço extra no mês, sublinha discreta `+ R$ {extra} · {motivo}`.
  3. **Status** (`17%`, esquerda): selo DV-03; se houver pendências de meses anteriores, linha auxiliar `+ {N} mês(es) anterior(es) (R$ {total})`.
  4. **Próximo lembrete** (`19%`, esquerda, `12,5 px`, linha única): `3 dias antes · 17/11`, `Sem envio automático` ou `Pago em dd/mm · Pix`.
  5. **Ações** (`22,5%`, direita): botão `Cobrar` (ghost) + botão `Marcar pago` (superfície com borda e ícone de *check*, mantendo Vinho sólido exclusivo para `+ Novo cliente` e modais; vira `Desfazer` quando pago) + menu `•••` (`Ajustar valor do mês`, `Ver envios`, `Editar cliente`, `Excluir cliente`).
- **Mobile (`< 768 px`):** lista de cartões (`rounded-md border border-border p-4 space-y-3`), com: topo (Nome + selo de status), meio (Valor em destaque + Próximo lembrete), base (botões `Cobrar` e `Marcar pago` com área de toque mínima `44×44 px` + `•••`).
- **Retorno de ação (`≤ 250 ms`):** atualização otimista ao marcar pago / desfazer + toast com `role="status" aria-live="polite"`:
  - *"Pagamento de {Nome} registrado."* com botão `Desfazer` (duração 6 s).
  - *"Pagamento de {Nome} desfeito."*
- **Estado vazio (zero clientes):**
  - Título: *"Nenhum cliente cadastrado ainda."*
  - Texto: *"Cadastre o primeiro cliente para acompanhar honorários, lembretes e guias do mês."*
  - CTA: `+ Novo cliente`
- **Estado vazio de filtro:**
  - *"Nenhuma cobrança com o filtro \"{Filtro}\" neste mês."* + link `Limpar filtro`.

### 5.3 Abas Obrigações e Régua (DV-05)
- **Obrigações:**
  - Bloco *"Obrigações deste mês"* + bloco *"Próximos prazos do ano"*, com botão secundário `Calendário fiscal` (RF-23).
  - Cada card de obrigação mostra: título + competência (ex.: `DAS-MEI · vence 20/11 · competência outubro`), selo de prazo (`Vencida` / `Vence hoje` / `Faltam N dias`), contagem `{X} de {Y} feitos` + barra de progresso (`4 px`, mesma do card Recebido).
  - Ao expandir/abrir: checklist de clientes elegíveis com checkboxes `44×44 px` de área clicável; marcar/desmarcar atualiza imediatamente a contagem e o card `Guias a fazer`.
- **Régua de cobrança:**
  - Card superior: **Chave Pix padrão** (input + botão `Salvar chave`, feedback `Chave Pix salva.`).
  - 4 cards planos empilhados (`3 dias antes`, `No dia`, `3 dias depois`, `7 dias depois`):
    - Cabeçalho com nome do passo, descrição curta do disparo e **interruptor acessível (`role="switch"`, `aria-checked`)** com rótulo explícito (ex.: `Ativar lembrete 3 dias antes`).
    - Editor do texto do e-mail com chips clicáveis para inserir variáveis (`{nome}`, `{mes}`, `{valor}`, `{venc}`, `{pix}`). Se houver variável desconhecida entre chaves (Mapa de fluxo, seção 15), aviso inline antes de salvar: *"O campo `{x}` não é reconhecido. Campos aceitos: `{nome}`, `{mes}`, `{valor}`, `{venc}` e `{pix}`."*
    - Bloco **Prévia com cliente de exemplo** (e aba/seção somente leitura **Prévia do WhatsApp** com selo `Modelo fixo`).

### 5.4 Janelas de Ação (DV-06) e Microcopy de Erros
- **Comportamento:** modal centralizado (`max-w-[480px]`, `rounded-lg`, `--nx-shadow-modal`) em `≥ 768 px`; **bottom sheet** ocupando `100%` da largura subindo de baixo (`rounded-t-lg`) em `< 768 px`.
- **Janelas:**
  1. **Novo cliente / Editar cliente:** Nome, Tipo (`MEI`, `Simples`, `PF`), Honorário (`R$`), Dia de vencimento (`1` a `28`), E-mail, Telefone, Canais. Se o vencimento do mês já passou (RN-21), exibe radio button: `Cobrar a partir do próximo mês (padrão)` / `Cobrar ainda este mês (nasce atrasada)`.
  2. **Cobrar (manual):** exibe texto montado com pendências + botão primário `Copiar mensagem` (muda para `Copiada!` por 2 s) + botão secundário `Registrar envio manual`.
  3. **Ajustar valor do mês:** mostra honorário base fixo, campo `Valor do serviço extra (R$)`, campo `Motivo`, e prévia do novo total do mês com nota: *"Vale só para {Mês}. O honorário fixo não muda."*
  4. **Confirmar exclusão de cliente:** texto claro do impacto (*"Excluir {Nome} apaga também todas as cobranças, envios e marcações de guias deste cliente. Essa ação não pode ser desfeita."*) com botão destrutivo em `--nx-status-overdue-fg` (`Excluir cliente`) e botão secundário `Cancelar` focado por padrão.
- **Erros inline (junto ao campo, `aria-invalid="true"` + `aria-describedby`):**
  - Campo obrigatório vazio: *"Informe {nome do campo} para continuar."*
  - Dia fora de 1–28 (RN-07): *"Escolha um dia entre 1 e 28 para funcionar em todos os meses."*
  - Valor inválido: *"Informe um valor maior que zero."*
  - Sessão expirada: banner/redirecionamento para login com aviso: *"Sua sessão expirou. Entre novamente — o que você já salvou está seguro."*

### 5.5 Login e Primeiro Acesso (DV-07)
- Cartão centralizado (`max-w-[420px]`) sobre `--nx-surface` (claro) ou `--nx-bg` (escuro), encabeçado por `logo-horizontal*.svg`.
- **Cadastro:** E-mail, Senha (com botão mostrar/ocultar e indicação clara de requisito), checkbox **desmarcado por padrão** (RF-43): *"Li e aceito os Termos de Uso e a Política de Privacidade."* (botão `Criar conta` valida e mostra erro inline se desmarcado).
- **Onboarding (2 passos curtos após confirmar e-mail):**
  1. Nome do contador/escritório + Chave Pix (com link `Configurar depois`).
  2. Cadastrar primeiro cliente ou `Ir direto para o painel` (já com régua padrão e calendário fiscal criados pelo banco).

---

## 6. Contrato de Acessibilidade (DV-10)

Checklist obrigatório para QA e SWE antes de concluir qualquer tela:
- [ ] **Landmarks:** `<header>`, `<nav aria-label="Navegação principal">`, `<main id="conteudo-principal">` e link **"Pular para o conteúdo"** visível no primeiro `Tab`.
- [ ] **Foco visível universal:** `focus-visible` com `outline: 2px solid var(--nx-focus-ring); outline-offset: 2px` em todos os botões, links, abas, inputs, checkboxes e switches nos dois temas.
- [ ] **Abas WAI-ARIA:** `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`; setas `←` / `→`, `Home` e `End` navegam entre as abas.
- [ ] **Modais e drawers:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, *focus trap* ativo, fechamento com `Escape` e devolução do foco ao botão acionador.
- [ ] **Anúncios dinâmicos:** região `aria-live="polite"` para confirmações de pagamento, desfazer, cópia de mensagem e salvamento; `role="alert"` para falhas de rede/envio.
- [ ] **Alvos de toque:** mínimo de `44×44 px` no mobile em todas as ações da linha/cartão, checkboxes de obrigações e switches da régua.
- [ ] **Validação automática:** zero violações críticas ou sérias em `axe-core` na tela única nos temas claro e escuro.

---

## 7. Hand-off

- **Principal Systems Architect (concluído em 27/11/2026):** definido em [ADR-0009](./adr/0009-arquitetura-frontend-nextjs-vinext-tailwind-fontes.md) e no [Plano de Engenharia Frontend](./Plano%20de%20Engenharia%20Frontend.md): `neximob-theme.css` vive em `src/app/neximob-theme.css` (fonte única do Tailwind v4), `Inter` e `Newsreader` são servidas como 2 arquivos `.woff2` variáveis self-hosted em `public/fonts/` pelo Cloudflare Workers Static Assets (0 ms de CPU, zero CDN externa), e o runtime na Cloudflare usa `vinext`.
- **Senior Software Engineer (SWE):** executar `FE-01` a `FE-10` do [Plano de Engenharia Frontend](./Plano%20de%20Engenharia%20Frontend.md), incorporando `public/` (favicons, manifesto, OG, `public/brand/` e `public/fonts/`) e implementando na ordem `DV-11` → `DV-01` → `DV-10` → `DV-03` → `DV-02` → `DV-04` → `DV-05` → `DV-07` → `DV-06`.
