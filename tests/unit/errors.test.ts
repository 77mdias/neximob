import { describe, expect, it } from "vitest";
import { MENSAGEM_SESSAO_EXPIRADA, traduzirErroLogin, traduzirErroSupabase } from "@/lib/errors";

describe("errors", () => {
  it("traduz códigos do PostgreSQL/PostgREST para português", () => {
    expect(traduzirErroSupabase({ code: "23514", message: "clientes_dia_vencimento_check" })).toContain(
      "dia entre 1 e 28",
    );
    expect(traduzirErroSupabase({ code: "23514", message: "motivo_extra" })).toContain("motivo");
    expect(traduzirErroSupabase({ code: "42501" })).toBe(MENSAGEM_SESSAO_EXPIRADA);
    expect(traduzirErroSupabase({ code: "23505" })).toBe("Este registro já existe.");
    expect(traduzirErroSupabase(null, "Erro genérico")).toBe("Erro genérico");
  });

  it("retorna mensagem neutra no login exceto confirmação/limite", () => {
    expect(traduzirErroLogin({ message: "Invalid login credentials" })).toBe(
      "E-mail ou senha incorretos.",
    );
    expect(traduzirErroLogin({ message: "Email not confirmed" })).toContain("Confirme seu e-mail");
    expect(traduzirErroLogin({ message: "Email rate limit exceeded" })).toContain(
      "Muitas tentativas",
    );
  });
});
