"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import {
  adicionarMeses,
  formatarMesCurto,
  formatarMesTitulo,
  mesParametro,
} from "@/lib/dates";
import { iniciaisDoNome } from "@/lib/format";

interface TopBarProps {
  mesIso: string;
  mesCorrenteIso: string;
  nomeContador: string;
  onTrocarMes: (novoMesIso: string) => void;
  onNovoCliente: () => void;
  accountMenuSlot: ReactNode;
}

export function TopBar({
  mesIso,
  mesCorrenteIso,
  nomeContador,
  onTrocarMes,
  onNovoCliente,
  accountMenuSlot,
}: TopBarProps) {
  const mesAnterior = adicionarMeses(mesIso, -1);
  const proximoMes = adicionarMeses(mesIso, 1);
  const foraDoMesCorrente = mesIso !== mesCorrenteIso;

  return (
    <header className="sticky top-0 z-30 flex h-[56px] items-center border-b border-[var(--nx-border)] bg-[var(--nx-header-bg)] backdrop-blur-md md:h-[64px]">
      <div className="mx-auto flex w-full max-w-[1152px] items-center justify-between gap-3 px-4 md:px-8 lg:px-12">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            className="inline-flex shrink-0 items-center rounded-[6px] py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--nx-focus-ring)]"
            aria-label="Neximob — Início do painel"
          >
            <BrandLogo variant="responsive" />
          </Link>

          <nav
            aria-label="Mês de referência"
            className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-0.5"
          >
            <button
              type="button"
              onClick={() => onTrocarMes(mesAnterior)}
              className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent text-[var(--nx-text-strong)] transition hover:bg-[var(--nx-surface-muted)]"
              aria-label="Mês anterior"
              title={`Ir para ${formatarMesTitulo(mesAnterior)}`}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>

            <span
              className="px-2 text-[13px] font-semibold whitespace-nowrap text-[var(--nx-text)]"
              data-mes={mesParametro(mesIso)}
            >
              <span className="sm:hidden">{formatarMesCurto(mesIso)}</span>
              <span className="hidden sm:inline">{formatarMesTitulo(mesIso)}</span>
            </span>

            <button
              type="button"
              onClick={() => onTrocarMes(proximoMes)}
              className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[4px] border-0 bg-transparent text-[var(--nx-text-strong)] transition hover:bg-[var(--nx-surface-muted)]"
              aria-label="Próximo mês"
              title={`Ir para ${formatarMesTitulo(proximoMes)}`}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </nav>

          {foraDoMesCorrente ? (
            <button
              type="button"
              onClick={() => onTrocarMes(mesCorrenteIso)}
              className="hidden h-[30px] cursor-pointer items-center rounded-full border border-[var(--nx-border)] bg-[var(--nx-bg)] px-2.5 text-[12px] font-medium whitespace-nowrap text-[var(--nx-accent)] transition hover:border-[var(--nx-border-strong)] hover:bg-[var(--nx-surface-subtle)] md:inline-flex"
            >
              Voltar ao mês atual
            </button>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onNovoCliente}
            className="hidden h-[36px] cursor-pointer items-center gap-1.5 rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-3.5 text-[13px] font-semibold whitespace-nowrap text-[var(--nx-accent-fg)] transition hover:bg-[var(--nx-accent-hover)] md:inline-flex"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Novo cliente</span>
          </button>

          <div className="relative" data-iniciais={iniciaisDoNome(nomeContador)}>
            {accountMenuSlot}
          </div>
        </div>
      </div>
    </header>
  );
}
