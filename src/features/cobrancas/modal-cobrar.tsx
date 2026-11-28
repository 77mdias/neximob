"use client";

import { Check, Copy, ExternalLink, Loader2, Mail, MessageSquare } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useToast } from "@/components/ui/toast-region";
import type { CobrancaDoMesRow } from "@/lib/database.types";
import { formatBRL } from "@/lib/format";
import {
  prepararCobrancaManualAction,
  registrarEnvioManualAction,
  type MensagemManualPreparada,
} from "@/server/actions/cobrancas";

interface ModalCobrarProps {
  cobranca: CobrancaDoMesRow | null;
  onClose: () => void;
  onEnvioRegistrado: () => void;
}

export function ModalCobrar({ cobranca, onClose, onEnvioRegistrado }: ModalCobrarProps) {
  return (
    <ResponsiveDialog
      open={Boolean(cobranca)}
      onClose={onClose}
      title={cobranca ? `Cobrar ${cobranca.cliente_nome}` : "Cobrar cliente"}
      subtitle={cobranca ? `Total deste mês: ${formatBRL(cobranca.total)}` : undefined}
      maxWidthClass="md:max-w-[540px]"
    >
      {cobranca ? (
        <ConteudoModalCobrar
          key={cobranca.cobranca_id}
          cobranca={cobranca}
          onClose={onClose}
          onEnvioRegistrado={onEnvioRegistrado}
        />
      ) : null}
    </ResponsiveDialog>
  );
}

function ConteudoModalCobrar({
  cobranca,
  onClose,
  onEnvioRegistrado,
}: {
  cobranca: CobrancaDoMesRow;
  onClose: () => void;
  onEnvioRegistrado: () => void;
}) {
  const { showToast } = useToast();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<MensagemManualPreparada | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelado = false;
    void prepararCobrancaManualAction({
      cobrancaId: cobranca.cobranca_id,
      clienteId: cobranca.cliente_id,
      clienteNome: cobranca.cliente_nome,
    }).then((res) => {
      if (cancelado) return;
      setCarregando(false);
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      setDados(res.data);
    });

    return () => {
      cancelado = true;
    };
  }, [cobranca.cobranca_id, cobranca.cliente_id, cobranca.cliente_nome]);

  async function copiarTexto() {
    if (!dados) return;
    try {
      await navigator.clipboard.writeText(dados.texto);
      setCopiado(true);
      showToast("Mensagem copiada para a área de transferência.");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      showToast("Selecione e copie o texto manualmente.", { kind: "error" });
    }
  }

  function marcarComoCobrado() {
    startTransition(async () => {
      const res = await registrarEnvioManualAction(cobranca.cobranca_id);
      if (!res.ok) {
        showToast(res.error, { kind: "error" });
        return;
      }
      showToast(`Cobrança manual registrada para ${cobranca.cliente_nome}.`);
      onEnvioRegistrado();
      onClose();
    });
  }

  const digitosTelefone = dados?.telefone ? dados.telefone.replace(/\D/g, "") : "";
  const urlWhatsApp =
    digitosTelefone && dados
      ? `https://wa.me/${digitosTelefone}?text=${encodeURIComponent(dados.texto)}`
      : null;
  const urlMailto =
    dados?.email && dados
      ? `mailto:${dados.email}?subject=${encodeURIComponent(dados.assunto)}&body=${encodeURIComponent(dados.texto)}`
      : null;

  return (
    <div className="space-y-4">
      {carregando ? (
        <div className="flex items-center gap-2 py-6 text-[14px] text-[var(--nx-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Montando mensagem com dados atualizados...</span>
        </div>
      ) : erro ? (
        <p className="rounded-[6px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] p-3 text-[13px] text-[var(--nx-status-overdue-fg)]">
          {erro}
        </p>
      ) : dados ? (
        <>
          {dados.cobrancasIncluidas.length > 1 ? (
            <p className="rounded-[6px] border border-[var(--nx-status-today-border)] bg-[var(--nx-status-today-bg)] px-3 py-2 text-[13px] text-[var(--nx-status-today-fg)]">
              Esta mensagem consolida {dados.cobrancasIncluidas.length} meses em aberto em um único
              envio.
            </p>
          ) : null}

          <div>
            <p className="text-[12px] font-medium text-[var(--nx-text-muted)]">Assunto sugerido</p>
            <p className="mt-0.5 text-[14px] font-medium text-[var(--nx-text-strong)]">
              {dados.assunto}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="mensagem-manual-texto"
                className="text-[12px] font-medium text-[var(--nx-text-muted)]"
              >
                Texto pronto para envio
              </label>
              <button
                type="button"
                onClick={() => void copiarTexto()}
                className="inline-flex cursor-pointer items-center gap-1 text-[12px] font-medium text-[var(--nx-accent)] hover:underline"
              >
                {copiado ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copiar texto</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              id="mensagem-manual-texto"
              readOnly
              rows={5}
              value={dados.texto}
              className="mt-1.5 w-full rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] px-3 py-2 text-[14px] leading-relaxed text-[var(--nx-text)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {urlWhatsApp ? (
              <a
                href={urlWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3 text-[13px] font-medium text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
              >
                <MessageSquare className="h-4 w-4 text-[var(--nx-accent)]" aria-hidden="true" />
                <span>Abrir WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5 text-[var(--nx-text-muted)]" aria-hidden="true" />
              </a>
            ) : null}

            {urlMailto ? (
              <a
                href={urlMailto}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3 text-[13px] font-medium text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
              >
                <Mail className="h-4 w-4 text-[var(--nx-accent)]" aria-hidden="true" />
                <span>Abrir aplicativo de e-mail</span>
              </a>
            ) : null}
          </div>

          <p className="text-[12px] text-[var(--nx-text-muted)]">
            Depois de enviar a mensagem pelo canal que preferir, clique em{" "}
            <strong>Registrar envio manual</strong> para guardar no histórico do cliente.
          </p>
        </>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--nx-border-subtle)] pt-4">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] cursor-pointer rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
        >
          Fechar
        </button>
        <button
          type="button"
          disabled={pending || !dados}
          onClick={marcarComoCobrado}
          className="min-h-[40px] cursor-pointer rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
        >
          {pending ? "Registrando..." : "Registrar envio manual"}
        </button>
      </div>
    </div>
  );
}
