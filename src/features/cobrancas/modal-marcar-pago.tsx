"use client";

import { useRef, useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { CobrancaDoMesRow, FormaPagamento } from "@/lib/database.types";
import { formatBRL } from "@/lib/format";

const FORMAS: ReadonlyArray<{ id: FormaPagamento; label: string }> = [
  { id: "pix", label: "Pix" },
  { id: "transferencia", label: "Transferência" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "outro", label: "Outro" },
];

interface ModalMarcarPagoProps {
  cobranca: CobrancaDoMesRow | null;
  hojeIso: string;
  pendente: boolean;
  onClose: () => void;
  onConfirmar: (cobranca: CobrancaDoMesRow, forma: FormaPagamento, data: string) => void;
}

export function ModalMarcarPago({
  cobranca,
  hojeIso,
  pendente,
  onClose,
  onConfirmar,
}: ModalMarcarPagoProps) {
  if (!cobranca) {
    return (
      <ResponsiveDialog open={false} onClose={onClose} title="Registrar pagamento">
        {null}
      </ResponsiveDialog>
    );
  }

  return (
    <ConteudoModalMarcarPago
      key={cobranca.cobranca_id}
      cobranca={cobranca}
      hojeIso={hojeIso}
      pendente={pendente}
      onClose={onClose}
      onConfirmar={onConfirmar}
    />
  );
}

function ConteudoModalMarcarPago({
  cobranca,
  hojeIso,
  pendente,
  onClose,
  onConfirmar,
}: {
  cobranca: CobrancaDoMesRow;
  hojeIso: string;
  pendente: boolean;
  onClose: () => void;
  onConfirmar: (cobranca: CobrancaDoMesRow, forma: FormaPagamento, data: string) => void;
}) {
  const [forma, setForma] = useState<FormaPagamento>("pix");
  const [data, setData] = useState(hojeIso);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  return (
    <ResponsiveDialog
      open={true}
      onClose={onClose}
      title="Registrar pagamento"
      subtitle={`${cobranca.cliente_nome} · ${formatBRL(cobranca.total)}`}
      initialFocusRef={confirmRef}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] cursor-pointer rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
          >
            Cancelar
          </button>
          <button
            ref={confirmRef}
            type="button"
            disabled={pendente}
            onClick={() => onConfirmar(cobranca, forma, data)}
            className="min-h-[40px] cursor-pointer rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
          >
            {pendente ? "Registrando..." : "Confirmar recebimento"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <fieldset>
          <legend className="text-[13px] font-medium text-[var(--nx-text-strong)]">
            Forma de pagamento
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {FORMAS.map((item) => {
              const ativo = forma === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setForma(item.id)}
                  className={`min-h-[40px] cursor-pointer rounded-[6px] border px-3 text-[14px] transition ${
                    ativo
                      ? "border-[var(--nx-accent)] bg-[var(--nx-accent-tint)] font-semibold text-[var(--nx-accent)]"
                      : "border-[var(--nx-border)] bg-[var(--nx-bg)] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="pagamento-data"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Data do recebimento
          </label>
          <input
            id="pagamento-data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value || hojeIso)}
            className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
        </div>
      </div>
    </ResponsiveDialog>
  );
}
