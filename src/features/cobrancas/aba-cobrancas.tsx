"use client";

import { Plus, Users } from "lucide-react";
import { useMemo } from "react";
import {
  contarFiltrosCobrancas,
  FILTROS_COBRANCA,
  filtrarCobrancas,
  type FiltroCobranca,
} from "@/lib/cobrancas-filter";
import type { CobrancaDoMesRow } from "@/lib/database.types";
import { formatarMesTitulo } from "@/lib/dates";
import { CartoesCobrancasMobile } from "./cartoes-cobrancas-mobile";
import { FiltrosStatus } from "./filtros-status";
import { TabelaCobrancasDesktop } from "./tabela-cobrancas-desktop";

interface AbaCobrancasProps {
  mesIso: string;
  hojeIso: string;
  cobrancas: CobrancaDoMesRow[];
  qtdClientesAtivos: number;
  filtro: FiltroCobranca;
  busca: string;
  pendenteId: string | null;
  onMudarFiltro: (filtro: FiltroCobranca) => void;
  onMudarBusca: (valor: string) => void;
  onNovoCliente: () => void;
  onMarcarPago: (linha: CobrancaDoMesRow) => void;
  onDesfazerPago: (linha: CobrancaDoMesRow) => void;
  onCobrar: (linha: CobrancaDoMesRow) => void;
  onAjustarValor: (linha: CobrancaDoMesRow) => void;
  onVerEnvios: (linha: CobrancaDoMesRow) => void;
  onEditarCliente: (linha: CobrancaDoMesRow) => void;
  onArquivarCliente: (linha: CobrancaDoMesRow) => void;
  onExcluirCliente: (linha: CobrancaDoMesRow) => void;
}

export function AbaCobrancas({
  mesIso,
  hojeIso,
  cobrancas,
  qtdClientesAtivos,
  filtro,
  busca,
  pendenteId,
  onMudarFiltro,
  onMudarBusca,
  onNovoCliente,
  onMarcarPago,
  onDesfazerPago,
  onCobrar,
  onAjustarValor,
  onVerEnvios,
  onEditarCliente,
  onArquivarCliente,
  onExcluirCliente,
}: AbaCobrancasProps) {
  const contagens = useMemo(() => contarFiltrosCobrancas(cobrancas), [cobrancas]);
  const linhasFiltradas = useMemo(
    () => filtrarCobrancas(cobrancas, filtro, busca),
    [cobrancas, filtro, busca],
  );
  const rotuloFiltroAtivo =
    FILTROS_COBRANCA.find((f) => f.key === filtro)?.label ?? "Todos";

  if (qtdClientesAtivos === 0 && cobrancas.length === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[var(--nx-border-strong)] bg-[var(--nx-surface-subtle)] p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--nx-surface-brand)] text-[var(--nx-text)]">
          <Users className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-serif text-[22px] font-medium text-[var(--nx-text)]">
          Nenhum cliente cadastrado ainda.
        </h2>
        <p className="mx-auto mt-2 max-w-[440px] text-[14px] leading-relaxed text-[var(--nx-text-body)]">
          Cadastre o primeiro cliente para acompanhar honorários, lembretes e guias do mês.
        </p>
        <button
          type="button"
          onClick={onNovoCliente}
          className="mt-5 inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-semibold text-[var(--nx-accent-fg)] transition hover:bg-[var(--nx-accent-hover)]"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Novo cliente</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FiltrosStatus
        filtroAtivo={filtro}
        contagens={contagens}
        busca={busca}
        onMudarFiltro={onMudarFiltro}
        onMudarBusca={onMudarBusca}
      />

      {linhasFiltradas.length === 0 ? (
        <div className="rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-8 text-center">
          <p className="text-[14px] font-medium text-[var(--nx-text)]">
            {cobrancas.length === 0
              ? `Nenhuma cobrança programada para ${formatarMesTitulo(mesIso).toLowerCase()}.`
              : busca.trim().length > 0
                ? "Nenhuma cobrança encontrada com a busca atual."
                : `Nenhuma cobrança com o filtro "${rotuloFiltroAtivo}" neste mês.`}
          </p>
          {cobrancas.length > 0 && (filtro !== "todos" || busca.trim().length > 0) ? (
            <button
              type="button"
              onClick={() => {
                onMudarFiltro("todos");
                onMudarBusca("");
              }}
              className="mt-3 inline-flex min-h-[38px] cursor-pointer items-center rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3.5 text-[13px] font-medium text-[var(--nx-accent)] hover:bg-[var(--nx-surface-muted)]"
            >
              Limpar filtro
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <TabelaCobrancasDesktop
            linhas={linhasFiltradas}
            hojeIso={hojeIso}
            pendenteId={pendenteId}
            onMarcarPago={onMarcarPago}
            onDesfazerPago={onDesfazerPago}
            onCobrar={onCobrar}
            onAjustarValor={onAjustarValor}
            onVerEnvios={onVerEnvios}
            onEditarCliente={onEditarCliente}
            onArquivarCliente={onArquivarCliente}
            onExcluirCliente={onExcluirCliente}
          />
          <CartoesCobrancasMobile
            linhas={linhasFiltradas}
            hojeIso={hojeIso}
            pendenteId={pendenteId}
            onMarcarPago={onMarcarPago}
            onDesfazerPago={onDesfazerPago}
            onCobrar={onCobrar}
            onAjustarValor={onAjustarValor}
            onVerEnvios={onVerEnvios}
            onEditarCliente={onEditarCliente}
            onArquivarCliente={onArquivarCliente}
            onExcluirCliente={onExcluirCliente}
          />
        </>
      )}
    </div>
  );
}
