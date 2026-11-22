import assert from "node:assert/strict";
import { autorizadoPeloCron, iguaisSemVazarTempo } from "./seguranca.ts";
import { cabecalhosCors, origensPermitidas } from "./cors.ts";

Deno.test("compara textos", () => {
  assert.equal(iguaisSemVazarTempo("abc", "abc"), true);
  assert.equal(iguaisSemVazarTempo("abc", "abd"), false);
  assert.equal(iguaisSemVazarTempo("abc", "abcd"), false);
  assert.equal(iguaisSemVazarTempo("", ""), true);
});

Deno.test("aceita só o segredo do Cron", () => {
  const pedido = (cabecalho?: string) =>
    new Request("http://x", { method: "POST", headers: cabecalho ? { Authorization: cabecalho } : {} });
  assert.equal(autorizadoPeloCron(pedido("Bearer segredo-longo"), "segredo-longo"), true);
  assert.equal(autorizadoPeloCron(pedido("Bearer outro"), "segredo-longo"), false);
  assert.equal(autorizadoPeloCron(pedido(), "segredo-longo"), false);
  assert.equal(autorizadoPeloCron(pedido("Bearer "), ""), false);
});

Deno.test("CORS só libera as origens configuradas", () => {
  const permitidas = origensPermitidas(" http://127.0.0.1:3000 , https://app.ex.com ");
  assert.deepEqual(permitidas, ["http://127.0.0.1:3000", "https://app.ex.com"]);
  assert.equal(cabecalhosCors("https://app.ex.com", permitidas)["Access-Control-Allow-Origin"], "https://app.ex.com");
  assert.equal(cabecalhosCors("https://malicioso.com", permitidas)["Access-Control-Allow-Origin"], undefined);
  assert.equal(cabecalhosCors(null, permitidas)["Access-Control-Allow-Origin"], undefined);
});
