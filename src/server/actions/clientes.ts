"use server";

import { revalidatePath } from "next/cache";
import type { CanalEnvio, ClienteRow, TipoCliente } from "@/lib/database.types";
import { cobrancaInicioPadrao, mesAtualBrasilia } from "@/lib/dates";
import { traduzirErroSupabase } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import { clienteFormSchema, mapZodFieldErrors } from "@/lib/validation";
import { requireActionUser } from "@/server/auth/session";

export interface SalvarClienteInput {
  clienteId?: string;
  mesAtualVisualizado?: string;
  nome: string;
  tipo: TipoCliente;
  honorarioRaw: string;
  diaVencimento: number;
  cobrancaInicio?: string;
  email: string;
  telefone: string;
  canais: Array<Exclude<CanalEnvio, "manual">>;
}

export async function buscarClienteParaEdicaoAction(
  clienteId: string,
): Promise<ActionResult<ClienteRow>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { data, error } = await auth.supabase
    .from("clientes")
    .select("*")
    .eq("id", clienteId)
    .maybeSingle();

  if (error || !data) {
    return fail(traduzirErroSupabase(error, "Não foi possível carregar os dados do cliente."));
  }

  return ok(data);
}

export async function salvarClienteAction(
  input: SalvarClienteInput,
): Promise<ActionResult<{ cliente: ClienteRow }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const parsed = clienteFormSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique os campos do cliente.", mapZodFieldErrors(parsed.error));
  }

  const dados = parsed.data;
  const emailNorm = dados.email.trim() || null;
  const telNorm = dados.telefone.trim() || null;

  if (input.clienteId) {
    const { data, error } = await auth.supabase
      .from("clientes")
      .update({
        nome: dados.nome,
        tipo: dados.tipo,
        honorario: dados.honorarioRaw,
        dia_vencimento: dados.diaVencimento,
        email: emailNorm,
        telefone: telNorm,
        canais: dados.canais,
      })
      .eq("id", input.clienteId)
      .select("*")
      .single();

    if (error || !data) {
      return fail(traduzirErroSupabase(error, "Não foi possível salvar as alterações do cliente."));
    }

    const mesCorrente = mesAtualBrasilia();
    if (input.mesAtualVisualizado && input.mesAtualVisualizado >= mesCorrente) {
      await auth.supabase.rpc("garantir_cobrancas", { p_mes: input.mesAtualVisualizado });
    }
    revalidatePath("/");
    return ok({ cliente: data });
  }

  const inicio =
    dados.cobrancaInicio ?? cobrancaInicioPadrao(dados.diaVencimento).esteMes;

  const { data, error } = await auth.supabase
    .from("clientes")
    .insert({
      contador_id: auth.user.id,
      nome: dados.nome,
      tipo: dados.tipo,
      honorario: dados.honorarioRaw,
      dia_vencimento: dados.diaVencimento,
      cobranca_inicio: inicio,
      email: emailNorm,
      telefone: telNorm,
      canais: dados.canais,
    })
    .select("*")
    .single();

  if (error || !data) {
    return fail(traduzirErroSupabase(error, "Não foi possível cadastrar o cliente."));
  }

  const mesCorrente = mesAtualBrasilia();
  const mesGarantir =
    input.mesAtualVisualizado && input.mesAtualVisualizado >= mesCorrente
      ? input.mesAtualVisualizado
      : inicio;
  await auth.supabase.rpc("garantir_cobrancas", { p_mes: mesGarantir });
  revalidatePath("/");
  revalidatePath("/primeiros-passos");
  return ok({ cliente: data });
}

export async function arquivarClienteAction(
  clienteId: string,
): Promise<ActionResult<{ clienteId: string }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { error } = await auth.supabase
    .from("clientes")
    .update({ ativo: false })
    .eq("id", clienteId);

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível inativar este cliente."));
  }

  revalidatePath("/");
  return ok({ clienteId });
}

export async function reativarClienteAction(
  clienteId: string,
  mesAtualVisualizado?: string,
): Promise<ActionResult<{ clienteId: string }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { error } = await auth.supabase
    .from("clientes")
    .update({ ativo: true })
    .eq("id", clienteId);

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível reativar este cliente."));
  }

  const mesCorrente = mesAtualBrasilia();
  if (mesAtualVisualizado && mesAtualVisualizado >= mesCorrente) {
    await auth.supabase.rpc("garantir_cobrancas", { p_mes: mesAtualVisualizado });
  }
  revalidatePath("/");
  return ok({ clienteId });
}

export async function excluirClienteAction(
  clienteId: string,
): Promise<ActionResult<{ clienteId: string }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { error } = await auth.supabase
    .from("clientes")
    .delete()
    .eq("id", clienteId);

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível excluir este cliente."));
  }

  revalidatePath("/");
  return ok({ clienteId });
}
