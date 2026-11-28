"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Json } from "@/lib/database.types";
import { MENSAGEM_SESSAO_EXPIRADA, traduzirErroSupabase } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import { mapZodFieldErrors, salvarPerfilSchema } from "@/lib/validation";
import { requireActionUser } from "@/server/auth/session";
import { getPublicSupabaseEnv } from "@/server/env";

export async function salvarPerfilAction(input: {
  nome: string;
  chavePix: string;
}): Promise<ActionResult<{ nome: string; chavePix: string | null }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const parsed = salvarPerfilSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique os dados da conta.", mapZodFieldErrors(parsed.error));
  }

  const { error } = await auth.supabase
    .from("contadores")
    .update({
      nome: parsed.data.nome,
      chave_pix: parsed.data.chavePix,
    })
    .eq("id", auth.user.id);

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível salvar os dados do escritório."));
  }

  revalidatePath("/");
  revalidatePath("/primeiros-passos");
  return ok({
    nome: parsed.data.nome,
    chavePix: parsed.data.chavePix,
  });
}

export async function exportarMeusDadosAction(): Promise<ActionResult<Json>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { data, error } = await auth.supabase.rpc("exportar_meus_dados");
  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível exportar seus dados agora."));
  }

  return ok(data);
}

export async function excluirContaAction(confirmacao: string): Promise<ActionResult<void>> {
  if (confirmacao.trim() !== "EXCLUIR") {
    return fail('Digite "EXCLUIR" em maiúsculas para confirmar a exclusão permanente.');
  }

  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const {
    data: { session },
  } = await auth.supabase.auth.getSession();

  if (!session?.access_token) {
    return fail(MENSAGEM_SESSAO_EXPIRADA);
  }

  const { url, anonKey } = getPublicSupabaseEnv();

  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/excluir-conta`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: anonKey,
      },
      body: JSON.stringify({ confirmacao: "EXCLUIR" }),
    });
  } catch {
    return fail("Falha ao se comunicar com o serviço de exclusão. Tente novamente.");
  }

  if (!response.ok) {
    return fail("Não foi possível concluir a exclusão da conta agora. Tente novamente.");
  }

  await auth.supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/entrar?conta=excluida");
}
