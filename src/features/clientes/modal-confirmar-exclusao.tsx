"use client";

import { useRef } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";

interface ModalConfirmarExclusaoProps {
  open: boolean;
  titulo: string;
  descricao: string;
  confirmLabel: string;
  pendente?: boolean;
  onClose: () => void;
  onConfirmar: () => void;
}

export function ModalConfirmarExclusao({
  open,
  titulo,
  descricao,
  confirmLabel,
  pendente = false,
  onClose,
  onConfirmar,
}: ModalConfirmarExclusaoProps) {
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title={titulo}
      initialFocusRef={cancelRef}
      footer={
        <>
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            className="min-h-[40px] cursor-pointer rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={pendente}
            onClick={onConfirmar}
            className="min-h-[40px] cursor-pointer rounded-[6px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] px-4 text-[14px] font-medium text-[var(--nx-status-overdue-fg)] hover:opacity-90 disabled:opacity-50"
          >
            {pendente ? "Processando..." : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-[14px] leading-relaxed text-[var(--nx-text-body)]">{descricao}</p>
    </ResponsiveDialog>
  );
}
