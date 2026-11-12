// Envio de e-mail pelo Resend (ADR-0007).

export const URL_API_RESEND = "https://api.resend.com/emails";

/** Escapa um texto para ser colocado dentro de HTML. */
export function escaparHtml(texto: string): string {
  return texto
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Converte o texto da mensagem em HTML simples: parágrafos e quebras de linha. */
export function textoParaHtml(texto: string): string {
  const paragrafos = texto
    .trim()
    .split(/\n{2,}/)
    .map((p) => `<p>${escaparHtml(p).replaceAll("\n", "<br>")}</p>`)
    .join("\n");
  return `<!doctype html><html lang="pt-BR"><body style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.5; color: #1f2937;">\n${paragrafos}\n</body></html>`;
}

/**
 * Remetente com o nome do contador, no domínio da plataforma:
 * "Maria Contabilidade via Neximob" <lembretes@...>
 */
export function montarRemetente(nomeContador: string | null | undefined, endereco: string): string {
  const nome = (nomeContador ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/["<>\\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
  return nome ? `"${nome} via Neximob" <${endereco}>` : `Neximob <${endereco}>`;
}

/** Falhas que valem nova tentativa: limite de envio, tempo esgotado e erro do servidor. */
export function falhaTemporaria(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

export interface EmailParaEnviar {
  apiKey: string;
  de: string;
  para: string;
  responderPara?: string | null;
  assunto: string;
  texto: string;
  chaveIdempotencia: string;
}

export type ResultadoEnvio =
  | { ok: true; id: string }
  | { ok: false; temporaria: boolean; erro: string };

/** Envia um e-mail pela API do Resend, com chave de idempotência (RN-13). */
export async function enviarPeloResend(
  email: EmailParaEnviar,
  fetchFn: typeof fetch = fetch,
): Promise<ResultadoEnvio> {
  let resposta: Response;
  try {
    resposta = await fetchFn(URL_API_RESEND, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${email.apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": email.chaveIdempotencia,
      },
      body: JSON.stringify({
        from: email.de,
        to: [email.para],
        ...(email.responderPara ? { reply_to: email.responderPara } : {}),
        subject: email.assunto,
        text: email.texto,
        html: textoParaHtml(email.texto),
      }),
    });
  } catch (erro) {
    return { ok: false, temporaria: true, erro: `falha de rede: ${String(erro).slice(0, 200)}` };
  }

  let corpo: Record<string, unknown> = {};
  try {
    corpo = await resposta.json();
  } catch {
    // resposta sem JSON
  }

  if (resposta.ok && typeof corpo.id === "string") {
    return { ok: true, id: corpo.id };
  }

  const mensagem = typeof corpo.message === "string" ? corpo.message : `HTTP ${resposta.status}`;
  return {
    ok: false,
    temporaria: falhaTemporaria(resposta.status),
    erro: mensagem.slice(0, 300),
  };
}
