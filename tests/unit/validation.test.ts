import { describe, expect, it } from "vitest";
import {
  ajustarValorSchema,
  clienteFormSchema,
  criarContaSchema,
  formatarTelefoneExibicao,
  normalizarTelefoneBR,
  salvarPassoReguaSchema,
} from "@/lib/validation";

describe("validation", () => {
  it("normaliza e formata telefone brasileiro", () => {
    expect(normalizarTelefoneBR("(11) 98765-4321")).toBe("+5511987654321");
    expect(normalizarTelefoneBR("5511987654321")).toBe("+5511987654321");
    expect(normalizarTelefoneBR("")).toBeNull();
    expect(formatarTelefoneExibicao("+5511987654321")).toBe("(11) 98765-4321");
  });

  it("valida cadastro de cliente e limites de dia 1..28", () => {
    const valido = clienteFormSchema.safeParse({
      nome: "Padaria Central",
      tipo: "MEI",
      honorarioRaw: "450,00",
      diaVencimento: 15,
      email: "padaria@exemplo.com",
      telefone: "(11) 91234-5678",
      canais: ["email", "whatsapp"],
    });
    expect(valido.success).toBe(true);
    if (valido.success) {
      expect(valido.data.honorarioRaw).toBe(450);
      expect(valido.data.telefone).toBe("+5511912345678");
    }

    const diaInvalido = clienteFormSchema.safeParse({
      nome: "Padaria Central",
      tipo: "MEI",
      honorarioRaw: "450,00",
      diaVencimento: 30,
      email: "",
      telefone: "",
      canais: ["email"],
    });
    expect(diaInvalido.success).toBe(false);
  });

  it("exige motivo quando há serviço extra e aceita 0 sem motivo", () => {
    const cobrancaId = "11111111-1111-4111-8111-111111111111";
    expect(
      ajustarValorSchema.safeParse({
        cobrancaId,
        extraRaw: "120,00",
        motivo: "",
      }).success,
    ).toBe(false);

    expect(
      ajustarValorSchema.safeParse({
        cobrancaId,
        extraRaw: "0,00",
        motivo: "",
      }).success,
    ).toBe(true);
  });

  it("valida criação de conta com aceite obrigatório e passo da régua", () => {
    expect(
      criarContaSchema.safeParse({
        nome: "Ana",
        email: "ana@contabil.br",
        password: "123",
        aceitouTermos: false,
      }).success,
    ).toBe(false);

    expect(
      salvarPassoReguaSchema.safeParse({
        id: "22222222-2222-4222-8222-222222222222",
        ativo: true,
        texto: "Olá, {nome}.",
      }).success,
    ).toBe(true);
  });
});
