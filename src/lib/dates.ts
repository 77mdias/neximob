export const BRASILIA_TZ = "America/Sao_Paulo";

const MESES_EXTENSO = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const MESES_CURTOS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Retorna a data corrente no fuso America/Sao_Paulo no formato AAAA-MM-DD.
 */
export function hojeEmBrasilia(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRASILIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function mesAtualBrasilia(now: Date = new Date()): string {
  return `${hojeEmBrasilia(now).slice(0, 7)}-01`;
}

export function normalizarMesReferencia(param?: string | null, now: Date = new Date()): string {
  if (!param) return mesAtualBrasilia(now);
  const match = /^(\d{4})-(0[1-9]|1[0-2])(?:-\d{2})?$/.exec(param.trim());
  if (!match) return mesAtualBrasilia(now);
  return `${match[1]}-${match[2]}-01`;
}

export function mesParametro(mesIso: string): string {
  return mesIso.slice(0, 7);
}

export function parseAnoMes(mesIso: string): { ano: number; mes: number } {
  const match = /^(\d{4})-(\d{2})/.exec(mesIso);
  if (!match) {
    throw new Error(`Data de mês inválida: ${mesIso}`);
  }
  return { ano: Number(match[1]), mes: Number(match[2]) };
}

export function adicionarMeses(mesIso: string, delta: number): string {
  const { ano, mes } = parseAnoMes(mesIso);
  const totalMeses = ano * 12 + (mes - 1) + delta;
  const novoAno = Math.floor(totalMeses / 12);
  const novoMes = (totalMeses % 12) + 1;
  return `${novoAno}-${pad2(novoMes)}-01`;
}

export function formatarMesTitulo(mesIso: string): string {
  const { ano, mes } = parseAnoMes(mesIso);
  const nome = MESES_EXTENSO[mes - 1] ?? "";
  return `${nome} de ${ano}`;
}

export function nomeMesMinusculo(mesIso: string): string {
  const { mes } = parseAnoMes(mesIso);
  return (MESES_EXTENSO[mes - 1] ?? "").toLowerCase();
}

export function formatarMesCurto(mesIso: string): string {
  const { ano, mes } = parseAnoMes(mesIso);
  const curto = MESES_CURTOS[mes - 1] ?? "";
  return `${curto} ${ano}`;
}

export function formatarDiaMes(dataIso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataIso);
  if (!match) return dataIso;
  return `${match[3]}/${match[2]}`;
}

export function formatarDataCompleta(dataIso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dataIso);
  if (!match) return dataIso;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatarDataHora(isoTimestamp: string): string {
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return isoTimestamp;
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRASILIA_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.day}/${map.month}/${map.year} às ${map.hour}:${map.minute}`;
}

export function diaDoMesIso(dataIso: string): number {
  const match = /^\d{4}-\d{2}-(\d{2})/.exec(dataIso);
  return match ? Number(match[1]) : 1;
}

export function compararDias(aIso: string, bIso: string): number {
  const aMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(aIso);
  const bMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(bIso);
  if (!aMatch || !bMatch) return 0;
  const aUtc = Date.UTC(Number(aMatch[1]), Number(aMatch[2]) - 1, Number(aMatch[3]));
  const bUtc = Date.UTC(Number(bMatch[1]), Number(bMatch[2]) - 1, Number(bMatch[3]));
  return Math.round((aUtc - bUtc) / 86_400_000);
}

/**
 * RN-21: Quando o dia de vencimento deste mês já passou, oferece começar no próximo mês (padrão)
 * ou ainda neste mês (nasce atrasada).
 */
export function cobrancaInicioPadrao(
  diaVencimento: number,
  hojeIso: string = hojeEmBrasilia(),
): { vencimentoJaPassou: boolean; esteMes: string; proximoMes: string } {
  const esteMes = `${hojeIso.slice(0, 7)}-01`;
  const proximoMes = adicionarMeses(esteMes, 1);
  const diaHoje = diaDoMesIso(hojeIso);
  return {
    vencimentoJaPassou: diaHoje > diaVencimento,
    esteMes,
    proximoMes,
  };
}
