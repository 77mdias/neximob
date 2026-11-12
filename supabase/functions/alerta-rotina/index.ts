// Alerta da rotina diária (ADR-0005): chamada pelo Supabase Cron às 9h30 de
// Brasília. Se o planejamento não rodou, falhou ou há envios parados, manda um
// e-mail para a equipe da plataforma (NEXIMOB_EMAIL_ALERTA).

import { autorizadoPeloCron, json, variavel } from "../_shared/seguranca.ts";
import { enviarPeloResend, montarRemetente } from "../_shared/email.ts";
import { clienteAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);
  if (!autorizadoPeloCron(req, variavel("NEXIMOB_SEGREDO_CRON"))) {
    return json({ erro: "não autorizado" }, 401);
  }

  const { data, error } = await clienteAdmin().rpc("rotina_verificar_saude");
  if (error) {
    console.error(`alerta-rotina: erro ao verificar (${error.code})`);
    return json({ erro: "falha ao verificar a rotina" }, 500);
  }

  const problemas = ((data ?? []) as { problema: string }[]).map((linha) => linha.problema);
  if (problemas.length === 0) return json({ problemas });

  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const resultado = await enviarPeloResend({
    apiKey: variavel("RESEND_API_KEY"),
    de: montarRemetente(null, variavel("NEXIMOB_EMAIL_REMETENTE")),
    para: variavel("NEXIMOB_EMAIL_ALERTA"),
    assunto: `Neximob: problema na rotina de lembretes (${hoje})`,
    texto: `A verificação das 9h30 encontrou:\n\n${problemas.map((p) => `- ${p}`).join("\n")}`,
    chaveIdempotencia: `alerta-rotina-${hoje}`,
  });

  if (!resultado.ok) console.error(`alerta-rotina: e-mail de alerta não saiu (${resultado.erro})`);
  return json({ problemas, alerta_enviado: resultado.ok });
});
