"use client";

import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { iniciaisDoNome } from "@/lib/format";
import { sairAction } from "@/server/actions/auth";
import { SeletorTema } from "./seletor-tema";

interface MenuContaPopoverProps {
  nomeContador: string;
  emailUsuario: string;
  onAbrirMeusDados: () => void;
}

export function MenuContaPopover({
  nomeContador,
  emailUsuario,
  onAbrirMeusDados,
}: MenuContaPopoverProps) {
  const [aberto, setAberto] = useState(false);
  const [saindo, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!aberto) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [aberto]);

  function handleSair() {
    setAberto(false);
    startTransition(async () => {
      await sairAction();
    });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-2 text-[13px] font-medium text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
        aria-label={`Menu da conta de ${nomeContador}`}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--nx-surface-brand)] text-[11px] font-semibold text-[var(--nx-text)]">
          {iniciaisDoNome(nomeContador)}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--nx-text-muted)]" aria-hidden="true" />
      </button>

      {aberto ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-40 mt-2 w-64 rounded-[10px] border border-[var(--nx-border)] bg-[var(--nx-surface-elevated)] p-2 shadow-[var(--nx-shadow-popover)]"
        >
          <div className="border-b border-[var(--nx-border-subtle)] px-2.5 pb-2.5 pt-1">
            <p className="truncate text-[14px] font-semibold text-[var(--nx-text)]">
              {nomeContador}
            </p>
            <p className="truncate text-[12px] text-[var(--nx-text-muted)]">{emailUsuario}</p>
          </div>

          <div className="px-2 py-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--nx-text-muted)]">
              Tema
            </p>
            <SeletorTema />
          </div>

          <div className="border-t border-[var(--nx-border-subtle)] pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setAberto(false);
                onAbrirMeusDados();
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
            >
              <UserCog className="h-4 w-4 text-[var(--nx-text-muted)]" aria-hidden="true" />
              <span>Meus dados e LGPD</span>
            </button>

            <button
              type="button"
              role="menuitem"
              disabled={saindo}
              onClick={handleSair}
              className="flex w-full cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-2 text-left text-[13px] text-[var(--nx-status-overdue-fg)] hover:bg-[var(--nx-status-overdue-bg)] disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>{saindo ? "Saindo..." : "Sair"}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
