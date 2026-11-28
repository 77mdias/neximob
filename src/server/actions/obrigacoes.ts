"use server";

import { revalidatePath } from "next/cache";
import type { ClienteDaObrigacaoRow } from "@/lib/database.types";
import { traduzirErroSupabase } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import { requireActionUser } from "@/server/auth/session";

export async function carregarClientesObrigacaoAction(
  obrigacaoId: string,
  mesIso: string,
): Promise<ActionResult<ClienteDaObrigacaoRow[]>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { data, error } = await auth.supabase.rpc("clientes_da_obrigacao", {
    p_obrigacao_id: obrigacaoId,
    p_mes: mesIso,
  });

  if (error) {
    return fail(
      traduzirErroSupabase(error, "Não foi possível carregar a lista de clientes desta guia."),
    );
  }

  return ok(data ?? []);
}

export async function alternarObrigacaoClienteAction(input: {
  obrigacaoId: string;
  clienteId: string;
  mesIso: string;
  feito: boolean;
}): Promise<ActionResult<{ feito: boolean }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { data, error } = await auth.supabase.rpc("marcar_obrigacao", {
    p_obrigacao_id: input.obrigacaoId,
    p_cliente_id: input.clienteId,
    p_mes: input.mesIso,
    p_feito: input.feito,
  });

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível atualizar a entrega."));
  }

  revalidatePath("/");
  return ok({ feito: Boolean(data) });
}
