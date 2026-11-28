import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "fonts");

const FONTS = [
  {
    src: path.join(root, "node_modules", "@fontsource-variable", "inter", "files", "inter-latin-wght-normal.woff2"),
    dest: path.join(outDir, "inter-latin-wght-normal.woff2"),
  },
  {
    src: path.join(root, "node_modules", "@fontsource-variable", "newsreader", "files", "newsreader-latin-wght-normal.woff2"),
    dest: path.join(outDir, "newsreader-latin-wght-normal.woff2"),
  },
];

mkdirSync(outDir, { recursive: true });

for (const font of FONTS) {
  if (!existsSync(font.src)) {
    throw new Error(`Fonte variável não encontrada: ${font.src}`);
  }
  copyFileSync(font.src, font.dest);
}

console.log(`Sincronizados ${FONTS.length} arquivos .woff2 em public/fonts/`);
