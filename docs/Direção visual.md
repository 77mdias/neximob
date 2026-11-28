# Direção visual: Neximob

| | |
|---|---|
| **Versão** | 0.2, rascunho para validação |
| **Data** | 27/11/2026 |
| **Autor** | Group Product Manager (GPM) |
| **Referência** | Engenharia reversa do Pairio (`DESIGN.md`, 22/11/2026), guardada fora deste repositório em `~/Documentos/design-systems-of-web/pairio.app/` (manual, tokens, prévia e recortes) |
| **Documentos relacionados** | [PRD](./PRD.md) · [SRS](./SRS.md) · [Mapa de fluxo](./Mapa%20de%20fluxo.md) · [Arquitetura](./Arquitetura.md) |

> **Como ler.** A logo e as 5 cores da marca são **decisão do responsável pelo produto** (27/11/2026). O resto é **(proposto)** até o Staff UX/UI Product Designer fechar os tokens e o usuário aprovar. O manual de referência não entra no repositório: o repositório é público, e o próprio manual pede para manter o ofício e trocar a identidade (seção 12 dele).

---

## 1. O problema que esta direção resolve

O contador abre o Neximob para responder, em segundos, **quanto entrou, quanto falta e quem está atrasado** (PRD, O2). A interface precisa passar **calma e confiança** (dinheiro e prazo fiscal de terceiros) e ser **rápida de ler no celular** (RNF-01).

O Pairio entrega exatamente o tom que queremos: branco plano, neutros, um acento só, títulos leves e nenhum ruído. Mas ele é uma **página de venda de um app de desktop**, e o Neximob é **uma tela de trabalho com números, listas e status**. Por isso adaptamos o ofício, não copiamos a página.

## 2. Restrições que mandam mais que a referência

| Restrição | Fonte | Efeito na adaptação |
|---|---|---|
| Tela única: resumo do mês no topo e três abas | SRS C-07 | A referência muda **a pele** (cor, tipo, espaço, forma). A **estrutura** da tela única não muda |
| Logo e 5 cores da marca já decididas | Decisão, 27/11/2026 | A paleta do Pairio sai inteira; ficam só as regras de uso (seção 4) |
| Tema claro **e escuro** | RNF-02 | O Pairio só tem tema claro. O tema escuro precisa ser desenhado do zero |
| No celular, a lista vira cartões | RNF-01 | A tabela comparativa do Pairio serve de base no computador; no celular, cartões |
| Tela principal em até 2 s no 4G com 300 clientes | RNF-10 | Fontes enxutas, sem biblioteca de animação, nada de vitrines animadas no app |
| Tudo em português, R$ 1.234,56, dd/mm/aaaa | RNF-08, C-06 | Números com algarismos tabulares, alinhados à direita |
| Não prometer cálculo de imposto | C-01 | Nada de texto ou ilustração que sugira cálculo de tributo |

O UX desenha as telas a partir do [Mapa de fluxo](./Mapa%20de%20fluxo.md), do [PRD](./PRD.md) e da [API](./API.md).

## 3. Manter e trocar

