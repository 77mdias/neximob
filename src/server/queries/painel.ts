import "server-only";
import type {
  CobrancaDoMesRow,
  ContadorRow,
  ObrigacaoDoMesRow,
  ReguaRow,
  ResumoDoMesRow,
} from "@/lib/database.types";
import { hojeEmBrasilia, mesAtualBrasilia, normalizarMesReferencia } from "@/lib/dates";
import { requireAuthenticatedUser } from "@/server/auth/session";
import { createSupabaseServerClient } from "@/server/supabase/server";

export interface PainelMensalData {
  mesIso: string;
  hojeIso: string;
  emailUsuario: string;
  contador: ContadorRow;
  resumo: ResumoDoMesRow;
  cobrancas: CobrancaDoMesRow[];
  obrigacoes: ObrigacaoDoMesRow[];
  proximosPrazos: ObrigacaoDoMesRow[];
  passosRegua: ReguaRow[];
  qtdClientesAtivos: number;
}

const RESUMO_VAZIO: ResumoDoMesRow = {
  mes: "",
  recebido: 0,
  a_receber: 0,
  percentual_recebido: 0,
  em_aberto_meses_anteriores: 0,
  clientes_em_atraso: 0,
  guias_a_fazer: 0,
};

export async function carregarPainelDoMes(mesParam?: string | null): Promise<PainelMensalData> {
  const user = await requireAuthenticatedUser();
  const supabase = await createSupabaseServerClient();

  const hojeIso = hojeEmBrasilia();
  const mesIso = normalizarMesReferencia(mesParam);

  let { data: contador } = await supabase
    .from("contadores")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const termosPendente = user.user_metadata?.termos_versao_pendente;
  if (
    contador &&
    !contador.termos_aceitos_em &&
    typeof termosPendente === "string" &&
    termosPendente.trim().length > 0
  ) {
    await supabase.rpc("aceitar_termos", { p_versao: termosPendente.trim() });
    const { data: atualizado } = await supabase
      .from("contadores")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (atualizado) {
      contador = atualizado;
    }
  }

  // RF-02: garante as cobranças ao abrir o mês corrente ou um mês futuro (sem gerar retroativos em meses passados).
  const mesAtualIso = mesAtualBrasilia();
  if (mesIso >= mesAtualIso) {
    await supabase.rpc("garantir_cobrancas", { p_mes: mesIso });
  }

  const [resumoRes, cobrancasRes, obrigacoesRes, prazosRes, reguaRes, ativosRes] =
    await Promise.all([
      supabase.rpc("resumo_do_mes", { p_mes: mesIso }),
      supabase.rpc("cobrancas_do_mes", { p_mes: mesIso, p_filtro: "todos" }),
      supabase.rpc("obrigacoes_do_mes", { p_mes: mesIso }),
      supabase.rpc("proximos_prazos", { p_a_partir: hojeIso, p_meses: 12 }),
      supabase.from("regua").select("*").order("dias", { ascending: true }),
      supabase
        .from("clientes")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true),
    ]);

  if (resumoRes.error) {
    throw new Error(`Erro ao carregar resumo do mês: ${resumoRes.error.message}`);
  }
  if (cobrancasRes.error) {
    throw new Error(`Erro ao carregar cobranças do mês: ${cobrancasRes.error.message}`);
  }
  if (obrigacoesRes.error) {
    throw new Error(`Erro ao carregar obrigações do mês: ${obrigacoesRes.error.message}`);
  }
  if (prazosRes.error) {
    throw new Error(`Erro ao carregar próximos prazos: ${prazosRes.error.message}`);
  }
  if (reguaRes.error) {
    throw new Error(`Erro ao carregar régua automática: ${reguaRes.error.message}`);
  }

  const resumo = resumoRes.data?.[0] ?? { ...RESUMO_VAZIO, mes: mesIso };

  const contadorFallback: ContadorRow = contador ?? {
    id: user.id,
    nome:
      typeof user.user_metadata?.nome === "string" && user.user_metadata.nome.trim()
        ? user.user_metadata.nome.trim()
        : "Escritório",
    email: user.email ?? "",
    chave_pix: null,
    plano: "gratis",
    termos_versao: null,
    termos_aceitos_em: null,
    texto_pendencia:
      "Olá, {nome}. Identificamos honorários contábeis em aberto. Chave Pix para pagamento: {pix}.",
    criado_em: new Date().toISOString(),
  };

  return {
    mesIso,
    hojeIso,
    emailUsuario: user.email ?? contadorFallback.email,
    contador: contadorFallback,
    resumo,
    cobrancas: cobrancasRes.data ?? [],
    obrigacoes: obrigacoesRes.data ?? [],
    proximosPrazos: prazosRes.data ?? [],
    passosRegua: reguaRes.data ?? [],
    qtdClientesAtivos: ativosRes.count ?? 0,
  };
}
