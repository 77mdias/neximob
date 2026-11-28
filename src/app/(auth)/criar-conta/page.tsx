import type { Metadata } from "next";
import { FormCriarConta } from "@/features/conta/formularios-auth";

export const metadata: Metadata = {
  title: "Criar conta",
};

export default function CriarContaPage() {
  return <FormCriarConta />;
}
