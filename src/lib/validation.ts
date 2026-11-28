import { z } from "zod";
import type { CanalEnvio, FormaPagamento, TipoCliente } from "./database.types";
import { parseBRLInput } from "./format";

export const VERSAO_TERMOS_ATUAL = "2026-11-27";

export function normalizarTelefoneBR(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return `+${digits}`;
  }
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }
  return trimmed;
}

export function formatarTelefoneExibicao(telefone: string | null): string {
  if (!telefone) return "";
  const match = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(telefone);
  if (!match) return telefone;
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

const emailSchema = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
    "Informe um e-mail válido.",
  );

const telefoneSchema = z
  .string()
  .trim()
  .transform((v) => normalizarTelefoneBR(v) ?? "")
  .refine(
    (v) => v === "" || /^\+55[0-9]{10,11}$/.test(v),
    "Informe um telefone com DDD (10 ou 11 dígitos) ou deixe em branco.",
  );

export const clienteFormSchema = z
  .object({
    nome: z
      .string()
      .trim()
      .min(1, "Informe o nome do cliente para continuar.")
      .max(200, "O nome pode ter no máximo 200 caracteres."),
    tipo: z.enum(["MEI", "SIMPLES", "PF"] satisfies [TipoCliente, ...TipoCliente[]]),
    honorarioRaw: z
      .string()
      .trim()
      .min(1, "Informe o honorário mensal para continuar.")
      .transform((v) => parseBRLInput(v))
      .refine((v): v is number => v !== null && v > 0, "Informe um valor maior que zero."),
    diaVencimento: z.coerce
      .number()
      .int("Escolha um dia entre 1 e 28 para funcionar em todos os meses.")
      .min(1, "Escolha um dia entre 1 e 28 para funcionar em todos os meses.")
      .max(28, "Escolha um dia entre 1 e 28 para funcionar em todos os meses."),
    cobrancaInicio: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])-01$/, "Mês de início inválido.")
      .optional(),
    email: emailSchema,
    telefone: telefoneSchema,
    canais: z
      .array(z.enum(["email", "whatsapp"] satisfies Exclude<CanalEnvio, "manual">[]))
      .default(["email", "whatsapp"]),
  });

export const ajustarValorSchema = z
  .object({
    cobrancaId: z.string().uuid("Cobrança inválida."),
    extraRaw: z
      .string()
      .trim()
      .transform((v) => (v === "" ? 0 : parseBRLInput(v)))
      .refine(
        (v): v is number => v !== null && v >= 0,
        "Informe um valor válido maior ou igual a zero.",
      ),
    motivo: z.string().trim().max(300, "O motivo pode ter no máximo 300 caracteres."),
  })
  .refine((data) => data.extraRaw === 0 || data.motivo.length > 0, {
    message: "Informe o motivo do serviço extra para continuar.",
    path: ["motivo"],
  });

export const registrarPagamentoSchema = z.object({
  cobrancaId: z.string().uuid("Cobrança inválida."),
  forma: z.enum(["pix", "transferencia", "dinheiro", "outro"] satisfies [FormaPagamento, ...FormaPagamento[]]),
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
    .optional(),
});

export const salvarPassoReguaSchema = z.object({
  id: z.string().uuid("Passo inválido."),
  ativo: z.boolean(),
  texto: z
    .string()
    .trim()
    .min(1, "Informe o texto da mensagem para continuar.")
    .max(2000, "A mensagem pode ter no máximo 2.000 caracteres."),
});

export const salvarPendenciaSchema = z.object({
  textoPendencia: z
    .string()
    .trim()
    .min(1, "Informe o texto de pendência para continuar.")
    .max(2000, "O texto de pendência pode ter no máximo 2.000 caracteres."),
});

export const salvarPerfilSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe seu nome ou do escritório para continuar.")
    .max(200, "O nome pode ter no máximo 200 caracteres."),
  chavePix: z
    .string()
    .trim()
    .max(140, "A chave Pix pode ter no máximo 140 caracteres.")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail para continuar.").email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha para continuar."),
});

export const criarContaSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(1, "Informe seu nome para continuar.")
    .max(200, "O nome pode ter no máximo 200 caracteres."),
  email: z.string().trim().min(1, "Informe o e-mail para continuar.").email("Informe um e-mail válido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  aceitouTermos: z
    .boolean()
    .refine(
      (v) => v === true,
      "Você precisa aceitar os Termos de Uso e a Política de Privacidade para criar sua conta.",
    ),
});

export const esqueciSenhaSchema = z.object({
  email: z.string().trim().min(1, "Informe o e-mail para continuar.").email("Informe um e-mail válido."),
});

export const novaSenhaSchema = z
  .object({
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirmPassword: z.string().min(1, "Confirme a nova senha para continuar."),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export function mapZodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
