import { describe, expect, it } from "vitest";
import {
  descricaoDisparoPasso,
  detectarCamposDesconhecidos,
  formatarAvisoCamposDesconhecidos,
  interpolarPreviaRegua,
} from "@/lib/regua-vars";

describe("regua-vars", () => {
  it("detecta variáveis desconhecidas no texto do modelo", () => {
    expect(
      detectarCamposDesconhecidos("Olá, {nome}. Valor {valor} em {venc} via {pix} ({mes})."),
    ).toEqual([]);

    expect(
      detectarCamposDesconhecidos("Olá, {nome}. Documento {cpf} e {empresa}."),
    ).toEqual(["{cpf}", "{empresa}"]);

    expect(formatarAvisoCamposDesconhecidos(["{foo}"])).toContain("O campo {foo}");
    expect(formatarAvisoCamposDesconhecidos(["{a}", "{b}"])).toContain("Os campos {a}, {b}");
    expect(formatarAvisoCamposDesconhecidos([])).toBeNull();
  });

  it("descreve os passos fixos e interpola prévia de régua e pendência", () => {
    expect(descricaoDisparoPasso(-3)).toBe("Vencimento − 3 dias · 9h");
    expect(descricaoDisparoPasso(7)).toBe("Vencimento + 7 dias · 9h");

    const previa = interpolarPreviaRegua(
      "Olá, {nome}. {mes}: {valor} até {venc}. Pix: {pix}.",
      {
        nome: "Maria Souza",
        mesIso: "2026-11-01",
        valor: 300,
        vencimentoIso: "2026-11-10",
        chavePix: "contato@escritorio.com",
      },
    );
    expect(previa).toBe(
      "Olá, Maria. novembro: R$ 300,00 até 10/11. Pix: contato@escritorio.com.",
    );

    const previaPendencia = interpolarPreviaRegua("Olá, {nome}. Pix: {pix}.", {
      mesIso: "2026-11-01",
      chavePix: null,
      tipo: "pendencia",
    });
    expect(previaPendencia).toContain("(chave Pix não cadastrada)");
    expect(previaPendencia).toContain("Em aberto: setembro (R$ 300,00) e outubro (R$ 300,00)");
  });
});
