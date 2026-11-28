import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";
import { VERSAO_TERMOS_ATUAL } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Termos de Uso",
};

export default function TermosPage() {
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
            Versão {VERSAO_TERMOS_ATUAL}
          </p>
          <h1 className="mt-1 font-serif text-[30px] font-semibold tracking-tight text-[var(--nx-text)]">
            Termos de Uso do Neximob
          </h1>
        </div>

        <section className="space-y-3 text-[15px] leading-relaxed text-[var(--nx-text-body)]">
          <p>
            O Neximob é uma ferramenta de organização mensal voltada a contadores autônomos e
            pequenos escritórios para acompanhar honorários, lembretes de cobrança e entregas de
            obrigações fiscais.
          </p>
          <h2 className="pt-2 text-[18px] font-semibold text-[var(--nx-text)]">
            1. Uso da plataforma e responsabilidade profissional
          </h2>
          <p>
            O Neximob não substitui a conferência contábil, fiscal ou jurídica realizada pelo
            profissional responsável nem emite boletos bancários ou documentos fiscais oficiais.
            Datas de entrega exibidas no painel funcionam como apoio operacional ao controle do
            escritório.
          </p>
          <h2 className="pt-2 text-[18px] font-semibold text-[var(--nx-text)]">
            2. Cadastro de clientes e comunicações
          </h2>
          <p>
            O contador é responsável pela exatidão dos contatos cadastrados de seus clientes e pela
            autorização para envio de lembretes de cobrança por e-mail ou WhatsApp. O sistema não
            coleta nem armazena CPF ou CNPJ dos clientes.
          </p>
          <h2 className="pt-2 text-[18px] font-semibold text-[var(--nx-text)]">
            3. Disponibilidade e encerramento de conta
          </h2>
          <p>
            Você pode exportar uma cópia completa dos seus dados ou excluir sua conta
            permanentemente a qualquer momento em <strong>Meus dados e LGPD</strong>.
          </p>
        </section>
      </main>
    </div>
  );
}