| Manter do Pairio (ofício) | Trocar ou adaptar no Neximob |
|---|---|
| Fundo plano, neutros e **um acento só** (regra 90/8/2) | Os neutros Zinc dão lugar à paleta da marca (seção 4). O acento único é o **Vinho `#611427`** |
| Superfície quente para destacar um bloco | A **Areia `#DDDCC5`** faz esse papel no **resumo do mês** (os 4 cards). Nela, texto de corpo só em Grafite: o Oliva cai para 3,93:1 e reprova |
| Par serifa leve (leitura e títulos) + sans geométrica (ação e UI) | No app, a **sans manda** (listas, números, botões, abas). A serifa fica só no título do mês, nos números grandes do resumo e na página pública. Par a escolher pelo UX entre as sugestões do manual (ex.: Newsreader + Inter, Fraunces + Geist) |
| Títulos em dois tempos (afirmação + complemento suave) | Na tela: "Novembro de 2026 / faltam R$ 3.200 de 18 clientes". Afirmação em Grafite, complemento em Oliva (5,46:1 no branco) |
| Base de espaço de 4 px, contêiner de 1152 px, raios 8/12/16 e pílula | Um raio só para botões (o manual aponta 8 vs 12 como defeito). Ritmo vertical de app: 24 a 48 px, não 112 px. A logo é toda reta: raios pequenos combinam mais com ela (decisão do UX) |
| Interface plana, borda de 1 px, sombra só no que flutua | Borda em Taupe ou num tom derivado da Areia. Sombra só em janelas (Novo cliente, Ajustar valor, Cobrar) e no menu |
| Barra fixa com `backdrop-blur` e menu do celular em `grid-template-rows` | Topo com mês de referência e **+ Novo cliente**; no celular, o botão fica fixo embaixo |
| Tabela com divisores leves e selos Sim/Não | Lista de cobranças com selos de status (seção 5) |
| Motion curto (150 a 250 ms), zero animação parada rodando, `prefers-reduced-motion` | No app, só retorno de ação: marcar pago, abrir janela, trocar aba. As vitrines animadas ficam para a página pública |
| Pontos fracos que o manual manda corrigir | Marcos `header`/`nav`/`main`, link "Pular para o conteúdo", anel de foco visível em tudo, contraste AA em todo texto |

## 4. Marca: logo e paleta

**Decisão (27/11/2026).** A logo é o "N" de traços retos paralelos que termina num sinal de **feito** (✓), em Vinho, Grafite, Taupe e Oliva. O arquivo original está em `/home/jeandias/OpenBot/Shared/Transfers/2175f2f6-451c-4597-93ae-09cabddbd8f1/image.png`: um bitmap de 1024 × 1024 px com fundo branco.

### 4.1 Paleta e papéis (proposto)

| Nome | Cor | Papel no tema claro | Papel no tema escuro |
|---|---|---|---|
| Areia | `#DDDCC5` | Superfície de destaque (resumo do mês), fundo de selos neutros | **Texto principal** |
| Taupe | `#958976` | Bordas, divisores, ícones grandes. **Nunca texto pequeno** | Texto secundário |
| Vinho | `#611427` | **Acento único**: botão principal, aba ativa, links, barra de % recebido | Só como fundo de botão, com texto branco. Para link e anel de foco, um tom mais claro (a definir pelo UX) |
| Grafite | `#1D2326` | **Texto principal**, títulos, números | **Fundo** |
| Oliva | `#6A6A61` | Texto secundário sobre branco | Bordas e divisores. **Nunca texto** |

O fundo do tema claro é branco, ou um tom bem claro derivado da Areia, a definir pelo UX. A Areia como fundo da página inteira tira o destaque do resumo do mês.

### 4.2 Contraste medido (WCAG)

Mínimo: 4,5:1 para texto até 18 px; 3:1 para texto grande, ícones e bordas que identificam um campo.

| Par | Contraste | Uso |
|---|---|---|
| Grafite sobre branco | 15,90:1 | ✓ texto |
| Grafite sobre Areia | 11,45:1 | ✓ texto |
| Branco sobre Vinho | 12,82:1 | ✓ botão principal |
| Vinho sobre Areia | 9,23:1 | ✓ link ou número em destaque no resumo |
| Oliva sobre branco | 5,46:1 | ✓ texto secundário |
| Oliva sobre Areia | 3,93:1 | ✗ texto pequeno; ✓ só ícone ou texto grande |
| Taupe sobre branco | 3,43:1 | ✗ texto pequeno; ✓ borda de campo e ícone |
| Areia sobre Grafite | 11,45:1 | ✓ texto no tema escuro |
| Taupe sobre Grafite | 4,63:1 | ✓ texto secundário no tema escuro |
| Oliva sobre Grafite | 2,91:1 | ✗ texto; só divisor decorativo |
| Vinho sobre Grafite | 1,24:1 | ✗ **reprova para tudo**: no tema escuro, o Vinho precisa de texto branco dentro |

### 4.3 Riscos da paleta

