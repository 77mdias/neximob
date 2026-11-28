"use client";

import { AlertTriangle, Eye, RotateCcw } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast-region";
import type { ReguaRow } from "@/lib/database.types";
import {
  VARIAVEIS_REGUA,
  descricaoDisparoPasso,
  detectarCamposDesconhecidos,
  formatarAvisoCamposDesconhecidos,
  interpolarPreviaRegua,
} from "@/lib/regua-vars";
import { restaurarPassoReguaAction, salvarPassoReguaAction } from "@/server/actions/regua";

interface CardPassoReguaProps {
  passo: ReguaRow;
  mesIso: string;
  chavePix: string | null;
  onPassoSalvo: (atualizado: ReguaRow) => void;
}

export function CardPassoRegua({
  passo,
  mesIso,
  chavePix,
  onPassoSalvo,
}: CardPassoReguaProps) {
  const { showToast } = useToast();
  const [ativo, setAtivo] = useState(passo.ativo);
  const [texto, setTexto] = useState(passo.texto);
  const [textoSalvo, setTextoSalvo] = useState(passo.texto);
  const [mostrarPrevia, setMostrarPrevia] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const desconhecidos = detectarCamposDesconhecidos(texto);
  const avisoDesconhecidos = formatarAvisoCamposDesconhecidos(desconhecidos);
  const textoAlterado = texto.trim() !== textoSalvo.trim();

  function inserirVariavel(token: string) {
    const el = textareaRef.current;
    if (!el) {
      setTexto((prev) => `${prev}${prev.endsWith(" ") || prev === "" ? "" : " "}${token}`);
      return;
    }
    const start = el.selectionStart ?? texto.length;
    const end = el.selectionEnd ?? texto.length;
    const next = `${texto.slice(0, start)}${token}${texto.slice(end)}`;
    setTexto(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function salvar(novoAtivo: boolean, novoTexto: string) {
    setErro(null);
    startTransition(async () => {
      const res = await salvarPassoReguaAction({
        id: passo.id,
        ativo: novoAtivo,
        texto: novoTexto,
      });

      if (!res.ok) {
        setErro(res.fieldErrors?.texto ?? res.error);
        return;
      }

      setAtivo(res.data.passo.ativo);
      setTexto(res.data.passo.texto);
      setTextoSalvo(res.data.passo.texto);
      onPassoSalvo(res.data.passo);

      if (res.data.camposDesconhecidos.length > 0) {
        showToast(
          `Passo salvo. ${formatarAvisoCamposDesconhecidos(res.data.camposDesconhecidos) ?? ""}`,
          { kind: "error" },
        );
      } else {
        showToast(`Passo "${passo.nome}" salvo.`);
      }
    });
  }

  function handleRestaurar() {
    setErro(null);
    startTransition(async () => {
      const res = await restaurarPassoReguaAction(passo.id);
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      setTexto(res.data.texto);
      setTextoSalvo(res.data.texto);
      onPassoSalvo({ ...passo, ativo, texto: res.data.texto });
      showToast(`Texto padrão de "${passo.nome}" restaurado.`);
    });
  }

  return (
    <article className="rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-bg)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--nx-text)]">{passo.nome}</h3>
          <p className="mt-0.5 text-[13px] text-[var(--nx-text-muted)]">
            {descricaoDisparoPasso(passo.dias)}
          </p>
        </div>

        <Switch
          checked={ativo}
          disabled={pending}
          onChange={(proximo: boolean) => {
            setAtivo(proximo);
            salvar(proximo, texto);
          }}
          label={ativo ? "Ativo" : "Pausado"}
        />
      </div>

      <div className="mt-3">
        <label htmlFor={`regua-texto-${passo.id}`} className="sr-only">
          Texto do lembrete para {passo.nome}
        </label>
        <textarea
          ref={textareaRef}
          id={`regua-texto-${passo.id}`}
          rows={3}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          maxLength={2000}
          className="w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 py-2 text-[14px] leading-relaxed text-[var(--nx-text)]"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[12px] text-[var(--nx-text-muted)]">Inserir campo:</span>
        {VARIAVEIS_REGUA.map((token) => (
          <button
            key={token}
            type="button"
            onClick={() => inserirVariavel(token)}
            className="cursor-pointer rounded-[4px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] px-2 py-0.5 font-mono text-[12px] text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-muted)]"
          >
            {token}
          </button>
        ))}
      </div>

      {avisoDesconhecidos ? (
        <div
          role="status"
          className="mt-2.5 flex items-start gap-2 rounded-[6px] border border-[var(--nx-status-today-border)] bg-[var(--nx-status-today-bg)] px-3 py-2 text-[13px] text-[var(--nx-status-today-fg)]"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{avisoDesconhecidos}</span>
        </div>
      ) : null}

      {erro ? (
        <p className="mt-2 text-[13px] text-[var(--nx-status-overdue-fg)]" role="alert">
          {erro}
        </p>
      ) : null}

      {mostrarPrevia ? (
        <div className="mt-3 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--nx-text-muted)]">
            Exemplo com cliente fictício
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--nx-text-strong)]">
            {interpolarPreviaRegua(texto, { mesIso, chavePix, tipo: "passo" })}
          </p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMostrarPrevia((v) => !v)}
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3 text-[13px] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
          >
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{mostrarPrevia ? "Ocultar prévia" : "Ver prévia"}</span>
          </button>

          <button
            type="button"
            disabled={pending}
            onClick={handleRestaurar}
            className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-[6px] border border-transparent px-2.5 text-[13px] font-medium text-[var(--nx-text-muted)] hover:bg-[var(--nx-surface-subtle)] hover:text-[var(--nx-text)] disabled:opacity-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Restaurar padrão</span>
          </button>
        </div>

        <button
          type="button"
          disabled={pending || !textoAlterado}
          onClick={() => salvar(ativo, texto)}
          className="inline-flex min-h-[36px] cursor-pointer items-center justify-center rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[13px] font-medium text-[var(--nx-accent-fg)] transition hover:bg-[var(--nx-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar texto"}
        </button>
      </div>
    </article>
  );
}
