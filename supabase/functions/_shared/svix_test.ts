import assert from "node:assert/strict";
import { assinarSvix, verificarAssinaturaSvix } from "./svix.ts";

const SEGREDO = "whsec_MfKQ9r8GKYqrTwjUPD8ILPZIo2LaLaSw";
const ID = "msg_p5jXN8AQM9LWM0D4loKWxJek";
const HORARIO = "1614265330";
const CORPO = '{"test": 2432232314}';

Deno.test("assinatura bate com o vetor de exemplo da documentação do Svix", async () => {
  assert.equal(await assinarSvix(SEGREDO, ID, HORARIO, CORPO), "g0hM9SsE+OTPJTGt/tmIKtSyZlE3uFJELVlNIOLJ1OE=");
});

Deno.test("aceita aviso com assinatura válida e recente", async () => {
  const assinatura = await assinarSvix(SEGREDO, ID, HORARIO, CORPO);
  const valido = await verificarAssinaturaSvix(
    CORPO,
    { id: ID, timestamp: HORARIO, assinatura: `v1,${assinatura}` },
    SEGREDO,
    Number(HORARIO) + 10,
  );
  assert.equal(valido, true);
});

Deno.test("aceita quando uma das várias assinaturas é válida", async () => {
  const assinatura = await assinarSvix(SEGREDO, ID, HORARIO, CORPO);
  const valido = await verificarAssinaturaSvix(
    CORPO,
    { id: ID, timestamp: HORARIO, assinatura: `v1,assinaturaAntiga= v1,${assinatura}` },
    SEGREDO,
    Number(HORARIO),
  );
  assert.equal(valido, true);
});

Deno.test("recusa corpo alterado", async () => {
  const assinatura = await assinarSvix(SEGREDO, ID, HORARIO, CORPO);
  const valido = await verificarAssinaturaSvix(
    '{"test": 1}',
    { id: ID, timestamp: HORARIO, assinatura: `v1,${assinatura}` },
    SEGREDO,
    Number(HORARIO),
  );
  assert.equal(valido, false);
});

Deno.test("recusa aviso antigo (mais de 5 minutos)", async () => {
  const assinatura = await assinarSvix(SEGREDO, ID, HORARIO, CORPO);
  const valido = await verificarAssinaturaSvix(
    CORPO,
    { id: ID, timestamp: HORARIO, assinatura: `v1,${assinatura}` },
    SEGREDO,
    Number(HORARIO) + 301,
  );
  assert.equal(valido, false);
});

Deno.test("recusa segredo errado, versão desconhecida e cabeçalhos ausentes", async () => {
  const assinatura = await assinarSvix(SEGREDO, ID, HORARIO, CORPO);
  const agora = Number(HORARIO);
  assert.equal(
    await verificarAssinaturaSvix(CORPO, { id: ID, timestamp: HORARIO, assinatura: `v1,${assinatura}` }, "whsec_c2VncmVkb291dHJv", agora),
    false,
  );
  assert.equal(
    await verificarAssinaturaSvix(CORPO, { id: ID, timestamp: HORARIO, assinatura: `v2,${assinatura}` }, SEGREDO, agora),
    false,
  );
  assert.equal(
    await verificarAssinaturaSvix(CORPO, { id: null, timestamp: HORARIO, assinatura: `v1,${assinatura}` }, SEGREDO, agora),
    false,
  );
  assert.equal(
    await verificarAssinaturaSvix(CORPO, { id: ID, timestamp: HORARIO, assinatura: `v1,${assinatura}` }, "whsec_###", agora),
    false,
  );
});
