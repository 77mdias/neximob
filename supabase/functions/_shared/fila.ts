// Laço da etapa de envio (ADR-0005), separado da Edge Function para poder ser
// testado com o banco e o Resend simulados.

import { type EmailParaEnviar, montarRemetente, type ResultadoEnvio } from "./email.ts";

export interface RespostaRpc {
  data: unknown;
  error: { code?: string; message?: string } | null;
}

export interface DependenciasDaFila {
  rpc: (funcao: string, argumentos?: Record<string, unknown>) => Promise<RespostaRpc>;
  enviarEmail: (email: Omit<EmailParaEnviar, "apiKey">) => Promise<ResultadoEnvio>;
  enderecoRemetente: string;
  tamanhoDoLote?: number;
  tempoMaximoMs?: number;
  agoraMs?: () => number;
  registrarLog?: (mensagem: string) => void;
}

export interface Contagem {
  enviados: number;
  falhas: number;
  cancelados: number;
  novas_tentativas: number;
}

interface MensagemDoEnvio {
  envio_id: string;
  canal: "email" | "whatsapp" | "manual";
  cancelar: boolean;
  motivo: string | null;
  destinatario_email: string | null;
  contador_nome: string | null;
  contador_email: string | null;
  assunto: string | null;
  texto: string | null;
  cobrancas: string[] | null;
}

type Resultado = "enviado" | "falha_temporaria" | "falha_definitiva" | "cancelado";

export class ErroDaFila extends Error {}

export async function processarFila(deps: DependenciasDaFila): Promise<Contagem> {
  const tamanhoDoLote = deps.tamanhoDoLote ?? 25;
  const tempoMaximoMs = deps.tempoMaximoMs ?? 40_000;
  const agoraMs = deps.agoraMs ?? Date.now;
  const log = deps.registrarLog ?? ((m: string) => console.error(m));
  const inicio = agoraMs();
  const contagem: Contagem = { enviados: 0, falhas: 0, cancelados: 0, novas_tentativas: 0 };

  async function registrar(
    envioId: string,
    resultado: Resultado,
    extras: { provedorId?: string; erro?: string | null; cobrancas?: string[] | null } = {},
  ): Promise<void> {
    const { error } = await deps.rpc("rotina_registrar_resultado", {
      p_envio_id: envioId,
      p_resultado: resultado,
      p_provedor_mensagem_id: extras.provedorId ?? null,
      p_erro: extras.erro ?? null,
      p_cobrancas: extras.cobrancas ?? null,
    });
    if (error) log(`envio ${envioId}: erro ao registrar resultado (${error.code ?? "sem código"})`);
  }

  while (agoraMs() - inicio < tempoMaximoMs) {
    const reserva = await deps.rpc("rotina_reservar_envios", { p_limite: tamanhoDoLote });
    if (reserva.error) {
      throw new ErroDaFila(`erro ao reservar envios (${reserva.error.code ?? "sem código"})`);
    }
    const lote = (reserva.data ?? []) as string[];
    if (lote.length === 0) break;

    for (const envioId of lote) {
      const resposta = await deps.rpc("rotina_mensagem_do_envio", { p_envio_id: envioId });
      const mensagem = (resposta.data as MensagemDoEnvio[] | null)?.[0];

      if (resposta.error || !mensagem) {
        log(`envio ${envioId}: erro ao montar a mensagem (${resposta.error?.code ?? "vazio"})`);
        await registrar(envioId, "falha_temporaria", { erro: "erro ao montar a mensagem" });
        contagem.novas_tentativas++;
        continue;
      }

      if (mensagem.cancelar) {
        await registrar(envioId, "cancelado", { erro: mensagem.motivo });
        contagem.cancelados++;
        continue;
      }

      if (mensagem.canal !== "email" || !mensagem.destinatario_email) {
        await registrar(envioId, "falha_definitiva", { erro: "canal ainda não suportado" });
        contagem.falhas++;
        continue;
      }

      const resultado = await deps.enviarEmail({
        de: montarRemetente(mensagem.contador_nome, deps.enderecoRemetente),
        para: mensagem.destinatario_email,
        responderPara: mensagem.contador_email,
        assunto: mensagem.assunto ?? "Lembrete de honorário",
        texto: mensagem.texto ?? "",
        chaveIdempotencia: `envio-${envioId}`,
      });

      if (resultado.ok) {
        await registrar(envioId, "enviado", { provedorId: resultado.id, cobrancas: mensagem.cobrancas });
        contagem.enviados++;
      } else if (resultado.temporaria) {
        await registrar(envioId, "falha_temporaria", { erro: resultado.erro });
        contagem.novas_tentativas++;
      } else {
        await registrar(envioId, "falha_definitiva", { erro: resultado.erro });
        contagem.falhas++;
      }
    }
  }

  return contagem;
}
