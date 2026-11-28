import type {
  CobrancaDoMesRow,
  FormaPagamento,
  SituacaoCobranca,
  SituacaoPrazo,
  TipoCliente,
} from "./database.types";
import { compararDias, diaDoMesIso, formatarDiaMes } from "./dates";

const BRL_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatBRL(valor: number | string): string {
  const num = typeof valor === "number" ? valor : Number(valor);
  const safe = Number.isFinite(num) ? num : 0;
  return BRL_FORMATTER.format(safe).replace(/\u00A0/g, " ");
}

export function formatBRLInput(valor: number): string {
  if (!Number.isFinite(valor)) return "";
  return valor.toFixed(2).replace(".", ",");
}

export function parseBRLInput(raw: string): number | null {
  const cleaned = raw
    .trim()
    .replace(/^R\$\s*/i, "")
    .replace(/\s+/g, "");
  if (!cleaned) return null;

  let normalized = cleaned;
  if (cleaned.includes(",")) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, "");
  }

  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const num = Number(normalized);
  if (!Number.isFinite(num)) return null;
  return Math.round(num * 100) / 100;
}

export function primeiroNome(nome: string): string {
  const trimmed = nome.trim().replace(/\s+/g, " ");
  if (!trimmed) return "";
  return trimmed.split(" ")[0] ?? "";
}

export function iniciaisDoNome(nome: string): string {
  const parts = nome
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "NX";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function formatTipoCliente(tipo: TipoCliente): string {
  if (tipo === "SIMPLES") return "Simples";
  return tipo;
}

export function formatStatusCobranca(
  situacao: SituacaoCobranca,
  vencimentoIso: string,
  diasAtraso: number,
): string {
  switch (situacao) {
    case "pago":
      return "Pago";
    case "vence_hoje":
      return "Vence hoje";
    case "a_vencer":
      return `Vence dia ${diaDoMesIso(vencimentoIso)}`;
    case "atrasado": {
      const dias = Math.max(1, diasAtraso);
      return dias === 1 ? "Atrasado há 1 dia" : `Atrasado há ${dias} dias`;
    }
  }
}

export function formatFormaPagamento(forma: FormaPagamento | null): string {
  switch (forma) {
    case "pix":
      return "Pix";
    case "transferencia":
      return "Transferência";
    case "dinheiro":
      return "Dinheiro";
    case "outro":
      return "Outro";
    default:
      return "Manual";
  }
}

export function formatProximoLembrete(
  cobranca: Pick<
    CobrancaDoMesRow,
    "situacao" | "pago_em" | "forma" | "proximo_lembrete" | "proximo_lembrete_tipo" | "sem_contato"
  >,
  hojeIso: string,
): string {
  if (cobranca.situacao === "pago" && cobranca.pago_em) {
    return `Pago em ${formatarDiaMes(cobranca.pago_em)} · ${formatFormaPagamento(cobranca.forma)}`;
  }
  if (cobranca.sem_contato) {
    return "Sem envio automático";
  }
  if (!cobranca.proximo_lembrete) {
    return "Sem próximos lembretes";
  }
  const diff = compararDias(cobranca.proximo_lembrete, hojeIso);
  const quando =
    diff === 0
      ? "hoje às 9h"
      : diff === 1
        ? "amanhã às 9h"
        : formatarDiaMes(cobranca.proximo_lembrete);
  const prefixo = cobranca.proximo_lembrete_tipo === "pendencia" ? "Pendência" : "Lembrete";
  return `${prefixo} · ${quando}`;
}

export function formatRotuloPrazoObrigacao(
  situacao: SituacaoPrazo,
  diasParaOPrazo: number,
): string {
  switch (situacao) {
    case "concluida":
      return "Concluída";
    case "sem_clientes":
      return "Sem clientes";
    case "vencida":
      return "Vencida";
    case "vence_hoje":
      return "Vence hoje";
    case "a_vencer": {
      const dias = Math.max(1, diasParaOPrazo);
      return dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`;
    }
  }
}
