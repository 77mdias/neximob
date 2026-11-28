"use server";

import { revalidatePath } from "next/cache";
import type { ReguaRow } from "@/lib/database.types";
import { traduzirErroSupabase } from "@/lib/errors";
import { detectarCamposDesconhecidos } from "@/lib/regua-vars";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  mapZodFieldErrors,
  salvarPassoReguaSchema,
  salvarPendenciaSchema,
} from "@/lib/validation";
import { requireActionUser } from "@/server/auth/session";

export async function salvarPassoReguaAction(input: {
  id: string;
  ativo: boolean;
  texto: string;
}): Promise<ActionResult<{ passo: ReguaRow; camposDesconhecidos: string[] }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const parsed = salvarPassoReguaSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique o texto do lembrete.", mapZodFieldErrors(parsed.error));
  }

  const { data: passo, error } = await auth.supabase
    .from("regua")
    .update({
      ativo: parsed.data.ativo,
      texto: parsed.data.texto,
    })
    .eq("id", parsed.data.id)
    .select("*")
    .single();

  if (error || !passo) {
    return fail(traduzirErroSupabase(error, "Não foi possível salvar este passo da régua."));
  }

  const { data: desconhecidosRpc } = await auth.supabase.rpc("campos_desconhecidos", {
    p_texto: parsed.data.texto,
  });

  const camposDesconhecidos = Array.isArray(desconhecidosRpc)
    ? desconhecidosRpc
    : detectarCamposDesconhecidos(parsed.data.texto);

  revalidatePath("/");
  return ok({ passo, camposDesconhecidos });
}

export async function restaurarPassoReguaAction(
  reguaId: string,
): Promise<ActionResult<{ texto: string }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { data, error } = await auth.supabase.rpc("restaurar_texto_padrao", {
    p_regua_id: reguaId,
  });

  if (error || typeof data !== "string") {
    return fail(traduzirErroSupabase(error, "Não foi possível restaurar o texto padrão."));
  }

  revalidatePath("/");
  return ok({ texto: data });
}

export async function salvarTextoPendenciaAction(input: {
  textoPendencia: string;
}): Promise<ActionResult<{ textoPendencia: string; camposDesconhecidos: string[] }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const parsed = salvarPendenciaSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique o texto de pendência.", mapZodFieldErrors(parsed.error));
  }

  const { error } = await auth.supabase
    .from("contadores")
    .update({ texto_pendencia: parsed.data.textoPendencia })
    .eq("id", auth.user.id);

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível salvar a mensagem de pendência."));
  }

  const { data: desconhecidosRpc } = await auth.supabase.rpc("campos_desconhecidos", {
    p_texto: parsed.data.textoPendencia,
  });

  const camposDesconhecidos = Array.isArray(desconhecidosRpc)
    ? desconhecidosRpc
    : detectarCamposDesconhecidos(parsed.data.textoPendencia);

  revalidatePath("/");
  return ok({
    textoPendencia: parsed.data.textoPendencia,
    camposDesconhecidos,
  });
}

export async function restaurarTextoPendenciaAction(): Promise<
  ActionResult<{ textoPendencia: string }>
> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { data, error } = await auth.supabase.rpc("restaurar_texto_pendencia");

  if (error || typeof data !== "string") {
    return fail(traduzirErroSupabase(error, "Não foi possível restaurar o texto padrão."));
  }

  revalidatePath("/");
  return ok({ textoPendencia: data });
}
