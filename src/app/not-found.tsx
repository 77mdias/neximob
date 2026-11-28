import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function NotFoundPage() {
  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex min-h-screen max-w-[520px] flex-col items-start justify-center px-6 py-12"
    >
      <BrandLogo variant="horizontal" className="mb-8" />
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--nx-text-muted)]">
        Página não encontrada
      </p>
      <h1 className="mt-2 font-serif text-[28px] font-semibold tracking-tight text-[var(--nx-text)]">
        Este endereço não existe no Neximob
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--nx-text-body)]">
        Confira se o link está completo ou volte para o painel principal do escritório.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-[40px] items-center justify-center rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] transition hover:bg-[var(--nx-accent-hover)]"
      >
        Ir para o painel
      </Link>
    </main>
  );
}
