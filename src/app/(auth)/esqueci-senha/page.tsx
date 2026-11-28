import type { Metadata } from "next";
import { FormEsqueciSenha } from "@/features/conta/formularios-auth";

export const metadata: Metadata = {
  title: "Esqueci minha senha",
};

export default function EsqueciSenhaPage() {
  return <FormEsqueciSenha />;
}
