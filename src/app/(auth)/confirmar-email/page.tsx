import type { Metadata } from "next";
import { PainelConfirmarEmail } from "@/features/conta/formularios-auth";

export const metadata: Metadata = {
  title: "Confirmar e-mail",
};

interface ConfirmarEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function ConfirmarEmailPage({ searchParams }: ConfirmarEmailPageProps) {
  const params = await searchParams;
  return <PainelConfirmarEmail email={params.email ?? ""} />;
}
