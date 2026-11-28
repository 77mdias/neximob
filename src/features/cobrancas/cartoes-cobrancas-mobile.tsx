"use client";

import {
  Archive,
  Check,
  History,
  MailWarning,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  UserX,
} from "lucide-react";
import { useState } from "react";
import type { CobrancaDoMesRow } from "@/lib/database.types";
import { formatBRL, formatProximoLembrete, formatTipoCliente } from "@/lib/format";
import { StatusCobrancaBadge } from "./status-cobranca-badge";

interface CartoesCobrancasMobileProps {
  linhas: CobrancaDoMesRow[];
  hojeIso: string;
  pendenteId: string | null;
  onMarcarPago: (linha: CobrancaDoMesRow) => void;
  onDesfazerPago: (linha: CobrancaDoMesRow) => void;
  onCobrar: (linha: CobrancaDoMesRow) => void;
  onAjustarValor: (linha: CobrancaDoMesRow) => void;
  onVerEnvios: (linha: CobrancaDoMesRow) => void;
  onEditarCliente: (linha: CobrancaDoMesRow) => void;
  onArquivarCliente: (linha: CobrancaDoMesRow) => void;
  onExcluirCliente: (linha: CobrancaDoMesRow) => void;
}

export function CartoesCobrancasMobile({
  linhas,
  hojeIso,
  pendenteId,
  onMarcarPago,
  onDesfazerPago,
  onCobrar,
  onAjustarValor,
  onVerEnvios,
  onEditarCliente,
  onArquivarCliente,
  onExcluirCliente,
}: CartoesCobrancasMobileProps) {
  const [expandidoId, setExpandidoId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2.5 md:hidden">
      {linhas.map((linha) => {
        const pago = linha.situacao === "pago";
        const ocupada = pendenteId === linha.cobranca_id;
        const aberto = expandidoId === linha.cobranca_id;

        return (
          <article
            key={linha.cobranca_id}
            className="flex flex-col gap-2.5 rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-bg)] p-3.5"
          >
            {/* Topo: Nome + chip de tipo e selo de status */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditarCliente(linha)}
                    className="cursor-pointer truncate text-left text-[14px] font-semibold text-[var(--nx-text)]"
                  >
                    {linha.cliente_nome}
                  </button>
                  <span className="shrink-0 rounded-[4px] bg-[var(--nx-surface-muted)] px-1.5 py-0.5 text-[11px] leading-none font-semibold text-[var(--nx-text-strong)]">
                    {formatTipoCliente(linha.tipo)}
                  </span>
                </div>

                {linha.email_situacao !== "ok" ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--nx-status-overdue-fg)]">
                    <MailWarning className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>E-mail devolvido</span>
                  </p>
                ) : linha.sem_contato ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-[var(--nx-text-muted)]">
                    <UserX className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Sem contato cadastrado</span>
                  </p>
                ) : null}
              </div>

              <StatusCobrancaBadge
                situacao={linha.situacao}
                vencimentoIso={linha.vencimento}
                diasAtraso={linha.dias_atraso}
              />
            </div>

            {/* Meio: Valor em destaque + Próximo lembrete */}
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[var(--nx-border-subtle)] pt-2">
              <div>
                <p className="text-[15px] font-semibold tabular-nums text-[var(--nx-text)]">
                  {formatBRL(linha.total)}
                </p>
                {Number(linha.extra) > 0 ? (
                  <p className="text-[12px] tabular-nums text-[var(--nx-text-muted)]">
                    + {formatBRL(linha.extra)}
                    {linha.motivo_extra ? ` · ${linha.motivo_extra}` : ""}
                  </p>
                ) : null}
                {linha.meses_em_aberto_anteriores > 0 ? (
                  <p className="text-[12px] font-medium tabular-nums text-[var(--nx-status-overdue-fg)]">
                    + {linha.meses_em_aberto_anteriores}{" "}
                    {linha.meses_em_aberto_anteriores === 1 ? "mês anterior" : "meses anteriores"} (
                    {formatBRL(linha.total_em_aberto_anteriores)})
                  </p>
                ) : null}
              </div>

              <p className="text-[12px] text-[var(--nx-text-muted)]">
                {formatProximoLembrete(linha, hojeIso)}
              </p>
            </div>

            {/* Base: Ações com área mínima de toque 44x44px (DV-10) */}
            <div className="grid grid-cols-[1fr_1fr_44px] items-center gap-2 pt-1">
              {pago ? (
                <button
                  type="button"
                  disabled={ocupada}
                  onClick={() => onDesfazerPago(linha)}
                  className="col-span-2 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3 text-[13px] font-semibold text-[var(--nx-text-strong)]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  <span>Desfazer</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={ocupada}
                    onClick={() => onCobrar(linha)}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3 text-[13px] font-semibold text-[var(--nx-text-strong)]"
                  >
                    Cobrar
                  </button>
                  <button
                    type="button"
                    disabled={ocupada}
                    onClick={() => onMarcarPago(linha)}
                    className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-surface)] px-3 text-[13px] font-semibold text-[var(--nx-text)]"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                    <span>Marcar pago</span>
                  </button>
                </>
              )}

              <button
                type="button"
                aria-expanded={aberto}
                aria-label={`Mais ações para ${linha.cliente_nome}`}
                onClick={() =>
                  setExpandidoId((atual) => (atual === linha.cobranca_id ? null : linha.cobranca_id))
                }
                className="inline-flex h-[44px] w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] text-[var(--nx-text-body)]"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {aberto ? (
              <div className="grid grid-cols-2 gap-2 border-t border-[var(--nx-border-subtle)] pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setExpandidoId(null);
                    onAjustarValor(linha);
                  }}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] bg-[var(--nx-surface-subtle)] px-2.5 text-[13px] font-medium text-[var(--nx-text-strong)]"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Ajustar valor</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandidoId(null);
                    onVerEnvios(linha);
                  }}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] bg-[var(--nx-surface-subtle)] px-2.5 text-[13px] font-medium text-[var(--nx-text-strong)]"
                >
                  <History className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Ver envios</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandidoId(null);
                    onEditarCliente(linha);
                  }}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] bg-[var(--nx-surface-subtle)] px-2.5 text-[13px] font-medium text-[var(--nx-text-strong)]"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Editar cliente</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandidoId(null);
                    onArquivarCliente(linha);
                  }}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] bg-[var(--nx-surface-subtle)] px-2.5 text-[13px] font-medium text-[var(--nx-text-strong)]"
                >
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Inativar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setExpandidoId(null);
                    onExcluirCliente(linha);
                  }}
                  className="col-span-2 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] px-2.5 text-[13px] font-medium text-[var(--nx-status-overdue-fg)]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Excluir cliente</span>
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
