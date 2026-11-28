"use client";

import { MessageSquare } from "lucide-react";
import type { ReguaRow } from "@/lib/database.types";
import { MODELOS_WHATSAPP_FIXOS } from "@/lib/regua-vars";
import { CardChavePix } from "./card-chave-pix";
import { CardPassoRegua } from "./card-passo-regua";
import { CardTextoPendencia } from "./card-texto-pendencia";

interface AbaReguaProps {
  mesIso: string;
  nomeContador: string;
  chavePix: string | null;
  textoPendencia: string;
  passos: ReguaRow[];
  onAtualizarChavePix: (novaChave: string | null) => void;
  onPassoSalvo: (atualizado: ReguaRow) => void;
  onTextoPendenciaSalvo: (novoTexto: string) => void;
}

export function AbaRegua({
  mesIso,
  nomeContador,
  chavePix,
  textoPendencia,
  passos,
  onAtualizarChavePix,
  onPassoSalvo,
  onTextoPendenciaSalvo,
}: AbaReguaProps) {
  return (
    <div className="space-y-6">
      <CardChavePix
        nomeContador={nomeContador}
        chavePixInicial={chavePix}
        onAtualizarChavePix={onAtualizarChavePix}
      />

      <section aria-label="Passos da régua de e-mail" className="space-y-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--nx-text)]">
            Lembretes automáticos por e-mail
          </h2>
          <p className="text-[13px] text-[var(--nx-text-body)]">
            Disparos automáticos sempre às 9h (horário de Brasília) conforme o vencimento de cada
            cliente.
          </p>
        </div>

        <div className="space-y-3">
          {passos.map((passo) => (
            <CardPassoRegua
              key={passo.id}
              passo={passo}
              mesIso={mesIso}
              chavePix={chavePix}
              onPassoSalvo={onPassoSalvo}
            />
          ))}
        </div>

        <CardTextoPendencia
          textoInicial={textoPendencia}
          mesIso={mesIso}
          chavePix={chavePix}
          onTextoSalvo={onTextoPendenciaSalvo}
        />
      </section>

      <section
        aria-label="Modelos fixos do WhatsApp"
        className="rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-4 sm:p-5"
      >
        <div className="flex items-start gap-2.5">
          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[var(--nx-accent)]" aria-hidden="true" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[15px] font-semibold text-[var(--nx-text)]">
                Prévia do WhatsApp
              </h2>
              <span className="rounded-full border border-[var(--nx-border)] bg-[var(--nx-surface-muted)] px-2 py-0.5 text-[11px] font-semibold text-[var(--nx-text-strong)]">
                Modelo fixo
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-[var(--nx-text-body)]">
              Para manter a aprovação oficial no WhatsApp Business, estes modelos padronizados de
              utilidade não podem ser editados.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {MODELOS_WHATSAPP_FIXOS.map((modelo) => (
            <div
              key={modelo.id}
              className="rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] p-3"
            >
              <p className="text-[13px] font-semibold text-[var(--nx-text)]">{modelo.titulo}</p>
              <p className="text-[11px] text-[var(--nx-text-muted)]">{modelo.quando}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--nx-text-body)]">
                {modelo.texto}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
