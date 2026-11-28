"use client";

import { Search, X } from "lucide-react";
import { FILTROS_COBRANCA, type FiltroCobranca } from "@/lib/cobrancas-filter";

interface FiltrosStatusProps {
  filtroAtivo: FiltroCobranca;
  contagens: Record<FiltroCobranca, number>;
  busca: string;
  onMudarFiltro: (filtro: FiltroCobranca) => void;
  onMudarBusca: (valor: string) => void;
}

export function FiltrosStatus({
  filtroAtivo,
  contagens,
  busca,
  onMudarFiltro,
  onMudarBusca,
}: FiltrosStatusProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div
        role="group"
        aria-label="Filtrar cobranças por situação"
        className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
      >
        {FILTROS_COBRANCA.map((item) => {
          const ativo = filtroAtivo === item.key;
          const total = contagens[item.key];
          return (
            <button
              key={item.key}
              type="button"
              aria-pressed={ativo}
              onClick={() => onMudarFiltro(item.key)}
              className={`inline-flex min-h-[34px] shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12.5px] transition ${
                ativo
                  ? "border-[var(--nx-accent)] bg-[var(--nx-accent-tint)] font-semibold text-[var(--nx-accent)]"
                  : "border-[var(--nx-border)] bg-[var(--nx-bg)] font-medium text-[var(--nx-text-body)] hover:border-[var(--nx-border-strong)] hover:bg-[var(--nx-surface-subtle)]"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[11px] tabular-nums ${
                  ativo
                    ? "bg-[var(--nx-bg)]/80 text-[var(--nx-accent)]"
                    : "bg-[var(--nx-surface-muted)] text-[var(--nx-text-muted)]"
                }`}
              >
                {total}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative w-full sm:w-[240px]">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--nx-text-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          value={busca}
          onChange={(e) => onMudarBusca(e.target.value)}
          placeholder="Buscar cliente..."
          aria-label="Buscar cliente pelo nome"
          className="min-h-[38px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] pr-8 pl-9 text-[14px] text-[var(--nx-text)] placeholder:text-[var(--nx-text-muted)]"
        />
        {busca ? (
          <button
            type="button"
            onClick={() => onMudarBusca("")}
            className="absolute top-1/2 right-1.5 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[4px] text-[var(--nx-text-muted)] hover:bg-[var(--nx-surface-muted)]"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
