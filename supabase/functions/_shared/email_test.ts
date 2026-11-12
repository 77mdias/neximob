import assert from "node:assert/strict";
import { enviarPeloResend, escaparHtml, falhaTemporaria, montarRemetente, textoParaHtml } from "./email.ts";

Deno.test("escapa HTML", () => {
  assert.equal(escaparHtml(`<b>"Ana" & 'Bia'</b>`), "&lt;b&gt;&quot;Ana&quot; &amp; &#39;Bia&#39;&lt;/b&gt;");
});

Deno.test("converte parágrafos e quebras de linha em HTML", () => {
  const html = textoParaHtml("Olá, Maria!\nLinha 2\n\nTambém está em aberto: <outubro>.");
  assert.match(html, /<p>Olá, Maria!<br>Linha 2<\/p>/);
  assert.match(html, /<p>Também está em aberto: &lt;outubro&gt;.<\/p>/);
});

Deno.test("remetente usa o nome do contador e remove caracteres perigosos", () => {
  assert.equal(montarRemetente("Maria Contabilidade", "lembretes@mail.ex.com"), '"Maria Contabilidade via Neximob" <lembretes@mail.ex.com>');
  assert.equal(montarRemetente('Ana "<x>"\r\nBcc: y', "l@ex.com"), '"Ana x Bcc: y via Neximob" <l@ex.com>');
  assert.equal(montarRemetente(null, "l@ex.com"), "Neximob <l@ex.com>");
});

Deno.test("classifica falhas temporárias", () => {
  assert.equal(falhaTemporaria(429), true);
  assert.equal(falhaTemporaria(500), true);
  assert.equal(falhaTemporaria(503), true);
  assert.equal(falhaTemporaria(408), true);
  assert.equal(falhaTemporaria(422), false);
  assert.equal(falhaTemporaria(401), false);
});

const EMAIL = {
  apiKey: "re_teste",
  de: "Neximob <l@ex.com>",
  para: "maria@example.com",
  responderPara: "contador@example.com",
  assunto: "Lembrete",
  texto: "Olá!",
  chaveIdempotencia: "envio-123",
};

Deno.test("envio aceito devolve o id do Resend e manda a chave de idempotência", async () => {
  let pedido: Request | undefined;
  const fetchFalso = (async (url: string | URL | Request, init?: RequestInit) => {
    pedido = new Request(url, init);
    return new Response(JSON.stringify({ id: "email_abc" }), { status: 200 });
  }) as typeof fetch;

  const resultado = await enviarPeloResend(EMAIL, fetchFalso);
  assert.deepEqual(resultado, { ok: true, id: "email_abc" });
  assert.equal(pedido?.headers.get("Idempotency-Key"), "envio-123");
  assert.equal(pedido?.headers.get("Authorization"), "Bearer re_teste");
  const corpo = await pedido!.json();
  assert.deepEqual(corpo.to, ["maria@example.com"]);
  assert.equal(corpo.reply_to, "contador@example.com");
  assert.equal(corpo.text, "Olá!");
});

Deno.test("erro de validação é falha definitiva", async () => {
  const fetchFalso = (async () =>
    new Response(JSON.stringify({ message: "Invalid `to` field" }), { status: 422 })) as typeof fetch;
  assert.deepEqual(await enviarPeloResend(EMAIL, fetchFalso), { ok: false, temporaria: false, erro: "Invalid `to` field" });
});

Deno.test("limite de envio é falha temporária", async () => {
  const fetchFalso = (async () => new Response("{}", { status: 429 })) as typeof fetch;
  assert.deepEqual(await enviarPeloResend(EMAIL, fetchFalso), { ok: false, temporaria: true, erro: "HTTP 429" });
});

Deno.test("falha de rede é falha temporária", async () => {
  const fetchFalso = (async () => {
    throw new TypeError("connection reset");
  }) as typeof fetch;
  const resultado = await enviarPeloResend(EMAIL, fetchFalso);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.temporaria, true);
});
