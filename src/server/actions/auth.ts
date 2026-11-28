"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { traduzirErroLogin } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  criarContaSchema,
  esqueciSenhaSchema,
  loginSchema,
  mapZodFieldErrors,
  novaSenhaSchema,
  VERSAO_TERMOS_ATUAL,
} from "@/lib/validation";
import { getPublicSupabaseEnv } from "@/server/env";
import { createSupabaseServerClient } from "@/server/supabase/server";

export async function entrarAction(input: {
  email: string;
  password: string;
}): Promise<ActionResult<void>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique os dados informados.", mapZodFieldErrors(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return fail(traduzirErroLogin(error));
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function criarContaAction(input: {
  nome: string;
  email: string;
  password: string;
  aceitouTermos: boolean;
}): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  const parsed = criarContaSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique os dados informados.", mapZodFieldErrors(parsed.error));
  }

  const { siteUrl } = getPublicSupabaseEnv();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/primeiros-passos`,
      data: {
        nome: parsed.data.nome,
        termos_versao_pendente: VERSAO_TERMOS_ATUAL,
      },
    },
  });

  if (error) {
    if (/rate limit|too many/i.test(error.message)) {
      return fail("Muitas tentativas em sequência. Aguarde alguns instantes e tente de novo.");
    }
    return fail("Não foi possível criar a conta agora. Confira os dados e tente novamente.");
  }

  if (data.session) {
    await supabase.rpc("aceitar_termos", { p_versao: VERSAO_TERMOS_ATUAL });
    revalidatePath("/", "layout");
    redirect("/primeiros-passos");
  }

  redirect(`/confirmar-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function reenviarConfirmacaoAction(
  email: string,
): Promise<ActionResult<void>> {
  const parsed = esqueciSenhaSchema.safeParse({ email });
  if (!parsed.success) {
    return fail("Informe um e-mail válido.");
  }

  const { siteUrl } = getPublicSupabaseEnv();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/primeiros-passos`,
    },
  });

  if (error && /rate limit|too many/i.test(error.message)) {
    return fail("Aguarde alguns instantes antes de solicitar um novo e-mail.");
  }

  return ok(undefined);
}

export async function solicitarRecuperacaoAction(input: {
  email: string;
}): Promise<ActionResult<void>> {
  const parsed = esqueciSenhaSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique o e-mail informado.", mapZodFieldErrors(parsed.error));
  }

  const { siteUrl } = getPublicSupabaseEnv();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/nova-senha`,
  });

  if (error && /rate limit|too many/i.test(error.message)) {
    return fail("Muitas tentativas em sequência. Aguarde alguns instantes e tente de novo.");
  }

  return ok(undefined);
}

export async function redefinirSenhaAction(input: {
  password: string;
  confirmPassword: string;
}): Promise<ActionResult<void>> {
  const parsed = novaSenhaSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique a nova senha.", mapZodFieldErrors(parsed.error));
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail(
      "O link de recuperação expirou ou já foi usado. Solicite um novo link em Esqueci minha senha.",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    if (/same password/i.test(error.message)) {
      return fail("Escolha uma senha diferente da atual.");
    }
    return fail("Não foi possível atualizar sua senha agora. Tente novamente.");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function sairAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar");
}
