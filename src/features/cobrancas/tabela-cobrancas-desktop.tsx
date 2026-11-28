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
import { useEffect, useRef, useState } from "react";
import type { CobrancaDoMesRow } from "@/lib/database.types";
import { formatBRL, formatProximoLembrete, formatTipoCliente } from "@/lib/format";
import { StatusCobrancaBadge } from "./status-cobranca-badge";

interface TabelaCobrancasDesktopProps {
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

export function TabelaCobrancasDesktop({
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
}: TabelaCobrancasDesktopProps) {
  const [menuAbertoId, setMenuAbertoId] = useState<string | null>(null);
  const tabelaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuAbertoId) return;
    const onPointerDown = (e: MouseEvent) => {
      if (tabelaRef.current && !tabelaRef.current.contains(e.target as Node)) {
        setMenuAbertoId(null);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuAbertoId(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuAbertoId]);

  return (
    <div
      ref={tabelaRef}
      className="hidden overflow-visible rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-bg)] md:block"
    >
      <table className="w-full border-collapse text-left lg:table-fixed">
        <colgroup>
          <col className="w-[26%]" />
          <col className="w-[15.5%]" />
          <col className="w-[17%]" />
          <col className="w-[19%]" />
          <col className="w-[22.5%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] text-[12px] font-semibold tracking-[0.01em] whitespace-nowrap text-[var(--nx-text-muted)]">
            <th scope="col" className="px-3.5 py-[11px]">
              Cliente
            </th>
            <th scope="col" className="py-[11px] pr-6 pl-1.5 text-right">
              Valor do mês
            </th>
            <th scope="col" className="px-2.5 py-[11px]">
              Status
            </th>
            <th scope="col" className="px-2.5 py-[11px]">
              Próximo lembrete
            </th>
            <th scope="col" className="py-[11px] pr-3.5 pl-2 text-right">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--nx-border-subtle)] text-[14px]">
          {linhas.map((linha) => {
            const ocupada = pendenteId === linha.cobranca_id;
            const pago = linha.situacao === "pago";
            const menuAberto = menuAbertoId === linha.cobranca_id;
            const lembreteTexto = formatProximoLembrete(linha, hojeIso);

            return (
              <tr
                key={linha.cobranca_id}
                className="transition-colors duration-150 hover:bg-[var(--nx-surface-subtle)]"
              >
                {/* 1. Cliente (26%): nome + chip de tipo em 1 linha, avisos na sublinha */}
                <td className="px-3.5 py-[15px] align-top">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onEditarCliente(linha)}
                      className="min-w-0 cursor-pointer truncate text-left text-[14px] leading-[22px] font-semibold text-[var(--nx-text)] hover:text-[var(--nx-accent)] hover:underline"
                      title={linha.cliente_nome}
                    >
                      {linha.cliente_nome}
                    </button>
                    <span className="shrink-0 rounded-[4px] bg-[var(--nx-surface-muted)] px-1.5 py-0.5 text-[11px] leading-none font-semibold text-[var(--nx-text-strong)]">
                      {formatTipoCliente(linha.tipo)}
                    </span>
                  </div>

                  {linha.email_situacao !== "ok" ? (
                    <div className="mt-[3px] inline-flex items-center gap-1 text-[11.5px] leading-[1.35] font-medium text-[var(--nx-status-overdue-fg)]">
                      <MailWarning className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>E-mail devolvido</span>
                    </div>
                  ) : linha.sem_contato ? (
                    <div className="mt-[3px] inline-flex items-center gap-1 text-[11.5px] leading-[1.35] font-medium text-[var(--nx-text-muted)]">
                      <UserX className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>Sem contato cadastrado</span>
                    </div>
                  ) : null}
                </td>

                {/* 2. Valor do mês (15,5%, alinhado à direita + 24px de respiro antes de Status) */}
                <td className="py-[15px] pr-6 pl-1.5 text-right align-top">
                  <div className="text-[14px] leading-[22px] font-semibold tabular-nums text-[var(--nx-text)]">
                    {formatBRL(linha.total)}
                  </div>
                  {Number(linha.extra) > 0 ? (
                    <div
                      className="mt-[3px] truncate text-[12px] leading-[1.35] tabular-nums text-[var(--nx-text-muted)]"
                      title={
                        linha.motivo_extra
                          ? `+ ${formatBRL(linha.extra)} · ${linha.motivo_extra}`
                          : `+ ${formatBRL(linha.extra)}`
                      }
                    >
                      + {formatBRL(linha.extra)}
                      {linha.motivo_extra ? ` · ${linha.motivo_extra}` : ""}
                    </div>
                  ) : null}
                </td>

                {/* 3. Status (17%, alinhado pelo topo + pendências anteriores na sublinha) */}
                <td className="px-2.5 py-[15px] align-top">
                  <div className="flex min-h-[22px] items-center">
                    <StatusCobrancaBadge
                      situacao={linha.situacao}
                      vencimentoIso={linha.vencimento}
                      diasAtraso={linha.dias_atraso}
                    />
                  </div>
                  {linha.meses_em_aberto_anteriores > 0 ? (
                    <div className="mt-[3px] text-[12px] leading-[1.35] font-medium tabular-nums text-[var(--nx-status-overdue-fg)]">
                      + {linha.meses_em_aberto_anteriores}{" "}
                      {linha.meses_em_aberto_anteriores === 1 ? "mês anterior" : "meses anteriores"}{" "}
                      ({formatBRL(linha.total_em_aberto_anteriores)})
                    </div>
                  ) : null}
                </td>

                {/* 4. Próximo lembrete (19%, 12.5px em linha única sem palavras órfãs) */}
                <td className="px-2.5 py-[15px] align-top">
                  <span
                    className="block truncate whitespace-nowrap text-[12.5px] leading-[22px] text-[var(--nx-text-muted)]"
                    title={lembreteTexto}
                  >
                    {lembreteTexto}
                  </span>
                </td>

                {/* 5. Ações (22,5%, alinhada à direita: Cobrar ghost + Marcar pago/Desfazer + menu) */}
                <td className="py-[15px] pr-3.5 pl-2 text-right align-top">
                  <div className="-mt-[5px] inline-flex items-center justify-end gap-[5px]">
                    {pago ? (
                      <button
                        type="button"
                        disabled={ocupada}
                        onClick={() => onDesfazerPago(linha)}
                        className="inline-flex h-[32px] cursor-pointer items-center gap-1 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-2.5 text-[12.5px] font-semibold whitespace-nowrap text-[var(--nx-text-strong)] transition hover:border-[var(--nx-border-strong)] hover:bg-[var(--nx-surface-subtle)] disabled:opacity-50"
                      >
                        <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Desfazer</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => onCobrar(linha)}
                          className="inline-flex h-[32px] cursor-pointer items-center rounded-[6px] border border-transparent bg-transparent px-2.5 text-[12.5px] font-semibold whitespace-nowrap text-[var(--nx-text-body)] transition hover:bg-[var(--nx-surface-muted)] hover:text-[var(--nx-text)] disabled:opacity-50"
                        >
                          Cobrar
                        </button>
                        <button
                          type="button"
                          disabled={ocupada}
                          onClick={() => onMarcarPago(linha)}
                          className="inline-flex h-[32px] cursor-pointer items-center gap-1 rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-surface)] px-2.5 text-[12.5px] font-semibold whitespace-nowrap text-[var(--nx-text)] transition hover:border-[var(--nx-accent)] hover:bg-[var(--nx-accent-tint)] hover:text-[var(--nx-accent)] disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>Marcar pago</span>
                        </button>
                      </>
                    )}

                    <div className="relative">
                      <button
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={menuAberto}
                        aria-label={`Mais ações para ${linha.cliente_nome}`}
                        onClick={() =>
                          setMenuAbertoId((atual) =>
                            atual === linha.cobranca_id ? null : linha.cobranca_id,
                          )
                        }
                        className="inline-flex h-[32px] w-[32px] cursor-pointer items-center justify-center rounded-[6px] border border-transparent text-[var(--nx-text-body)] transition hover:bg-[var(--nx-surface-muted)] hover:text-[var(--nx-text)]"
                      >
                        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                      </button>

                      {menuAberto ? (
                        <div
                          role="menu"
                          className="absolute top-full right-0 z-20 mt-1 w-52 rounded-[12px] border border-[var(--nx-border)] bg-[var(--nx-surface-elevated)] p-1.5 text-left shadow-[var(--nx-shadow-popover)]"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuAbertoId(null);
                              onAjustarValor(linha);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
                          >
                            <SlidersHorizontal className="h-4 w-4 text-[var(--nx-text-muted)]" aria-hidden="true" />
                            <span>Ajustar valor do mês</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuAbertoId(null);
                              onVerEnvios(linha);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
                          >
                            <History className="h-4 w-4 text-[var(--nx-text-muted)]" aria-hidden="true" />
                            <span>Ver envios</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuAbertoId(null);
                              onEditarCliente(linha);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
                          >
                            <Pencil className="h-4 w-4 text-[var(--nx-text-muted)]" aria-hidden="true" />
                            <span>Editar cliente</span>
                          </button>

                          <div className="my-1 border-t border-[var(--nx-border-subtle)]" />

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuAbertoId(null);
                              onArquivarCliente(linha);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
                          >
                            <Archive className="h-4 w-4 text-[var(--nx-text-muted)]" aria-hidden="true" />
                            <span>Inativar cliente</span>
                          </button>

                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setMenuAbertoId(null);
                              onExcluirCliente(linha);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-[var(--nx-status-overdue-fg)] hover:bg-[var(--nx-status-overdue-bg)]"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span>Excluir cliente</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
