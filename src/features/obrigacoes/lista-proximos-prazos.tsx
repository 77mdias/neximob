import { CalendarClock } from "lucide-react";
import type { ObrigacaoDoMesRow } from "@/lib/database.types";
import { formatarDiaMes } from "@/lib/dates";
import { formatRotuloPrazoObrigacao } from "@/lib/format";

interface ListaProximosPrazosProps {
  prazos: ObrigacaoDoMesRow[];
}

export function ListaProximosPrazos({ prazos }: ListaProximosPrazosProps) {
  return (
    <aside
      aria-label="Próximos prazos dos próximos meses"
      className="rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-4"
    >
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-[var(--nx-accent)]" aria-hidden="true" />
        <h3 className="text-[14px] font-semibold text-[var(--nx-text)]">Próximos prazos</h3>
      </div>

      {prazos.length === 0 ? (
        <p className="mt-3 text-[13px] text-[var(--nx-text-muted)]">
          Nenhum prazo futuro previsto para o perfil dos seus clientes ativos.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-[var(--nx-border-subtle)]">
          {prazos.slice(0, 8).map((item) => {
            const faltam = Math.max(0, item.total_clientes - item.feitos);
            return (
              <li
                key={`${item.obrigacao_id}-${item.periodo}`}
                className="flex items-start justify-between gap-3 py-2.5 text-[13px]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--nx-text-strong)]">{item.nome}</p>
                  <p className="text-[12px] text-[var(--nx-text-muted)]">
                    Vence em {formatarDiaMes(item.prazo)} ·{" "}
                    {formatRotuloPrazoObrigacao(item.situacao_prazo, item.dias_para_o_prazo)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--nx-bg)] px-2 py-0.5 text-[11px] font-medium tabular-nums text-[var(--nx-text-body)]">
                  {faltam === 0 ? "Concluída" : `${faltam} pendente${faltam === 1 ? "" : "s"}`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