- **Vinho e "Atrasado" são da mesma família.** O botão principal em Vinho pode ser lido como alerta. Por isso o status Atrasado usa um vermelho mais vivo, sempre com ícone e texto (seção 5), e nunca o Vinho. O UX testa os dois lado a lado.
- **A logo some no tema escuro.** Os traços Grafite (1:1) e Vinho (1,24:1) desaparecem sobre o fundo Grafite. É preciso uma versão para fundo escuro (DV-11).
- **A logo tem traços finos e paralelos.** Em 16 px, os traços se misturam. O favicon precisa de uma versão simplificada, testada em 16 e 32 px (DV-11).

## 5. Status de cobrança

Os quatro estados do Mapa de fluxo (seção 5) precisam ser lidos sem depender só da cor: **texto + ícone + cor**. As cores de status são funcionais e ficam fora da paleta da marca.

| Status | Texto | Cor do texto | Fundo | Contraste |
|---|---|---|---|---|
| Pago | "Pago" | `#007A55` | `#ECFDF5` | 5,09:1 |
| Vence dia X | "Vence dia 10" | `#3F3F46` | `#F4F4F5` | 9,50:1 |
| Vence hoje | "Vence hoje" | `#973C00` | `#FFFBEB` | 6,84:1 |
| Atrasado | "Atrasado há 5 dias" | `#C10007` | `#FEF2F2` | 5,87:1 |

Valores do tema claro, calculados pela fórmula da WCAG. O tema escuro fica com o UX, com a mesma meta de 4,5:1.

## 6. Onde cada peça do manual entra

| Peça do Pairio | Uso no Neximob | Superfície |
|---|---|---|
| Barra fixa e menu do celular | Topo da tela única | App |
| Card de preço com selos teal | Card do plano na assinatura (RF-50) | App (F5) e página pública |
| Tabela comparativa e selos | Lista de cobranças e checklist de obrigações | App |
| Barra fina de acento (40×2 px) | Barra de "% recebido" no card Recebido | App |
| Rail lateral fixa | Não entra no app (são só três abas). Pode entrar na página pública | Página pública |
| Vitrines animadas e mockup do herói | Demonstração da régua de cobrança: o lembrete saindo 3 dias antes, no dia e 3 dias depois | Página pública (com o PMM) |
| Banner de cookies | Consentimento LGPD (RF-43), só se houver análise de uso | App e página pública |

## 7. Histórias de usuário

Prioridade pelo RICE: **Alcance** × **Impacto** × **Confiança** ÷ **Esforço**. Alcance em % dos contadores que usam a parte no mês; Impacto de 0,25 a 3; Esforço em semanas de uma pessoa. **Todos os números são estimativas (proposto)**: ainda não há usuários nem metas (PRD, seção 6).

| # | História | Alcance | Impacto | Confiança | Esforço | RICE | Fase |
|---|---|---|---|---|---|---|---|
| DV-01 | Tokens base, claro e escuro | 100 | 2 | 80% | 1 | **160** | F2 |
| DV-11 | Logo transparente e favicons | 100 | 1 | 100% | 0,5 | **200** | F2 |
| DV-10 | Acessibilidade de base | 100 | 1 | 100% | 0,5 | **200** | F2 |
| DV-03 | Selos de status | 100 | 2 | 100% | 0,5 | **400** | F2 |
| DV-02 | Topo e resumo do mês | 100 | 3 | 80% | 1 | **240** | F2 |
| DV-04 | Lista de cobranças: tabela e cartões | 100 | 3 | 80% | 1,5 | **160** | F2 |
| DV-05 | Abas Obrigações e Régua | 90 | 2 | 80% | 1,5 | **96** | F2 |
| DV-06 | Janelas de ação | 80 | 1 | 80% | 1 | **64** | F2 |
| DV-07 | Login e primeiro acesso | 100 | 1 | 80% | 1 | **80** | F2 |
| DV-09 | Página pública | — | 2 | 50% | 2 | depois da F1 | F5 |

**Ordem de construção:** DV-11, DV-01 e DV-10 vêm primeiro mesmo com RICE menor, porque todas as outras dependem deles. Depois DV-03 → DV-02 → DV-04 → DV-05 → DV-07 → DV-06. A DV-09 espera a validação com o contador (F1) e o preço.

