import assert from "node:assert/strict";
import { ErroDaFila, processarFila, type RespostaRpc } from "./fila.ts";
import type { EmailParaEnviar, ResultadoEnvio } from "./email.ts";

function mensagem(id: string, extras: Record<string, unknown> = {}) {
  return {
    envio_id: id,
    canal: "email",
    cancelar: false,
    motivo: null,
    destinatario_email: `${id}@example.com`,
    contador_nome: "Escritório Exemplo",
    contador_email: "contador@example.com",
    assunto: "Lembrete: honorário de novembro",
    texto: "Olá!",
    cobrancas: [`cobranca-${id}`],
    ...extras,
  };
}

function bancoFalso(lotes: string[][], mensagens: Record<string, unknown>) {
  const chamadas: { funcao: string; argumentos?: Record<string, unknown> }[] = [];
  const rpc = (funcao: string, argumentos?: Record<string, unknown>): Promise<RespostaRpc> => {
    chamadas.push({ funcao, argumentos });
    if (funcao === "rotina_reservar_envios") return Promise.resolve({ data: lotes.shift() ?? [], error: null });
    if (funcao === "rotina_mensagem_do_envio") {
      const id = argumentos?.p_envio_id as string;
      return Promise.resolve({ data: mensagens[id] ? [mensagens[id]] : [], error: null });
    }
    return Promise.resolve({ data: "ok", error: null });
  };
  const resultados = () =>
    chamadas
      .filter((c) => c.funcao === "rotina_registrar_resultado")
      .map((c) => [c.argumentos?.p_envio_id, c.argumentos?.p_resultado]);
  return { rpc, chamadas, resultados };
}

Deno.test("envia, cancela e trata falhas de cada envio do lote", async () => {
  const banco = bancoFalso([["a", "b", "c", "d", "e"]], {
    a: mensagem("a"),
    b: mensagem("b", { cancelar: true, motivo: "cobrança paga antes do envio" }),
    c: mensagem("c"),
    d: mensagem("d"),
    // "e" não tem mensagem: erro ao montar
  });
  const emails: Omit<EmailParaEnviar, "apiKey">[] = [];
  const respostas: Record<string, ResultadoEnvio> = {
    "a@example.com": { ok: true, id: "email_a" },
    "c@example.com": { ok: false, temporaria: true, erro: "HTTP 429" },
    "d@example.com": { ok: false, temporaria: false, erro: "Invalid `to` field" },
  };

  const contagem = await processarFila({
    rpc: banco.rpc,
    enviarEmail: (email) => {
      emails.push(email);
      return Promise.resolve(respostas[email.para]);
    },
    enderecoRemetente: "lembretes@mail.ex.com",
    registrarLog: () => {},
  });

  assert.deepEqual(contagem, { enviados: 1, falhas: 1, cancelados: 1, novas_tentativas: 2 });
  assert.deepEqual(banco.resultados(), [
    ["a", "enviado"],
    ["b", "cancelado"],
    ["c", "falha_temporaria"],
    ["d", "falha_definitiva"],
    ["e", "falha_temporaria"],
  ]);
  assert.equal(emails.length, 3, "o envio cancelado e o sem mensagem não chamam o Resend");
  assert.equal(emails[0].chaveIdempotencia, "envio-a");
  assert.equal(emails[0].de, '"Escritório Exemplo via Neximob" <lembretes@mail.ex.com>');
  assert.equal(emails[0].responderPara, "contador@example.com");

  const registroDoA = banco.chamadas.find(
    (c) => c.funcao === "rotina_registrar_resultado" && c.argumentos?.p_envio_id === "a",
  );
  assert.equal(registroDoA?.argumentos?.p_provedor_mensagem_id, "email_a");
  assert.deepEqual(registroDoA?.argumentos?.p_cobrancas, ["cobranca-a"]);
});

Deno.test("processa lotes até a fila esvaziar", async () => {
  const banco = bancoFalso([["a"], ["b"]], { a: mensagem("a"), b: mensagem("b") });
  const contagem = await processarFila({
    rpc: banco.rpc,
    enviarEmail: () => Promise.resolve({ ok: true, id: "x" }),
    enderecoRemetente: "l@ex.com",
  });
  assert.equal(contagem.enviados, 2);
  assert.equal(banco.chamadas.filter((c) => c.funcao === "rotina_reservar_envios").length, 3);
});

Deno.test("para quando o tempo máximo acaba", async () => {
  let agora = 0;
  const banco = bancoFalso([["a"], ["b"], ["c"]], { a: mensagem("a"), b: mensagem("b"), c: mensagem("c") });
  const contagem = await processarFila({
    rpc: banco.rpc,
    enviarEmail: () => {
      agora += 30_000;
      return Promise.resolve({ ok: true, id: "x" });
    },
    enderecoRemetente: "l@ex.com",
    agoraMs: () => agora,
    tempoMaximoMs: 40_000,
  });
  assert.equal(contagem.enviados, 2);
});

Deno.test("erro ao reservar a fila interrompe o processamento", async () => {
  await assert.rejects(
    processarFila({
      rpc: () => Promise.resolve({ data: null, error: { code: "42501" } }),
      enviarEmail: () => Promise.resolve({ ok: true, id: "x" }),
      enderecoRemetente: "l@ex.com",
    }),
    ErroDaFila,
  );
});
