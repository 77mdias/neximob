import type { CobrancaDoMesRow } from "./database.types";

export type FiltroCobranca = "todos" | "em_atraso" | "vence_hoje" | "a_vencer" | "pagos";

export const FILTROS_COBRANCA: ReadonlyArray<{ key: FiltroCobranca; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "em_atraso", label: "Em atraso" },
  { key: "vence_hoje", label: "Vence hoje" },
  { key: "a_vencer", label: "A vencer" },
  { key: "pagos", label: "Pagos" },
];

export function normalizarFiltroCobranca(raw?: string | null): FiltroCobranca {
  switch (raw) {
    case "em_atraso":
    case "vence_hoje":
    case "a_vencer":
    case "pagos":
      return raw;
    default:
      return "todos";
  }
}

export function correspondeFiltroCobranca(row: CobrancaDoMesRow, filtro: FiltroCobranca): boolean {
  switch (filtro) {
    case "todos":
      return true;
    case "em_atraso":
      // RN-18: cliente com mês anterior em aberto entra em Em atraso mesmo com o mês corrente pago.
      return row.situacao === "atrasado" || row.meses_em_aberto_anteriores > 0;
    case "vence_hoje":
      return row.situacao === "vence_hoje";
    case "a_vencer":
      return row.situacao === "a_vencer";
    case "pagos":
      return row.situacao === "pago";
  }
}

export function contarFiltrosCobrancas(
  rows: readonly CobrancaDoMesRow[],
): Record<FiltroCobranca, number> {
  const counts: Record<FiltroCobranca, number> = {
    todos: rows.length,
    em_atraso: 0,
    vence_hoje: 0,
    a_vencer: 0,
    pagos: 0,
  };

  for (const row of rows) {
    if (row.situacao === "atrasado" || row.meses_em_aberto_anteriores > 0) {
      counts.em_atraso += 1;
    }
    if (row.situacao === "vence_hoje") counts.vence_hoje += 1;
    if (row.situacao === "a_vencer") counts.a_vencer += 1;
    if (row.situacao === "pago") counts.pagos += 1;
  }

  return counts;
}

export function filtrarCobrancas(
  rows: readonly CobrancaDoMesRow[],
  filtro: FiltroCobranca,
  busca: string = "",
): CobrancaDoMesRow[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  return rows.filter((row) => {
    if (!correspondeFiltroCobranca(row, filtro)) return false;
    if (!termo) return true;
    return row.cliente_nome.toLocaleLowerCase("pt-BR").includes(termo);
  });
}
