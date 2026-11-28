import { adicionarMeses, formatarDiaMes, mesAtualBrasilia, nomeMesMinusculo } from "./dates";
import { formatBRL, primeiroNome } from "./format";

export const VARIAVEIS_REGUA = ["{nome}", "{mes}", "{valor}", "{venc}", "{pix}"] as const;
export const VARIAVEIS_PENDENCIA = ["{nome}", "{pix}"] as const;

const VARIAVEIS_ACEITAS = new Set<string>(VARIAVEIS_REGUA);

/**
 * Replica public.campos_desconhecidos(p_texto) para feedback instantâneo antes de salvar (RF-32).
 */
export function detectarCamposDesconhecidos(texto: string): string[] {
  const encontrados = new Set<string>();
  const regex = /(\{[^{}]*\})/g;
  for (const match of texto.matchAll(regex)) {
    const token = match[1];
    if (token && !VARIAVEIS_ACEITAS.has(token)) {
      encontrados.add(token);
    }
  }
  return Array.from(encontrados).sort((a, b) => a.localeCompare(b));
}

export function formatarAvisoCamposDesconhecidos(desconhecidos: readonly string[]): string | null {
  if (desconhecidos.length === 0) return null;
  if (desconhecidos.length === 1) {
    return `O campo ${desconhecidos[0]} não é reconhecido. Campos aceitos: {nome}, {mes}, {valor}, {venc} e {pix}.`;
  }
  return `Os campos ${desconhecidos.join(", ")} não são reconhecidos. Campos aceitos: {nome}, {mes}, {valor}, {venc} e {pix}.`;
}

export function descricaoDisparoPasso(dias: -3 | 0 | 3 | 7): string {
  switch (dias) {
    case -3:
      return "Vencimento − 3 dias · 9h";
    case 0:
      return "Dia do vencimento · 9h";
    case 3:
      return "Vencimento + 3 dias · 9h";
    case 7:
      return "Vencimento + 7 dias · 9h";
  }
}

export function interpolarPreviaRegua(
  texto: string,
  opts?: {
    nome?: string;
    mesIso?: string;
    valor?: number;
    vencimentoIso?: string;
    chavePix?: string | null;
    tipo?: "passo" | "pendencia";
  },
): string {
  const mesIso = opts?.mesIso ?? mesAtualBrasilia();
  const nome = primeiroNome(opts?.nome ?? "Maria Souza");
  const mes = nomeMesMinusculo(mesIso);
  const valor = formatBRL(opts?.valor ?? 300);
  const venc = formatarDiaMes(opts?.vencimentoIso ?? `${mesIso.slice(0, 7)}-10`);
  const pix = opts?.chavePix?.trim() || "(chave Pix não cadastrada)";

  const corpo = texto
    .replaceAll("{nome}", nome)
    .replaceAll("{mes}", mes)
    .replaceAll("{valor}", valor)
    .replaceAll("{venc}", venc)
    .replaceAll("{pix}", pix);

  if (opts?.tipo === "pendencia") {
    const mes2 = nomeMesMinusculo(adicionarMeses(mesIso, -2));
    const mes1 = nomeMesMinusculo(adicionarMeses(mesIso, -1));
    return `${corpo}\n\nEm aberto: ${mes2} (R$ 300,00) e ${mes1} (R$ 300,00). Total: R$ 600,00.`;
  }

  return corpo;
}

export const MODELOS_WHATSAPP_FIXOS: ReadonlyArray<{
  id: string;
  titulo: string;
  quando: string;
  texto: string;
}> = [
  {
    id: "wpp--3",
    titulo: "3 dias antes",
    quando: "Vencimento − 3 dias · Modelo utilidade Meta",
    texto:
      "Olá, {nome}. Lembramos que o honorário contábil de {mes}, no valor de {valor}, vence em {venc}. Chave Pix: {pix}.",
  },
  {
    id: "wpp-0",
    titulo: "No dia",
    quando: "Dia do vencimento · Modelo utilidade Meta",
    texto:
      "Olá, {nome}. Hoje ({venc}) vence o honorário contábil de {mes} no valor de {valor}. Chave Pix: {pix}. Caso já tenha pago, desconsidere.",
  },
  {
    id: "wpp-3",
    titulo: "3 dias depois",
    quando: "Vencimento + 3 dias · Modelo utilidade Meta",
    texto:
      "Olá, {nome}. Ainda não identificamos o pagamento do honorário de {mes} ({valor}), com vencimento em {venc}. Chave Pix: {pix}.",
  },
  {
    id: "wpp-7",
    titulo: "7 dias depois",
    quando: "Vencimento + 7 dias · Modelo utilidade Meta",
    texto:
      "Olá, {nome}. O honorário de {mes} ({valor}, vencido em {venc}) segue em aberto. Chave Pix: {pix}.",
  },
  {
    id: "wpp-pendencia",
    titulo: "Somente pendências anteriores",
    quando: "No dia do vencimento · Modelo utilidade Meta",
    texto:
      "Olá, {nome}. Constam honorários de meses anteriores em aberto. Chave Pix: {pix}. Também está em aberto: outubro (R$ 300,00). Total: R$ 600,00.",
  },
];
