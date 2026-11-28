import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { MENSAGEM_SESSAO_EXPIRADA } from "@/lib/errors";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireAuthenticatedUser(): Promise<User> {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/entrar");
  }
  return user;
}

export async function requireActionUser(): Promise<
  | { ok: true; user: User; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }
  | { ok: false; error: string }
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, error: MENSAGEM_SESSAO_EXPIRADA };
  }
  return { ok: true, user: data.user, supabase };
}
