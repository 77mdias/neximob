"use client";

import { CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast-region";
import type { ClienteDaObrigacaoRow, ObrigacaoDoMesRow } from "@/lib/database.types";
import { formatarDiaMes } from "@/lib/dates";
import { formatRotuloPrazoObrigacao, formatTipoCliente } from "@/lib/format";
import {
  alternarObrigacaoClienteAction,
  carregarClientesObrigacaoAction,
} from "@/server/actions/obrigacoes";

interface CardObrigacaoChecklistProps {
  obrigacao: ObrigacaoDoMesRow;
  mesIso: string;
  onAtualizarPainel: () => void;
}

export function CardObrigacaoChecklist({
  obrigacao,
  mesIso,
  onAtualizarPainel,
}: CardObrigacaoChecklistProps) {
  const { showToast } = useToast();
  const [aberto, setAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [clientes, setClientes] = useState<ClienteDaObrigacaoRow[] | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const total = obrigacao.total_clientes;
  const feitoCountLocal =
    clientes !== null ? clientes.filter((c) => c.feito).length : obrigacao.feitos;
  const percentual = total > 0 ? Math.min(100, Math.round((feitoCountLocal / total) * 100)) : 0;
  const concluida = total > 0 && feitoCountLocal >= total;

  async function alternarAbertura() {
    const proximoAberto = !aberto;
    setAberto(proximoAberto);

    if (proximoAberto && clientes === null && !carregando) {
      setCarregando(true);
      setErroCarga(null);
      const res = await carregarClientesObrigacaoAction(obrigacao.obrigacao_id, mesIso);
      setCarregando(false);
      if (!res.ok) {
        setErroCarga(res.error);
        return;
      }
      setClientes(res.data);
    }
  }

  function handleMarcarCliente(cliente: ClienteDaObrigacaoRow) {
    const proximoFeito = !cliente.feito;
    const listaAnterior = clientes;

    setClientes((prev) =>
      prev
        ? prev.map((c) =>
            c.cliente_id === cliente.cliente_id ? { ...c, feito: proximoFeito } : c,
          )
        : prev,
    );

    startTransition(async () => {
      const res = await alternarObrigacaoClienteAction({
        obrigacaoId: obrigacao.obrigacao_id,
        clienteId: cliente.cliente_id,
        mesIso,
        feito: proximoFeito,
      });

      if (!res.ok) {
        setClientes(listaAnterior);
        showToast(res.error, { kind: "error" });
        return;
      }

      onAtualizarPainel();
    });
  }

  const situacaoEfetiva = concluida ? "concluida" : obrigacao.situacao_prazo;
  const badgeTexto = formatRotuloPrazoObrigacao(situacaoEfetiva, obrigacao.dias_para_o_prazo);
  const badgeEstilo =
    situacaoEfetiva === "concluida"
      ? "border-[var(--nx-status-paid-border)] bg-[var(--nx-status-paid-bg)] text-[var(--nx-status-paid-fg)]"
      : situacaoEfetiva === "vencida"
        ? "border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] text-[var(--nx-status-overdue-fg)]"
        : situacaoEfetiva === "vence_hoje"
          ? "border-[var(--nx-status-today-border)] bg-[var(--nx-status-today-bg)] text-[var(--nx-status-today-fg)]"
          : "border-[var(--nx-status-upcoming-border)] bg-[var(--nx-status-upcoming-bg)] text-[var(--nx-status-upcoming-fg)]";

  return (
    <article className="rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-bg)]">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => void alternarAbertura()}
        className="flex w-full cursor-pointer flex-col gap-3 p-4 text-left transition hover:bg-[var(--nx-surface-subtle)] sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[var(--nx-text)]">{obrigacao.nome}</h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[12px] font-medium ${badgeEstilo}`}
            >
              {situacaoEfetiva === "concluida" ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              ) : null}
              <span>{badgeTexto}</span>
            </span>
          </div>
          <p className="mt-1 text-[12.5px] text-[var(--nx-text-muted)]">
            vence {formatarDiaMes(obrigacao.prazo)} · competência {obrigacao.competencia}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <div className="w-40">
            <div className="flex items-center justify-between text-[12px] tabular-nums text-[var(--nx-text-body)]">
              <span>Progresso</span>
              <span className="font-medium text-[var(--nx-text)]">
                {feitoCountLocal} de {total} feitos
              </span>
            </div>
            <div className="mt-1.5 h-[4px] w-full overflow-hidden rounded-[4px] bg-[var(--nx-border)]">
              <div
                className="h-full rounded-[4px] bg-[var(--nx-accent)] transition-[width] duration-[220ms]"
                style={{ width: `${percentual}%` }}
              />
            </div>
          </div>

          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-[var(--nx-border)] text-[var(--nx-text-body)]">
            {aberto ? (
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            )}
          </span>
        </div>
      </button>

      {aberto ? (
        <div className="border-t border-[var(--nx-border-subtle)] px-4 py-3">
          {carregando ? (
            <div className="flex items-center gap-2 py-3 text-[13px] text-[var(--nx-text-muted)]">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Carregando clientes desta obrigação...</span>
            </div>
          ) : erroCarga ? (
            <p className="py-2 text-[13px] text-[var(--nx-status-overdue-fg)]">{erroCarga}</p>
          ) : !clientes || clientes.length === 0 ? (
            <p className="py-2 text-[13px] text-[var(--nx-text-muted)]">
              Nenhum cliente ativo se enquadra nesta obrigação neste mês.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--nx-border-subtle)]">
              {clientes.map((cli) => (
                <li key={cli.cliente_id} className="py-1">
                  <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-[6px] px-2 hover:bg-[var(--nx-surface-subtle)]">
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={cli.feito}
                        onChange={() => handleMarcarCliente(cli)}
                        className="h-4 w-4 rounded border-[var(--nx-border-strong)] accent-[var(--nx-accent)]"
                      />
                      <span
                        className={`text-[14px] ${
                          cli.feito
                            ? "text-[var(--nx-text-muted)] line-through"
                            : "font-medium text-[var(--nx-text)]"
                        }`}
                      >
                        {cli.nome}
                      </span>
                    </span>
                    <span className="text-[12px] text-[var(--nx-text-muted)]">
                      {formatTipoCliente(cli.tipo)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </article>
  );
}
