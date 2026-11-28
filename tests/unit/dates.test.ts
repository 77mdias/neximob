import { describe, expect, it } from "vitest";
import {
  adicionarMeses,
  cobrancaInicioPadrao,
  compararDias,
  formatarDataCompleta,
  formatarDiaMes,
  formatarMesCurto,
  formatarMesTitulo,
  hojeEmBrasilia,
  mesAtualBrasilia,
  nomeMesMinusculo,
  normalizarMesReferencia,
} from "@/lib/dates";

describe("dates", () => {
  it("calcula hoje e mês em Brasília respeitando UTC-3", () => {
    // 2026-12-01T01:30:00Z corresponde a 2026-11-30 22:30 em America/Sao_Paulo
    const instant = new Date("2026-12-01T01:30:00Z");
    expect(hojeEmBrasilia(instant)).toBe("2026-11-30");
    expect(mesAtualBrasilia(instant)).toBe("2026-11-01");
  });

  it("normaliza e navega meses", () => {
    const ref = new Date("2026-11-15T15:00:00Z");
    expect(normalizarMesReferencia("2026-10", ref)).toBe("2026-10-01");
    expect(normalizarMesReferencia("invalido", ref)).toBe("2026-11-01");
    expect(adicionarMeses("2026-12-01", 1)).toBe("2027-01-01");
    expect(adicionarMeses("2026-01-01", -1)).toBe("2025-12-01");
  });

  it("formata títulos, meses curtos, dias e comparações", () => {
    expect(formatarMesTitulo("2026-11-01")).toBe("Novembro de 2026");
    expect(nomeMesMinusculo("2026-03-01")).toBe("março");
    expect(formatarMesCurto("2026-05-01")).toBe("Mai 2026");
    expect(formatarDiaMes("2026-11-07")).toBe("07/11");
    expect(formatarDataCompleta("2026-11-07")).toBe("07/11/2026");
    expect(compararDias("2026-11-10", "2026-11-08")).toBe(2);
    expect(compararDias("2026-11-08", "2026-11-10")).toBe(-2);
  });

  it("define padrão de início de cobrança pela regra RN-21", () => {
    expect(cobrancaInicioPadrao(10, "2026-11-15")).toEqual({
      vencimentoJaPassou: true,
      esteMes: "2026-11-01",
      proximoMes: "2026-12-01",
    });

    expect(cobrancaInicioPadrao(20, "2026-11-15").vencimentoJaPassou).toBe(false);
  });
});
