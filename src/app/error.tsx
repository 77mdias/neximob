"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erro na interface Neximob:", error.message);
  }, [error]);

  return (
    <main
      id="conteudo-principal"
      className="mx-auto flex min-h-screen max-w-[520px] flex-col items-start justify-center px-6 py-12"
    >
      <BrandLogo variant="horizontal" className="mb-8" />
      <h1 className="font-serif text-[28px] font-semibold tracking-tight text-[var(--nx-text)]">
        Algo saiu do esperado por aqui
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--nx-text-body)]">
        Seus registros salvos continuam intactos. Você pode tentar carregar esta tela novamente ou
        voltar para o início.
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] transition hover:bg-[var(--nx-accent-hover)]"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex min-h-[40px] items-center justify-center rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-strong)] transition hover:bg-[var(--nx-surface-subtle)]"
        >
          Voltar para o painel
        </Link>
      </div>
    </main>
  );
}
