// Avisos do Resend (ADR-0007): entregue, devolvido, marcado como spam, falhou.
//
// O Resend assina cada aviso no padrão Svix. Aviso sem assinatura válida é
// recusado com 401. Aviso válido de um e-mail desconhecido recebe 200, para o
// Resend não repetir. Erro do banco devolve 500, e o Resend tenta de novo.

import { json, variavel } from "../_shared/seguranca.ts";
import { verificarAssinaturaSvix } from "../_shared/svix.ts";
import { clienteAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);

  const corpo = await req.text();
  const valido = await verificarAssinaturaSvix(
    corpo,
    {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      assinatura: req.headers.get("svix-signature"),
    },
    variavel("RESEND_WEBHOOK_SECRET"),
  );
  if (!valido) return json({ erro: "assinatura inválida" }, 401);

  let evento: { type?: unknown; data?: { email_id?: unknown } };
  try {
    evento = JSON.parse(corpo);
  } catch {
    return json({ erro: "corpo inválido" }, 400);
  }

  const tipo = evento?.type;
  const emailId = evento?.data?.email_id;
  if (typeof tipo !== "string" || typeof emailId !== "string") {
    return json({ ignorado: true });
  }

  const { data, error } = await clienteAdmin().rpc("rotina_registrar_evento_email", {
    p_provedor_mensagem_id: emailId,
    p_evento: tipo,
  });
  if (error) {
    console.error(`avisos-email: erro ao registrar ${tipo} (${error.code})`);
    return json({ erro: "falha ao registrar" }, 500);
  }

  return json({ evento: tipo, conhecido: data === true });
});
