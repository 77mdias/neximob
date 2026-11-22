// Verificação da assinatura dos avisos (webhooks) do Resend, que usa o padrão
// Svix: HMAC-SHA256 de "{svix-id}.{svix-timestamp}.{corpo}" com o segredo
// "whsec_...", em base64. O cabeçalho svix-signature pode trazer várias
// assinaturas separadas por espaço, no formato "v1,<base64>".

import { iguaisSemVazarTempo } from "./seguranca.ts";

export interface CabecalhosSvix {
  id: string | null;
  timestamp: string | null;
  assinatura: string | null;
}

/** Tolerância padrão para o horário do aviso: 5 minutos (evita reenvio de avisos antigos). */
export const TOLERANCIA_SEGUNDOS = 300;

function base64ParaBuffer(base64: string): ArrayBuffer {
  const binario = atob(base64);
  const buffer = new ArrayBuffer(binario.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return buffer;
}

function bytesParaBase64(bytes: Uint8Array): string {
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario);
}

/** Calcula a assinatura v1 (base64) de um aviso. Usado também nos testes. */
export async function assinarSvix(
  segredo: string,
  id: string,
  timestamp: string,
  corpo: string,
): Promise<string> {
  const chave = base64ParaBuffer(segredo.startsWith("whsec_") ? segredo.slice(6) : segredo);
  const chaveHmac = await crypto.subtle.importKey(
    "raw",
    chave,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const assinatura = await crypto.subtle.sign(
    "HMAC",
    chaveHmac,
    new TextEncoder().encode(`${id}.${timestamp}.${corpo}`),
  );
  return bytesParaBase64(new Uint8Array(assinatura));
}

/** Confere se o aviso veio do Resend e é recente. */
export async function verificarAssinaturaSvix(
  corpo: string,
  cabecalhos: CabecalhosSvix,
  segredo: string,
  agoraSegundos: number = Math.floor(Date.now() / 1000),
  toleranciaSegundos: number = TOLERANCIA_SEGUNDOS,
): Promise<boolean> {
  const { id, timestamp, assinatura } = cabecalhos;
  if (!id || !timestamp || !assinatura || !segredo) return false;

  const horario = Number(timestamp);
  if (!Number.isFinite(horario) || Math.abs(agoraSegundos - horario) > toleranciaSegundos) {
    return false;
  }

  let esperada: string;
  try {
    esperada = await assinarSvix(segredo, id, timestamp, corpo);
  } catch {
    return false;
  }

  return assinatura.split(" ").some((parte) => {
    const [versao, valor] = parte.split(",");
    return versao === "v1" && valor !== undefined && iguaisSemVazarTempo(valor, esperada);
  });
}
