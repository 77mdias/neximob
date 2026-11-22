// CORS para as funções chamadas pelo navegador (por exemplo, excluir-conta).
// NEXIMOB_ORIGENS_PERMITIDAS: lista separada por vírgula, ex.:
// "http://127.0.0.1:3000,https://app.exemplo.com.br"

export function origensPermitidas(valor: string | undefined | null): string[] {
  return (valor ?? "")
    .split(",")
    .map((origem) => origem.trim())
    .filter((origem) => origem.length > 0);
}

export function cabecalhosCors(origem: string | null, permitidas: string[]): Record<string, string> {
  if (!origem || !permitidas.includes(origem)) return { "Vary": "Origin" };
  return {
    "Access-Control-Allow-Origin": origem,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
