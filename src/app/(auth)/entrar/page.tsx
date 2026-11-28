import type { Metadata } from "next";
import { FormEntrar } from "@/features/conta/formularios-auth";

export const metadata: Metadata = {
  title: "Entrar",
};

interface EntrarPageProps {
  searchParams: Promise<{
    conta?: string;
    erro?: string;
  }>;
}

export default async function EntrarPage({ searchParams }: EntrarPageProps) {
  const params = await searchParams;
  return (
    <FormEntrar
      contaExcluida={params.conta === "excluida"}
      linkInvalido={params.erro === "link_invalido"}
    />
  );
}
