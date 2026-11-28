"use client";

import { Loader2, Mail, MessageSquare, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import type { CobrancaDoMesRow, EnvioRow } from "@/lib/database.types";
import { formatarDataHora, formatarMesCurto } from "@/lib/dates";
import { buscarEnviosClienteAction } from "@/server/actions/cobrancas";

interface ModalEnviosClienteProps {
  cobranca: CobrancaDoMesRow | null;
  onClose: () => void;
}

function rotuloStatusEnvio(status: EnvioRow["status"]): string {
  switch (status) {
    case "enviado":
      return "Enviado";
    case "entregue":
      return "Entregue";
    case "lido":
      return "Lido";
    case "pendente":
    case "enviando":
      return "Na fila";
    case "falhou":
      return "Não entregue";
    case "pulado":
      return "Pulado";
    case "cancelado":
      return "Cancelado";
  }
}

export function ModalEnviosCliente({ cobranca, onClose }: ModalEnviosClienteProps) {
  return (
    <ResponsiveDialog
      open={Boolean(cobranca)}
      onClose={onClose}
      title="Histórico de envios"
      subtitle={cobranca ? cobranca.cliente_nome : undefined}
      maxWidthClass="md:max-w-[540px]"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] cursor-pointer rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
        >
          Fechar
        </button>
      }
    >
      {cobranca ? (
        <ConteudoEnviosCliente key={cobranca.cliente_id} clienteId={cobranca.cliente_id} />
      ) : null}
    </ResponsiveDialog>
  );
}

function ConteudoEnviosCliente({ clienteId }: { clienteId: string }) {
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [envios, setEnvios] = useState<EnvioRow[]>([]);

  useEffect(() => {
    let cancelado = false;
    void buscarEnviosClienteAction(clienteId).then((res) => {
      if (cancelado) return;
      setCarregando(false);
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      setEnvios(res.data);
    });

    return () => {
      cancelado = true;
    };
  }, [clienteId]);

  if (carregando) {
    return (
      <div className="flex items-center gap-2 py-6 text-[14px] text-[var(--nx-text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Carregando envios recentes...</span>
      </div>
    );
  }

  if (erro) {
    return <p className="text-[13px] text-[var(--nx-status-overdue-fg)]">{erro}</p>;
  }

  if (envios.length === 0) {
    return (
      <p className="py-4 text-[14px] text-[var(--nx-text-body)]">
        Nenhum lembrete foi enviado ainda para este cliente.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--nx-border-subtle)]">
      {envios.map((envio) => (
        <li key={envio.id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
          <div className="flex items-start gap-2.5">
            {envio.canal === "email" ? (
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-text-muted)]" aria-hidden="true" />
            ) : envio.canal === "whatsapp" ? (
              <MessageSquare
                className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]"
                aria-hidden="true"
              />
            ) : (
              <Send className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-text-muted)]" aria-hidden="true" />
            )}
            <div>
              <p className="font-medium text-[var(--nx-text-strong)]">
                {envio.canal === "email"
                  ? "E-mail automático"
                  : envio.canal === "whatsapp"
                    ? "WhatsApp"
                    : "Envio manual"}{" "}
                · {formatarMesCurto(envio.mes)}
              </p>
              <p className="text-[12px] text-[var(--nx-text-muted)]">
                {formatarDataHora(envio.enviado_em ?? envio.criado_em)}
                {envio.tipo === "pendencia" ? " · Pendência consolidada" : ""}
              </p>
              {envio.erro ? (
                <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
                  {envio.erro}
                </p>
              ) : null}
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-[var(--nx-surface-muted)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--nx-text-strong)]">
            {rotuloStatusEnvio(envio.status)}
          </span>
        </li>
      ))}
    </ul>
  );
}
