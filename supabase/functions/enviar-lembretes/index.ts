// Etapa 2 da rotina diária (ADR-0005): envia os lembretes pendentes.
//
// Chamada pelo Supabase Cron a cada poucos minutos, das 9h às 20h de
// Brasília, com "Authorization: Bearer <NEXIMOB_SEGREDO_CRON>".
// Para cada envio reservado: confere se ainda deve sair, monta a mensagem no
// banco (montar_mensagem), envia pelo Resend e registra o resultado.
// Os logs trazem só contagens e ids, nunca dados pessoais (ADR-0003).

import { autorizadoPeloCron, json, variavel } from "../_shared/seguranca.ts";
import { enviarPeloResend } from "../_shared/email.ts";
import { ErroDaFila, processarFila } from "../_shared/fila.ts";
import { clienteAdmin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);
  if (!autorizadoPeloCron(req, variavel("NEXIMOB_SEGREDO_CRON"))) {
    return json({ erro: "não autorizado" }, 401);
  }

  const supabase = clienteAdmin();
  const apiKey = variavel("RESEND_API_KEY");

  try {
    const contagem = await processarFila({
      rpc: async (funcao, argumentos) => {
        const { data, error } = await supabase.rpc(funcao, argumentos);
        return { data, error };
      },
      enviarEmail: (email) => enviarPeloResend({ ...email, apiKey }),
      enderecoRemetente: variavel("NEXIMOB_EMAIL_REMETENTE"),
    });
    console.log(`enviar-lembretes: ${JSON.stringify(contagem)}`);
    return json(contagem);
  } catch (erro) {
    if (erro instanceof ErroDaFila) {
      console.error(`enviar-lembretes: ${erro.message}`);
      return json({ erro: "falha ao processar a fila" }, 500);
    }
    throw erro;
  }
});