### DV-01 · Tokens base
**Como** time, **quero** um conjunto único de tokens de cor, tipo, espaço, raio, sombra e motion, **para** que todas as telas tenham o mesmo visual nos dois temas.
- [ ] Tokens em um só arquivo de tema do Tailwind v4, com pares para claro e escuro.
- [ ] Todo par texto/fundo de uso real passa de 4,5:1 (texto até 18 px) e 3:1 (texto grande e ícones), nos dois temas. Planilha de contraste anexada.
- [ ] Paleta da seção 4 com os papéis da tabela 4.1; um acento só (Vinho). Tons derivados (fundo claro, Vinho claro do tema escuro) com contraste medido.
- [ ] No máximo 2 famílias de fonte e 4 arquivos, só pesos usados, com `font-display: swap`. Nenhum peso sintetizado.
- [ ] Tema segue o sistema e pode ser trocado à mão; a escolha fica salva.

### DV-10 · Acessibilidade de base
**Como** contador que usa teclado ou leitor de tela, **quero** navegar por toda a tela única, **para** cobrar e dar baixa sem mouse.
- [ ] Marcos `header`, `nav`, `main` e link "Pular para o conteúdo".
- [ ] Anel de foco visível em todo elemento clicável, nos dois temas.
- [ ] Abas com o padrão de abas acessível (setas trocam de aba).
- [ ] Com `prefers-reduced-motion`, nenhuma transição passa de opacidade.
- [ ] Verificação automática de acessibilidade sem erro grave na tela única.

### DV-03 · Selos de status
**Como** contador, **quero** ver o status de cada cobrança de relance, **para** saber quem cobrar hoje.
- [ ] Os 4 estados da seção 5, sempre com texto e ícone, nunca só cor.
- [ ] "Atrasado há N dias" usa o N calculado pela RN-02; "Vence dia X" mostra o dia.
- [ ] Contraste da seção 5 mantido nos dois temas.

### DV-02 · Topo e resumo do mês
**Como** contador, **quero** abrir o app e ver o mês em 4 números, **para** saber em segundos quanto entrou e quanto falta (O2).
- [ ] Topo com mês de referência e **+ Novo cliente**; no celular, o botão fica fixo embaixo, ao alcance do polegar.
- [ ] 4 cards: Recebido (valor e barra de %), A receber, Clientes em atraso, Guias a fazer no mês (RF-03).
- [ ] Valores em R$ 1.234,56 com algarismos tabulares.
- [ ] Em 390 px, os 4 cards cabem sem rolagem lateral; em 1440 px, ficam numa linha.
- [ ] Com 300 clientes, a tela carrega em até 2 s no 4G simulado (RNF-10).

### DV-04 · Lista de cobranças
**Como** contador, **quero** a lista do mês em tabela no computador e em cartões no celular, **para** cobrar e dar baixa em qualquer aparelho (RNF-01).
- [ ] A partir de 768 px: tabela com cliente, valor, status, próximo lembrete e ações.
- [ ] Abaixo de 768 px: um cartão por cliente, com as mesmas informações e ações.
- [ ] Filtros por status no topo da lista; o filtro ativo fica visível.
- [ ] Marcar pago e desfazer dão retorno em até 250 ms, com mensagem lida pelo leitor de tela.
- [ ] Estado vazio com uma frase e o botão **+ Novo cliente**.

### DV-05 · Abas Obrigações e Régua
**Como** contador, **quero** o checklist e a régua no mesmo visual da lista, **para** não reaprender a tela.
- [ ] Obrigações: "X de Y feitos" com barra de progresso no estilo do card Recebido.
- [ ] Régua: 4 lembretes com interruptor, chave Pix e prévia da mensagem no estilo de cartão plano.
- [ ] Interruptores com rótulo e estado lidos pelo leitor de tela.

### DV-06 · Janelas de ação
**Como** contador, **quero** que Novo cliente, Ajustar valor e Cobrar abram por cima da tela, **para** não perder o lugar na lista.
- [ ] Janela com sombra de elemento flutuante, fecha com Esc e devolve o foco a quem abriu.
- [ ] No celular, a janela ocupa a largura toda e sobe de baixo.
- [ ] Erros de campo aparecem junto ao campo, em texto (Mapa de fluxo, seção 15).

