// Segredos e autenticação das Edge Functions do Neximob.

/** Lê uma variável de ambiente obrigatória. */
export function variavel(nome: string): string {
  const valor = Deno.env.get(nome);
  if (!valor) {
    throw new Error(`variável de ambiente ausente: ${nome}`);
  }
  return valor;
}

/** Compara dois textos sem revelar, pelo tempo de resposta, onde eles diferem. */
export function iguaisSemVazarTempo(a: string, b: string): boolean {
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  let diferenca = bytesA.length ^ bytesB.length;
  const tamanho = Math.max(bytesA.length, bytesB.length);
  for (let i = 0; i < tamanho; i++) {
    diferenca |= (bytesA[i] ?? 0) ^ (bytesB[i] ?? 0);
  }
  return diferenca === 0;
}

/**
 * Confere o segredo que o Supabase Cron manda no cabeçalho Authorization
 * (ADR-0005). As funções chamadas pelo Cron não usam o JWT do Supabase.
 */
export function autorizadoPeloCron(req: Request, segredo: string): boolean {
  const cabecalho = req.headers.get("authorization") ?? "";
  return segredo.length > 0 && iguaisSemVazarTempo(cabecalho, `Bearer ${segredo}`);
}

/** Resposta JSON com o status informado. */
export function json(corpo: unknown, status = 200, cabecalhos: HeadersInit = {}): Response {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cabecalhos },
  });
}
