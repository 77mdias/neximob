# Kit de Marca e Favicons — Neximob (DV-11)

Arquivos oficiais da identidade visual do **Neximob**, redesenhados geometricamente em vetor (SVG) com fundo transparente nas 5 cores oficiais da marca e acompanhados do conjunto completo de favicons, ícones PWA, cabeçalho para e-mail e imagem Open Graph.

## 1. Paleta oficial da marca

| Nome | Hex | Uso na marca |
|---|---|---|
| **Areia** | `#DDDCC5` | Fundo dos ícones de app/favicon, traços claros da marca no tema escuro |
| **Taupe** | `#958976` | Traço do sinal de feito (✓) nos dois temas |
| **Vinho** | `#611427` | Traço superior esquerdo da marca no tema claro (no tema escuro: `#C64865`, 3,42:1 sobre `#1D2326`) |
| **Grafite** | `#1D2326` | Traço interno da marca no tema claro e fundo do tema escuro |
| **Oliva** | `#6A6A61` | Traço inferior direito da marca no tema claro (no tema escuro: `#8E8D80`, 4,15:1 sobre `#1D2326`) |

## 2. Inventário de arquivos

### Marca (`public/brand/`)

| Arquivo | Formato | Fundo | Quando usar |
|---|---|---|---|
| `logo-mark.svg` | SVG vetorial (`385×316`) | Transparente | Símbolo principal em fundos claros (`#FFFFFF`, `#F4F3EB`, `#DDDCC5`) |
| `logo-mark-dark.svg` | SVG vetorial (`385×316`) | Transparente | Símbolo principal em fundos escuros (`#1D2326`, `#252C30`) |
| `logo-mark-mono-dark.svg` | SVG vetorial | Transparente | Impressão, marca d'água ou aplicação monocromática sobre fundo claro (`#1D2326`) |
| `logo-mark-mono-light.svg` | SVG vetorial | Transparente | Aplicação monocromática sobre fundo escuro (`#DDDCC5`) |
| `logo-horizontal.svg` | SVG vetorial (`216×44`) | Transparente | Cabeçalho do app, login e página pública no tema claro |
| `logo-horizontal-dark.svg` | SVG vetorial (`216×44`) | Transparente | Cabeçalho do app, login e página pública no tema escuro |
| `logo-transparent.png` | PNG (`1024×841`) | Transparente | Apresentações, materiais externos e integrações sem suporte a SVG (tema claro) |
| `logo-transparent-dark.png` | PNG (`1024×841`) | Transparente | Materiais externos sobre fundo escuro (`#1D2326`) |
| `logo-square-transparent.png` | PNG (`512×512`) | Transparente | Avatar de perfil, redes sociais e integrações quadradas (tema claro) |
| `logo-square-transparent-dark.png` | PNG (`512×512`) | Transparente | Avatar quadrado sobre fundo escuro |
| `logo-email.png` | PNG (`320×65`, retina `@2x`) | Transparente | Cabeçalho dos e-mails da régua de cobrança (renderizar em `width="160"`; Gmail bloqueia SVG) |

### Favicons, PWA e compartilhamento (`public/`)

| Arquivo | Dimensão | Fundo | Finalidade |
|---|---|---|---|
| `icon.svg` | Vetorial (`64×64`) | Areia `#DDDCC5` (cantos arredondados) | Favicon simplificado (traços mais espessos para nitidez em 16 e 32 px em abas claras e escuras) |
| `favicon.ico` | Multi (`16`, `32`, `48 px`) | Areia `#DDDCC5` | Fallback universal para navegadores legados e favoritos |
| `favicon-16x16.png` | `16×16 px` | Areia `#DDDCC5` | Aba do navegador (1x) |
| `favicon-32x32.png` | `32×32 px` | Areia `#DDDCC5` | Aba do navegador (retina) e barra de favoritos |
| `apple-touch-icon.png` | `180×180 px` | Areia `#DDDCC5` sólido (sem transparência) | Atalho na tela inicial do iOS/iPadOS |
| `icon-192.png` | `192×192 px` | Areia `#DDDCC5` (arredondado) | Manifesto web / Android |
| `icon-512.png` | `512×512 px` | Areia `#DDDCC5` (arredondado) | Splash screen e instalação PWA |
| `icon-512-maskable.png` | `512×512 px` | Areia `#DDDCC5` sólido | Ícone adaptativo Android (marca centralizada dentro da zona segura de 80%) |
| `site.webmanifest` | JSON | — | Metadados PWA (`theme_color: #611427`, `lang: pt-BR`) |
| `og-image.png` | `1200×630 px` | `#FFFFFF` + faixa `#DDDCC5` | Prévia de compartilhamento (WhatsApp, LinkedIn, X, Open Graph) |

## 3. Regras de uso, área de respiro e tamanho mínimo

- **Área de respiro (margem de segurança):** manter livre ao redor do símbolo ou do lockup o equivalente a **25% da altura da marca (`0,25 × H`)** — aproximadamente a espessura de um traço mais um canal. Nenhum texto, borda ou botão pode invadir essa área.
- **Tamanhos mínimos:**
  - **Símbolo completo (`logo-mark*.svg`):** mínimo de **24 px** de altura em telas (`8 mm` impresso).
  - **Abaixo de 24 px (16 px a 23 px):** usar **exclusivamente** a versão simplificada (`icon.svg` / `favicon-*.png`), cujos traços são mais grossos para não empastar.
  - **Lockup horizontal (`logo-horizontal*.svg`):** mínimo de **120 px** de largura (altura ~24 px). Em telas estreitas onde houver aperto, exibir apenas o símbolo.
- **Proibições:**
  - Nunca colocar `logo-mark.svg` (versão clara) diretamente sobre `#1D2326` ou superfícies escuras — os traços Grafite e Vinho somem. Usar `logo-mark-dark.svg` ou aplicar sobre um tile Areia (`#DDDCC5`).
  - Nunca distorcer proporções, adicionar sombra projetada no símbolo ou trocar a cor do sinal de feito (✓).
  - Nunca usar SVG em e-mails da régua; usar `logo-email.png` com `alt="Neximob"`.

## 4. Integração no Next.js (`src/app/layout.tsx`)

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Neximob — Honorários e prazos fiscais",
  description:
    "Cobrança mensal de honorários e checklist de prazos fiscais para contadores.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Neximob",
    description:
      "Cobrança mensal de honorários e checklist de prazos fiscais para contadores.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Neximob" }],
    locale: "pt_BR",
    type: "website",
  },
};
```
