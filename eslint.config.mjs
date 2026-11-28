import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  {
    ignores: [
      ".next/**",
      ".vinext/**",
      "dist/**",
      ".wrangler/**",
      "node_modules/**",
      "supabase/**",
      "docs/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      // Usamos <img> intencionalmente para SVGs de public/brand/ alternados por CSS sem otimizador Next.
      "@next/next/no-img-element": "off",
    },
  },
];

export default config;
