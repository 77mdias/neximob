import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--nx-surface-subtle)]">
      <header className="border-b border-[var(--nx-border)] bg-[var(--nx-bg)]">
        <div className="mx-auto flex h-[60px] max-w-[960px] items-center justify-between px-4 sm:px-6">
          <Link
            href="/entrar"
            className="inline-flex items-center rounded-[6px] py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nx-focus-ring)]"
          >
            <BrandLogo variant="horizontal" />
          </Link>
          <span className="text-[12px] text-[var(--nx-text-muted)]">
            Controle mensal contábil
          </span>
        </div>
      </header>

      <main
        id="conteudo-principal"
        className="mx-auto flex w-full max-w-[460px] flex-1 flex-col justify-center px-4 py-10"
      >
        <div className="rounded-[10px] border border-[var(--nx-border)] bg-[var(--nx-bg)] p-6 sm:p-8">
          {children}
        </div>
      </main>

      <footer className="border-t border-[var(--nx-border-subtle)] bg-[var(--nx-bg)] py-4 text-center text-[12px] text-[var(--nx-text-muted)]">
        <div className="mx-auto flex max-w-[960px] flex-wrap items-center justify-center gap-4 px-4">
          <Link href="/termos" className="hover:text-[var(--nx-text)] hover:underline">
            Termos de Uso
          </Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacidade" className="hover:text-[var(--nx-text)] hover:underline">
            Política de Privacidade
          </Link>
        </div>
      </footer>
    </div>
  );
}
