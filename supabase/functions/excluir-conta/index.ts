// RF-44: o contador exclui a própria conta. Apagar o usuário do Supabase Auth
// apaga em cascata o perfil, os clientes, as cobranças, os envios e as
// obrigações (ADR-0004). Só a chave secreta pode apagar usuários, por isso a
// ação fica numa Edge Function, e não no navegador.
//
// Chamada pelo app com a sessão do contador (verify_jwt ligado) e o corpo
// {"confirmacao": "EXCLUIR"}.

import { cabecalhosCors, origensPermitidas } from "../_shared/cors.ts";
import { json } from "../_shared/seguranca.ts";
import { clienteAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const cors = cabecalhosCors(
    req.headers.get("origin"),
    origensPermitidas(Deno.env.get("NEXIMOB_ORIGENS_PERMITIDAS")),
  );

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405, cors);

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ erro: "não autenticado" }, 401, cors);

  let corpo: { confirmacao?: unknown } = {};
  try {
    corpo = await req.json();
  } catch {
    // corpo vazio ou inválido
  }
  if (corpo.confirmacao !== "EXCLUIR") {
    return json({ erro: 'envie {"confirmacao": "EXCLUIR"} para confirmar' }, 400, cors);
  }

  const supabase = clienteAdmin();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return json({ erro: "sessão inválida" }, 401, cors);

  const { error: erroExclusao } = await supabase.auth.admin.deleteUser(data.user.id);
  if (erroExclusao) {
    console.error(`excluir-conta: falha ao excluir (${erroExclusao.status ?? "sem status"})`);
    return json({ erro: "não foi possível excluir a conta" }, 500, cors);
  }

  return json({ excluida: true }, 200, cors);
});
