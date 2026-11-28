import { describe, expect, it } from "vitest";
import {
  formatBRL,
  formatBRLInput,
  formatFormaPagamento,
  formatProximoLembrete,
  formatRotuloPrazoObrigacao,
  formatStatusCobranca,
  formatTipoCliente,
  iniciaisDoNome,
  parseBRLInput,
  primeiroNome,
} from "@/lib/format";

describe("format", () => {
  it("formata e interpreta moeda em BRL", () => {
    expect(formatBRL(300)).toBe("R$ 300,00");
    expect(formatBRL("1250.5")).toBe("R$ 1.250,50");
    expect(formatBRLInput(300)).toBe("300,00");
    expect(parseBRLInput("R$ 1.250,50")).toBe(1250.5);
    expect(parseBRLInput("300,00")).toBe(300);
    expect(parseBRLInput("1.500")).toBe(1500);
    expect(parseBRLInput("")).toBeNull();
    expect(parseBRLInput("abc")).toBeNull();
  });

  it("extrai primeiro nome e iniciais", () => {
    expect(primeiroNome("Maria Souza Silva")).toBe("Maria");
    expect(primeiroNome("  ")).toBe("");
    expect(iniciaisDoNome("Maria Souza")).toBe("MS");
    expect(iniciaisDoNome("Carlos")).toBe("CA");
    expect(iniciaisDoNome("")).toBe("NX");
  });

  it("formata tipo de cliente, status e forma de pagamento", () => {
    expect(formatTipoCliente("SIMPLES")).toBe("Simples");
    expect(formatTipoCliente("MEI")).toBe("MEI");
    expect(formatStatusCobranca("pago", "2026-11-10", 0)).toBe("Pago");
    expect(formatStatusCobranca("vence_hoje", "2026-11-27", 0)).toBe("Vence hoje");
    expect(formatStatusCobranca("a_vencer", "2026-11-30", 0)).toBe("Vence dia 30");
    expect(formatStatusCobranca("atrasado", "2026-11-26", 1)).toBe("Atrasado há 1 dia");
    expect(formatStatusCobranca("atrasado", "2026-11-20", 7)).toBe("Atrasado há 7 dias");
    expect(formatFormaPagamento("pix")).toBe("Pix");
    expect(formatFormaPagamento("transferencia")).toBe("Transferência");
    expect(formatFormaPagamento(null)).toBe("Manual");
  });

  it("formata próximo lembrete e rótulo de obrigação", () => {
    expect(
      formatProximoLembrete(
        {
          situacao: "pago",
          pago_em: "2026-11-10",
          forma: "pix",
          proximo_lembrete: null,
          proximo_lembrete_tipo: null,
          sem_contato: false,
        },
        "2026-11-27",
      ),
    ).toBe("Pago em 10/11 · Pix");

    expect(
      formatProximoLembrete(
        {
          situacao: "a_vencer",
          pago_em: null,
          forma: null,
          proximo_lembrete: "2026-11-27",
          proximo_lembrete_tipo: "passo",
          sem_contato: false,
        },
        "2026-11-27",
      ),
    ).toBe("Lembrete · hoje às 9h");

    expect(
      formatProximoLembrete(
        {
          situacao: "atrasado",
          pago_em: null,
          forma: null,
          proximo_lembrete: "2026-11-28",
          proximo_lembrete_tipo: "pendencia",
          sem_contato: false,
        },
        "2026-11-27",
      ),
    ).toBe("Pendência · amanhã às 9h");

    expect(
      formatProximoLembrete(
        {
          situacao: "a_vencer",
          pago_em: null,
          forma: null,
          proximo_lembrete: "2026-11-27",
          proximo_lembrete_tipo: "passo",
          sem_contato: true,
        },
        "2026-11-27",
      ),
    ).toBe("Sem envio automático");

    expect(formatRotuloPrazoObrigacao("concluida", 0)).toBe("Concluída");
    expect(formatRotuloPrazoObrigacao("a_vencer", 1)).toBe("Falta 1 dia");
    expect(formatRotuloPrazoObrigacao("a_vencer", 4)).toBe("Faltam 4 dias");
  });
});
