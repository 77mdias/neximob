import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { THEME_STORAGE_KEY } from "@/features/conta/theme-store";

vi.mock("server-only", () => ({}));

const ROOT = path.resolve(import.meta.dirname, "../..");

function listTsxFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...listTsxFiles(full));
    } else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

describe("theme-and-env", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("contém os tokens essenciais no neximob-theme.css sem erro", () => {
    const css = readFileSync(path.join(ROOT, "src/app/neximob-theme.css"), "utf8");
    expect(css).toContain("--nx-bg: #ffffff");
    expect(css).toContain("--nx-brand-vinho: #611427");
    expect(css).toContain("--nx-brand-areia: #dddcc5");
    expect(css).toContain("--nx-input-bg: #faf9f5");
    expect(css).toContain("--nx-header-bg: rgba(255, 255, 255, 0.92)");
    expect(css).toContain("[data-theme=\"dark\"]");
    expect(css).toContain("@theme inline");
  });

  it("usa a chave neximob-theme no layout anti-flash e no theme-store (ADR-0009)", () => {
    expect(THEME_STORAGE_KEY).toBe("neximob-theme");
    const layout = readFileSync(path.join(ROOT, "src/app/layout.tsx"), "utf8");
    expect(layout).toContain('localStorage.getItem("neximob-theme")');
    expect(layout).toContain('/fonts/inter-latin-wght-normal.woff2');
    expect(layout).toContain('viewportFit: "cover"');
  });

  it("preserva contraste WCAG nos botões primários e chips selecionados no tema escuro", () => {
    const files = listTsxFiles(path.join(ROOT, "src"));
    for (const file of files) {
      const src = readFileSync(file, "utf8");
      // Taupe (#958976) nunca deve ser usado como fundo de chip/botão com texto Vinho
      expect(src, path.relative(ROOT, file)).not.toContain("bg-[var(--nx-accent-soft)]");
      expect(src, path.relative(ROOT, file)).not.toContain("bg-accent-soft");

      // Todo botão primário Vinho (#611427) precisa de borda --nx-accent-border (WCAG 1.4.11 no escuro)
      if (src.includes("bg-[var(--nx-accent-btn-bg)]")) {
        expect(src, path.relative(ROOT, file)).toContain("border-[var(--nx-accent-border)]");
      }
    }
  });

  it("mantém a calibração da tabela desktop (26/15.5/17/19/22.5, align-top e pr-6)", () => {
    const tabela = readFileSync(
      path.join(ROOT, "src/features/cobrancas/tabela-cobrancas-desktop.tsx"),
      "utf8",
    );
    expect(tabela).toContain('w-[26%]');
    expect(tabela).toContain('w-[15.5%]');
    expect(tabela).toContain('w-[17%]');
    expect(tabela).toContain('w-[19%]');
    expect(tabela).toContain('w-[22.5%]');
    expect(tabela).toContain("align-top");
    expect(tabela).not.toContain("align-middle");
    expect(tabela).toContain("pr-6");
  });

  it("bloqueia SUPABASE_SERVICE_ROLE_KEY no ambiente web (ADR-0004)", async () => {
    const { assertNoServiceRoleKeyInWebEnv, getPublicSupabaseEnv } = await import("@/server/env");
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-public-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "secret-role";

    expect(() => assertNoServiceRoleKeyInWebEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);

    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const env = getPublicSupabaseEnv();
    expect(env.url).toBe("https://exemplo.supabase.co");
    expect(env.anonKey).toBe("anon-public-key");
  });
});
