"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";

interface ToastItem {
  id: number;
  message: string;
  kind: "info" | "error";
  undoLabel?: string;
  onUndo?: () => void;
}

interface ToastContextValue {
  showToast: (
    message: string,
    options?: { kind?: "info" | "error"; undoLabel?: string; onUndo?: () => void; durationMs?: number },
  ) => void;
  dismissToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);

  const dismissToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast(null);
  }, []);

  const showToast = useCallback(
    (
      message: string,
      options?: { kind?: "info" | "error"; undoLabel?: string; onUndo?: () => void; durationMs?: number },
    ) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const nextId = ++idRef.current;
      const kind = options?.kind ?? "info";
      setToast({
        id: nextId,
        message,
        kind,
        undoLabel: options?.undoLabel,
        onUndo: options?.onUndo,
      });

      const timeout = options?.durationMs ?? (kind === "error" ? 7000 : 6000);
      timerRef.current = setTimeout(() => {
        setToast((curr) => (curr?.id === nextId ? null : curr));
      }, timeout);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {/* Região educada para confirmações e Desfazer (DV-10) */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed bottom-[76px] left-1/2 z-[70] -translate-x-1/2 md:right-6 md:bottom-6 md:left-auto md:translate-x-0"
      >
        {toast && toast.kind === "info" ? (
          <div className="pointer-events-auto inline-flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-md bg-text px-3.5 py-2.5 text-[13px] font-medium text-bg shadow-popover">
            <span>{toast.message}</span>
            {toast.onUndo ? (
              <button
                type="button"
                onClick={() => {
                  const fn = toast.onUndo;
                  dismissToast();
                  fn?.();
                }}
                className="cursor-pointer rounded-xs border-0 bg-transparent px-1 py-0.5 text-[13px] font-semibold text-inherit underline underline-offset-2"
              >
                {toast.undoLabel ?? "Desfazer"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Região urgente para erros de rede ou validação de ação (DV-10) */}
      <div
        role="alert"
        className="pointer-events-none fixed bottom-[76px] left-1/2 z-[71] -translate-x-1/2 md:right-6 md:bottom-6 md:left-auto md:translate-x-0"
      >
        {toast && toast.kind === "error" ? (
          <div className="pointer-events-auto inline-flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-md border border-status-overdue-border bg-status-overdue-bg px-3.5 py-2.5 text-[13px] font-medium text-status-overdue-fg shadow-popover">
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={dismissToast}
              aria-label="Fechar aviso"
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent text-current hover:opacity-80"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}
