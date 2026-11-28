"use client";

import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/toast-region";
import { salvarPerfilAction } from "@/server/actions/conta";

interface CardChavePixProps {
  nomeContador: string;
  chavePixInicial: string | null;
  onAtualizarChavePix: (novaChave: string | null) => void;
}

export function CardChavePix({
  nomeContador,
  chavePixInicial,
  onAtualizarChavePix,
}: CardChavePixProps) {
  const { showToast } = useToast();
  const [chavePix, setChavePix] = useState(chavePixInicial ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const alterado = chavePix.trim() !== (chavePixInicial ?? "").trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    startTransition(async () => {
      const res = await salvarPerfilAction({
        nome: nomeContador,
        chavePix,
      });

      if (!res.ok) {
        setErro(res.fieldErrors?.chavePix ?? res.error);
        return;
      }

      onAtualizarChavePix(res.data.chavePix);
      showToast("Chave Pix atualizada para os próximos lembretes.");
    });
  }

  return (
    <section
      aria-label="Chave Pix nas mensagens"
      className="rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-4 sm:p-5"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--nx-surface-brand)] text-[var(--nx-text)]">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-[var(--nx-text)]">
            Sua chave Pix para recebimentos
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--nx-text-body)]">
            Substitui automaticamente o campo <code className="rounded bg-[var(--nx-surface-muted)] px-1 py-0.5 text-[12px]">{"{pix}"}</code> nos e-mails e nas mensagens copiadas.
          </p>

          <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              value={chavePix}
              onChange={(e) => setChavePix(e.target.value)}
              placeholder="E-mail, celular, CNPJ ou chave aleatória do escritório"
              aria-label="Chave Pix do escritório"
              maxLength={140}
              className="min-h-[40px] flex-1 rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)] placeholder:text-[var(--nx-text-muted)]"
            />
            <button
              type="submit"
              disabled={pending || !alterado}
              className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] transition hover:bg-[var(--nx-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "Salvando..." : "Salvar chave Pix"}
            </button>
          </form>

          {erro ? (
            <p className="mt-2 text-[13px] text-[var(--nx-status-overdue-fg)]" role="alert">
              {erro}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
