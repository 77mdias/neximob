import { describe, expect, it } from "vitest";
import {
  contarFiltrosCobrancas,
  filtrarCobrancas,
  normalizarFiltroCobranca,
} from "@/lib/cobrancas-filter";
import type { CobrancaDoMesRow } from "@/lib/database.types";

function criarLinha(overrides: Partial<CobrancaDoMesRow>): CobrancaDoMesRow {
  return {
    cobranca_id: "11111111-1111-4111-8111-111111111111",
    cliente_id: "22222222-2222-4222-8222-222222222222",
    cliente_nome: "Cliente Exemplo",
    tipo: "MEI",
    mes: "2026-11-01",
    vencimento: "2026-11-10",
    valor: 300,
    extra: 0,
    total: 300,
    motivo_extra: null,
    situacao: "a_vencer",
    dias_atraso: 0,
    pago_em: null,
    forma: null,
    meses_em_aberto_anteriores: 0,
    total_em_aberto_anteriores: 0,
    proximo_lembrete: "2026-11-10",
    proximo_lembrete_tipo: "passo",
    sem_contato: false,
    email_situacao: "ok",
    ...overrides,
  };
}

describe("cobrancas-filter", () => {
  const amostra: CobrancaDoMesRow[] = [
    criarLinha({ cobranca_id: "1", cliente_nome: "Ana Paula", situacao: "atrasado", dias_atraso: 3 }),
    criarLinha({ cobranca_id: "2", cliente_nome: "Bruno Lima", situacao: "vence_hoje" }),
    criarLinha({ cobranca_id: "3", cliente_nome: "Carla Dias", situacao: "a_vencer" }),
    criarLinha({
      cobranca_id: "4",
      cliente_nome: "Daniela Cruz",
      situacao: "pago",
      pago_em: "2026-11-05",
      forma: "pix",
      meses_em_aberto_anteriores: 1,
    }),
  ];

  it("normaliza filtros e usa todos como fallback", () => {
    expect(normalizarFiltroCobranca("vence_hoje")).toBe("vence_hoje");
    expect(normalizarFiltroCobranca("desconhecido")).toBe("todos");
    expect(normalizarFiltroCobranca(undefined)).toBe("todos");
  });

  it("conta corretamente os cinco chips incluindo atraso de mês anterior (RN-18)", () => {
    expect(contarFiltrosCobrancas(amostra)).toEqual({
      todos: 4,
      em_atraso: 2,
      vence_hoje: 1,
      a_vencer: 1,
      pagos: 1,
    });
  });

  it("filtra por chip e termo de busca em memória", () => {
    expect(filtrarCobrancas(amostra, "vence_hoje").map((r) => r.cobranca_id)).toEqual(["2"]);
    expect(filtrarCobrancas(amostra, "em_atraso").map((r) => r.cobranca_id)).toEqual(["1", "4"]);
    expect(filtrarCobrancas(amostra, "todos", "daniela").map((r) => r.cobranca_id)).toEqual(["4"]);
  });
});
