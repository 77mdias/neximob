import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { VERSAO_TERMOS_ATUAL } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Política de Privacidade",
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[var(--nx-bg)]">
      <header className="border-b border-[var(--nx-border)]">
        <div className="mx-auto flex h-[60px] max-w-[780px] items-center justify-between px-4 sm:px-6">
          <Link href="/">
            <BrandLogo variant="horizontal" />
          </Link>
          <Link href="/entrar" className="text-[13px] font-medium text-[var(--nx-accent)] hover:underline">
            Voltar ao sistema
          </Link>
        </div>
      </header>

      <main id="conteudo-principal" className="mx-auto max-w-[780px] space-y-6 px-4 py-10 sm:px-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--nx-text-muted)]">
            Versão {VERSAO_TERMOS_ATUAL} · LGPD
          </p>
          <h1 className="mt-1 font-serif text-[30px] font-semibold tracking-tight text-[var(--nx-text)]">
            Política de Privacidade
          </h1>
        </div>

        <section className="space-y-3 text-[15px] leading-relaxed text-[var(--nx-text-body)]">
          <p>
            Esta Política descreve como o Neximob coleta, utiliza e protege os dados tratados no
            controle mensal do seu escritório, em conformidade com a Lei Geral de Proteção de
            Dados (Lei nº 13.709/2018).
          </p>
          <h2 className="pt-2 text-[18px] font-semibold text-[var(--nx-text)]">
            1. Dados estritamente necessários
          </h2>
          <p>
            Coletamos apenas seu nome ou razão do escritório, e-mail de acesso, chave Pix opcional e
            os dados operacionais estritamente necessários dos seus clientes (nome, regime,
            honorário, vencimento, e-mail e telefone para lembretes). Não solicitamos CPF nem CNPJ
            dos seus clientes.
          </p>
          <h2 className="pt-2 text-[18px] font-semibold text-[var(--nx-text)]">
            2. Isolamento de acesso e segurança
          </h2>
          <p>
            Cada contador acessa exclusivamente os registros da própria conta, com isolamento por
            políticas de segurança no banco de dados (RLS) e sessão autenticada em cookies seguros.
          </p>
          <h2 className="pt-2 text-[18px] font-semibold text-[var(--nx-text)]">
            3. Portabilidade e exclusão
          </h2>
          <p>
            Em <strong>Meus dados e LGPD</strong>, dentro da sua conta, você pode baixar seus dados
            em formato JSON ou solicitar a exclusão definitiva de toda a base associada ao seu
            usuário.
          </p>
        </section>
      </main>
    </div>
  );
}