### DV-07 · Login e primeiro acesso
**Como** contador novo, **quero** um cadastro curto e com o mesmo visual do app, **para** confiar o suficiente para informar a chave Pix.
- [ ] Telas do Mapa de fluxo, seção 2, no mesmo conjunto de tokens.
- [ ] Aceite de termos e privacidade explícito, sem caixa marcada de antemão (RF-43).

### DV-09 · Página pública (depois da F1)
**Como** contador que ainda não conhece o Neximob, **quero** ver a régua funcionando antes de criar conta, **para** entender o valor em segundos.
- [ ] Estrutura do Pairio adaptada: herói com título em dois tempos, demonstração da régua (no lugar das vitrines), preço aberto, perguntas frequentes.
- [ ] Demonstração anima uma vez ao entrar na tela e fica parada e legível com movimento reduzido.
- [ ] Nada de logo, texto, avatar ou ícone do Pairio. Texto e preço com o PMM.

### DV-11 · Logo transparente e favicons
**Como** contador, **quero** reconhecer o Neximob na aba do navegador, na tela inicial do celular e no e-mail de cobrança, **para** saber de onde vem cada aviso.
- [ ] Logo vetorial (SVG) redesenhada a partir do bitmap, **com fundo transparente**, nas 4 cores exatas da paleta. Nada de recorte do PNG com borda branca.
- [ ] Versões: símbolo sozinho; símbolo + nome "Neximob"; versão para **fundo escuro** (traços Grafite viram Areia; Vinho com contraste de pelo menos 3:1 sobre Grafite); versão de uma cor só.
- [ ] Favicon simplificado (menos traços) que continua legível em 16 e 32 px, conferido no tema claro e escuro do navegador.
- [ ] Arquivos: `favicon.ico` (16, 32 e 48 px), `icon.svg`, `apple-touch-icon.png` (180 px, com fundo, sem transparência), ícones de 192 e 512 px e ícone *maskable* para o manifesto do app, e imagem de compartilhamento (1200 × 630 px).
- [ ] PNG da logo em fundo transparente para o cabeçalho dos e-mails da régua (o Gmail não mostra SVG).
- [ ] Área de respiro e tamanho mínimo da logo escritos ao lado dos arquivos.

## 8. Decisões em aberto

| Decisão | Quem decide | Quando |
|---|---|---|
| Par de fontes | UX | Antes da DV-01 |
| Fundo do tema claro: branco ou tom derivado da Areia | UX | Antes da DV-01 |
| Tom de Vinho para link e foco no tema escuro | UX | Antes da DV-01 |
| Página pública entra antes da F5? | Usuário, com o PMM | Depois da F1 |

## 9. Próximos passos

1. **Staff UX/UI Product Designer:** entregar a logo e os favicons (DV-11), fechar os tokens claro e escuro a partir da seção 4 (DV-01) e desenhar DV-02 e DV-04 em 390 e 1440 px. Essas telas também servem para a validação com o contador (F1).
2. **Principal Systems Architect (concluído em 27/11/2026):** fechado em [ADR-0009](./adr/0009-arquitetura-frontend-nextjs-vinext-tailwind-fontes.md) e no [Plano de Engenharia Frontend](./Plano%20de%20Engenharia%20Frontend.md) — tema único em `src/app/neximob-theme.css` (Tailwind v4), runtime `vinext` na Cloudflare Workers e 2 arquivos `.woff2` variáveis self-hosted em `public/fonts/`.
3. **Senior Software Engineer:** executar as tarefas atômicas `FE-01` a `FE-10` na ordem da seção 7.

## Histórico do documento

| Versão | Data | Autor | Mudança |
|---|---|---|---|
| 0.1 | 27/11/2026 | GPM | Primeira versão: restrições, manter e trocar, status, histórias e RICE |
| 0.2 | 27/11/2026 | GPM | Logo e paleta da marca decididas (seção 4) com contraste medido; nova DV-11 (logo e favicons); tela única desenhada a partir do Mapa de fluxo |
