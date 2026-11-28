"use server";

import { revalidatePath } from "next/cache";
import type { EnvioRow, FormaPagamento } from "@/lib/database.types";
import { traduzirErroSupabase } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  ajustarValorSchema,
  mapZodFieldErrors,
  registrarPagamentoSchema,
} from "@/lib/validation";
import { requireActionUser } from "@/server/auth/session";

export interface MensagemManualPreparada {
  cobrancaId: string;
  clienteNome: string;
  assunto: string;
  texto: string;
  cobrancasIncluidas: string[];
  telefone: string | null;
  email: string | null;
}

export async function marcarPagamentoAction(input: {
  cobrancaId: string;
  forma: FormaPagamento;
  data?: string;
}): Promise<ActionResult<{ cobrancaId: string }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const parsed = registrarPagamentoSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Dados de pagamento inválidos.", mapZodFieldErrors(parsed.error));
  }

  const { error } = await auth.supabase.rpc("registrar_pagamento", {
    p_cobranca_id: parsed.data.cobrancaId,
    p_forma: parsed.data.forma,
    ...(parsed.data.data ? { p_data: parsed.data.data } : {}),
  });

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível registrar o pagamento."));
  }

  revalidatePath("/");
  return ok({ cobrancaId: parsed.data.cobrancaId });
}

export async function desfazerPagamentoAction(
  cobrancaId: string,
): Promise<ActionResult<{ cobrancaId: string }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { error } = await auth.supabase.rpc("desfazer_pagamento", {
    p_cobranca_id: cobrancaId,
  });

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível desfazer o pagamento."));
  }

  revalidatePath("/");
  return ok({ cobrancaId });
}

export async function ajustarValorMesAction(input: {
  cobrancaId: string;
  extraRaw: string;
  motivo: string;
}): Promise<ActionResult<{ total: number }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const parsed = ajustarValorSchema.safeParse(input);
  if (!parsed.success) {
    return fail("Verifique o valor extra e o motivo.", mapZodFieldErrors(parsed.error));
  }

  const { data, error } = await auth.supabase.rpc("ajustar_valor_do_mes", {
    p_cobranca_id: parsed.data.cobrancaId,
    p_extra: parsed.data.extraRaw,
    p_motivo: parsed.data.extraRaw === 0 ? null : parsed.data.motivo,
  });

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível ajustar o valor deste mês."));
  }

  revalidatePath("/");
  return ok({ total: typeof data === "number" ? data : 0 });
}

export async function prepararCobrancaManualAction(input: {
  cobrancaId: string;
  clienteId: string;
  clienteNome: string;
}): Promise<ActionResult<MensagemManualPreparada>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const [msgRes, cliRes] = await Promise.all([
    auth.supabase.rpc("mensagem_para_cobrar", { p_cobranca_id: input.cobrancaId }),
    auth.supabase
      .from("clientes")
      .select("telefone, email")
      .eq("id", input.clienteId)
      .maybeSingle(),
  ]);

  if (msgRes.error) {
    return fail(traduzirErroSupabase(msgRes.error, "Não foi possível montar a mensagem."));
  }

  const primeira = msgRes.data?.[0];
  if (!primeira) {
    return fail("Nenhuma mensagem disponível para esta cobrança.");
  }

  return ok({
    cobrancaId: input.cobrancaId,
    clienteNome: input.clienteNome,
    assunto: primeira.assunto,
    texto: primeira.texto,
    cobrancasIncluidas: primeira.cobrancas ?? [],
    telefone: cliRes.data?.telefone ?? null,
    email: cliRes.data?.email ?? null,
  });
}

export async function registrarEnvioManualAction(
  cobrancaId: string,
): Promise<ActionResult<{ envioId: string }>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { data, error } = await auth.supabase.rpc("registrar_envio_manual", {
    p_cobranca_id: cobrancaId,
  });

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível registrar o envio manual."));
  }

  revalidatePath("/");
  return ok({ envioId: data ?? "" });
}

export async function buscarEnviosClienteAction(
  clienteId: string,
): Promise<ActionResult<EnvioRow[]>> {
  const auth = await requireActionUser();
  if (!auth.ok) return fail(auth.error);

  const { data, error } = await auth.supabase
    .from("envios")
    .select("*")
    .eq("cliente_id", clienteId)
    .order("criado_em", { ascending: false })
    .limit(25);

  if (error) {
    return fail(traduzirErroSupabase(error, "Não foi possível carregar o histórico de envios."));
  }

  return ok(data ?? []);
}
