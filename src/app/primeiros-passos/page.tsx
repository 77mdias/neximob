import type { Metadata } from "next";
import { FluxoPrimeirosPassos } from "@/features/conta/fluxo-primeiros-passos";
import { carregarPainelDoMes } from "@/server/queries/painel";

export const metadata: Metadata = {
  title: "Primeiros passos",
};

export const dynamic = "force-dynamic";

export default async function PrimeirosPassosPage() {
  const dados = await carregarPainelDoMes();

  return (
    <FluxoPrimeirosPassos
      nomeInicial={dados.contador.nome}
      chavePixInicial={dados.contador.chave_pix}
      mesAtualIso={dados.mesIso}
      qtdClientesInicial={dados.qtdClientesAtivos}
    />
  );
}
