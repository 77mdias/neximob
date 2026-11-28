import {
  normalizarAbaPainel,
  PainelUnicoShell,
} from "@/features/painel/painel-unico-shell";
import { normalizarFiltroCobranca } from "@/lib/cobrancas-filter";
import { carregarPainelDoMes } from "@/server/queries/painel";

export const dynamic = "force-dynamic";

interface PainelPageProps {
  searchParams: Promise<{
    mes?: string;
    aba?: string;
    filtro?: string;
  }>;
}

export default async function PainelPage({ searchParams }: PainelPageProps) {
  const params = await searchParams;
  const dadosIniciais = await carregarPainelDoMes(params.mes);

  return (
    <PainelUnicoShell
      dadosIniciais={dadosIniciais}
      abaInicial={normalizarAbaPainel(params.aba)}
      filtroInicial={normalizarFiltroCobranca(params.filtro)}
    />
  );
}
