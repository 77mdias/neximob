import "server-only";

export interface PublicSupabaseEnv {
  url: string;
  anonKey: string;
  siteUrl: string;
}

export function assertNoServiceRoleKeyInWebEnv(): void {
  const forbidden = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (forbidden && forbidden.trim().length > 0) {
    throw new Error(
      "Configuração inválida: SUPABASE_SERVICE_ROLE_KEY não deve ser exposta no app web (ADR-0004).",
    );
  }
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  assertNoServiceRoleKeyInWebEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://127.0.0.1:3000";

  if (!url || !anonKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.",
    );
  }

  return { url, anonKey, siteUrl };
}
