import type { Metadata } from "next";
import { FormNovaSenha } from "@/features/conta/formularios-auth";

export const metadata: Metadata = {
  title: "Definir nova senha",
};

export default function NovaSenhaPage() {
  return <FormNovaSenha />;
}
