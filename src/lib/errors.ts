interface PostgrestLikeError {
  code?: string;
  message?: string;
}

export const MENSAGEM_SESSAO_EXPIRADA =
  "Sua sessão expirou. Entre novamente — o que você já salvou está seguro.";

export function traduzirErroSupabase(
  err: unknown,
  fallback: string = "Não foi possível concluir a ação. Tente novamente em instantes.",
): string {
  if (!err || typeof err !== "object") return fallback;
  const { code, message } = err as PostgrestLikeError;

  switch (code) {
    case "23514": {
      if (message?.includes("dia_vencimento")) {
        return "Escolha um dia entre 1 e 28 para funcionar em todos os meses.";
      }
      if (message?.includes("telefone")) {
        return "Informe um telefone com DDD (10 ou 11 dígitos) ou deixe em branco.";
      }
      if (message?.includes("motivo_extra")) {
        return "Informe o motivo do serviço extra para continuar.";
      }
      if (message?.includes("forma")) {
        return "Informe a forma de pagamento para registrar a baixa.";
      }
      if (message?.includes("honorario") || message?.includes("valor")) {
        return "Informe um valor maior que zero.";
      }
      return "Verifique os dados informados e tente novamente.";
    }
    case "23505":
      return "Este registro já existe.";
    case "23503":
    case "P0002":
      return "Registro não encontrado.";
    case "42501":
      return MENSAGEM_SESSAO_EXPIRADA;
    case "22023":
      return message && message.trim().length > 0 && message.length < 180
        ? message
        : "Valor inválido para esta operação.";
    default:
      return fallback;
  }
}

export function traduzirErroLogin(err: unknown): string {
  if (err && typeof err === "object" && "message" in err) {
    const msg = String((err as { message?: unknown }).message ?? "");
    if (/email not confirmed/i.test(msg)) {
      return "Confirme seu e-mail pelo link enviado antes de entrar.";
    }
    if (/too many requests|rate limit/i.test(msg)) {
      return "Muitas tentativas em sequência. Aguarde alguns instantes e tente de novo.";
    }
  }
  // ADR-0008 item 9: mensagem neutra que não revela se o e-mail existe.
  return "E-mail ou senha incorretos.";
}
