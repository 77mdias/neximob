"use client";

import { ClipboardList } from "lucide-react";
import type { ObrigacaoDoMesRow } from "@/lib/database.types";
import { formatarMesTitulo } from "@/lib/dates";
import { CardObrigacaoChecklist } from "./card-obrigacao-checklist";
import { ListaProximosPrazos } from "./lista-proximos-prazos";

interface AbaObrigacoesProps {
  mesIso: string;
  obrigacoes: ObrigacaoDoMesRow[];
  proximosPrazos: ObrigacaoDoMesRow[];
  qtdClientesAtivos: number;
  onAtualizarPainel: () => void;
}

export function AbaObrigacoes({
  mesIso,
  obrigacoes,
  proximosPrazos,
  qtdClientesAtivos,
  onAtualizarPainel,
}: AbaObrigacoesProps) {
  if (qtdClientesAtivos === 0) {
    return (
      <div className="rounded-[8px] border border-dashed border-[var(--nx-border-strong)] bg-[var(--nx-surface-subtle)] p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--nx-surface-brand)] text-[var(--nx-text)]">
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
        </div>
        <h2 className="mt-4 font-serif text-[20px] font-semibold text-[var(--nx-text)]">
          As guias aparecem com seus clientes
        </h2>
        <p className="mx-auto mt-2 max-w-[440px] text-[14px] text-[var(--nx-text-body)]">
          Cadastre clientes MEI, Simples ou Pessoa Física para acompanhar automaticamente DAS,
          PGDAS, DCTFWeb, DEFIS e Carnê-Leão.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[14px] font-semibold text-[var(--nx-text)]">
            Guias e declarações de {formatarMesTitulo(mesIso).toLowerCase()}
          </h2>
          <span className="text-[12px] text-[var(--nx-text-muted)]">
            Clique em uma guia para marcar cliente por cliente
          </span>
        </div>

        {obrigacoes.length === 0 ? (
          <div className="rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-6 text-center text-[14px] text-[var(--nx-text-body)]">
            Nenhuma guia ou declaração prevista para o perfil dos clientes ativos neste mês.
          </div>
        ) : (
          <div className="space-y-3">
            {obrigacoes.map((obrigacao) => (
              <CardObrigacaoChecklist
                key={`${obrigacao.obrigacao_id}-${obrigacao.periodo}`}
                obrigacao={obrigacao}
                mesIso={mesIso}
                onAtualizarPainel={onAtualizarPainel}
              />
            ))}
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-[84px] lg:self-start">
        <ListaProximosPrazos prazos={proximosPrazos} />
      </div>
    </div>
  );
}
