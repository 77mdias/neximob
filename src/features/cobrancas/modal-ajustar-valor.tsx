"use client";

import { useState, useTransition } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useToast } from "@/components/ui/toast-region";
import type { CobrancaDoMesRow } from "@/lib/database.types";
import { formatBRL, formatBRLInput } from "@/lib/format";
import { ajustarValorMesAction } from "@/server/actions/cobrancas";

interface ModalAjustarValorProps {
  cobranca: CobrancaDoMesRow | null;
  onClose: () => void;
  onAjustado: () => void;
}

export function ModalAjustarValor({
  cobranca,
  onClose,
  onAjustado,
}: ModalAjustarValorProps) {
  return (
    <ResponsiveDialog
      open={Boolean(cobranca)}
      onClose={onClose}
      title="Ajustar valor deste mês"
      subtitle={
        cobranca
          ? `${cobranca.cliente_nome} · Honorário fixo ${formatBRL(cobranca.valor)}`
          : undefined
      }
      footer={
        cobranca ? (
          <FooterAjustarValor onClose={onClose} />
        ) : null
      }
    >
      {cobranca ? (
        <ConteudoAjustarValor
          key={cobranca.cobranca_id}
          cobranca={cobranca}
          onClose={onClose}
          onAjustado={onAjustado}
        />
      ) : null}
    </ResponsiveDialog>
  );
}

function FooterAjustarValor({ onClose }: { onClose: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onClose}
        className="min-h-[40px] cursor-pointer rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="form-ajustar-valor"
        className="min-h-[40px] cursor-pointer rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)]"
      >
        Salvar ajuste
      </button>
    </>
  );
}

function ConteudoAjustarValor({
  cobranca,
  onClose,
  onAjustado,
}: {
  cobranca: CobrancaDoMesRow;
  onClose: () => void;
  onAjustado: () => void;
}) {
  const { showToast } = useToast();
  const [extraRaw, setExtraRaw] = useState(
    Number(cobranca.extra) > 0 ? formatBRLInput(Number(cobranca.extra)) : "",
  );
  const [motivo, setMotivo] = useState(cobranca.motivo_extra ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setErro(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await ajustarValorMesAction({
        cobrancaId: cobranca.cobranca_id,
        extraRaw: extraRaw.trim() || "0",
        motivo,
      });

      if (!res.ok) {
        setErro(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }

      showToast(
        `Valor do mês atualizado para ${formatBRL(res.data.total)} em ${cobranca.cliente_nome}.`,
      );
      onAjustado();
      onClose();
    });
  }

  return (
    <form id="form-ajustar-valor" onSubmit={handleSubmit} className="space-y-4">
      <p className="text-[13px] text-[var(--nx-text-body)]">
        Este extra vale apenas para este mês e não altera o honorário fixo dos próximos meses.
        Deixe em branco ou 0,00 para remover o extra.
      </p>

      <div>
        <label
          htmlFor="ajuste-extra"
          className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
        >
          Serviço extra (R$)
        </label>
        <input
          id="ajuste-extra"
          type="text"
          inputMode="decimal"
          value={extraRaw}
          onChange={(e) => setExtraRaw(e.target.value)}
          placeholder="0,00"
          className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] tabular-nums text-[var(--nx-text)]"
        />
        {fieldErrors.extraRaw ? (
          <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
            {fieldErrors.extraRaw}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="ajuste-motivo"
          className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
        >
          Motivo do extra
        </label>
        <input
          id="ajuste-motivo"
          type="text"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
          maxLength={300}
          placeholder="Ex.: Declaração retificadora ou alteração contratual"
          className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
        />
        {fieldErrors.motivo ? (
          <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
            {fieldErrors.motivo}
          </p>
        ) : null}
      </div>

      {erro && Object.keys(fieldErrors).length === 0 ? (
        <p className="text-[13px] text-[var(--nx-status-overdue-fg)]" role="alert">
          {erro}
        </p>
      ) : null}
    </form>
  );
}
