"use client";

import { ArrowRight, CheckCircle2, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { ModalFormularioCliente } from "@/features/clientes/modal-formulario-cliente";
import { salvarPerfilAction } from "@/server/actions/conta";

interface FluxoPrimeirosPassosProps {
  nomeInicial: string;
  chavePixInicial: string | null;
  mesAtualIso: string;
  qtdClientesInicial: number;
}

export function FluxoPrimeirosPassos({
  nomeInicial,
  chavePixInicial,
  mesAtualIso,
  qtdClientesInicial,
}: FluxoPrimeirosPassosProps) {
  const router = useRouter();
  const [nome, setNome] = useState(nomeInicial);
  const [chavePix, setChavePix] = useState(chavePixInicial ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [passo, setPasso] = useState<1 | 2>(qtdClientesInicial > 0 ? 2 : 1);
  const [modalCliente, setModalCliente] = useState(false);
  const [clientesCriados, setClientesCriados] = useState(qtdClientesInicial);
  const [pending, startTransition] = useTransition();

  function handleSalvarPasso1(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    startTransition(async () => {
      const res = await salvarPerfilAction({ nome, chavePix });
      if (!res.ok) {
        setErro(res.fieldErrors?.nome ?? res.fieldErrors?.chavePix ?? res.error);
        return;
      }
      setPasso(2);
    });
  }

  return (
    <div className="min-h-screen bg-[var(--nx-surface-subtle)] px-4 py-10">
      <div className="mx-auto max-w-[540px] space-y-6">
        <div className="flex items-center justify-between">
          <BrandLogo variant="horizontal" />
          <span className="text-[12px] font-medium text-[var(--nx-text-muted)]">
            Passo {passo} de 2
          </span>
        </div>

        <main
          id="conteudo-principal"
          className="rounded-[10px] border border-[var(--nx-border)] bg-[var(--nx-bg)] p-6 sm:p-8"
        >
          {passo === 1 ? (
            <form onSubmit={handleSalvarPasso1} className="space-y-4">
              <div>
                <h1 className="font-serif text-[26px] font-semibold tracking-tight text-[var(--nx-text)]">
                  Bem-vindo ao Neximob
                </h1>
                <p className="mt-1 text-[14px] text-[var(--nx-text-body)]">
                  Confirme o nome do escritório e sua chave Pix para os lembretes mensais.
                </p>
              </div>

              <div>
                <label
                  htmlFor="onb-nome"
                  className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
                >
                  Nome do contador ou escritório
                </label>
                <input
                  id="onb-nome"
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
                />
              </div>

              <div>
                <label
                  htmlFor="onb-pix"
                  className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
                >
                  Chave Pix (opcional agora)
                </label>
                <input
                  id="onb-pix"
                  type="text"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  placeholder="E-mail, celular, CNPJ ou chave aleatória"
                  className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
                />
              </div>

              {erro ? (
                <p className="text-[13px] text-[var(--nx-status-overdue-fg)]" role="alert">
                  {erro}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
              >
                <span>{pending ? "Salvando..." : "Continuar"}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </form>
          ) : (
            <div className="space-y-5">
              <div>
                <h1 className="font-serif text-[26px] font-semibold tracking-tight text-[var(--nx-text)]">
                  {clientesCriados > 0
                    ? "Tudo pronto para começar"
                    : "Cadastre seu primeiro cliente"}
                </h1>
                <p className="mt-1 text-[14px] leading-relaxed text-[var(--nx-text-body)]">
                  Você pode cadastrar o primeiro cliente agora ou ir direto para o painel principal.
                </p>
              </div>

              {clientesCriados > 0 ? (
                <div className="flex items-center gap-2 rounded-[6px] border border-[var(--nx-status-paid-border)] bg-[var(--nx-status-paid-bg)] p-3 text-[13px] text-[var(--nx-status-paid-fg)]">
                  <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {clientesCriados}{" "}
                    {clientesCriados === 1 ? "cliente cadastrado" : "clientes cadastrados"} e
                    cobrança gerada.
                  </span>
                </div>
              ) : null}

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalCliente(true)}
                  className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {clientesCriados > 0 ? "Cadastrar outro cliente" : "Cadastrar primeiro cliente"}
                  </span>
                </button>

                <Link
                  href="/"
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)]"
                >
                  <span>Ir para o painel</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          )}
        </main>
      </div>

      <ModalFormularioCliente
        open={modalCliente}
        clienteIdEdicao={null}
        mesAtualVisualizado={mesAtualIso}
        onClose={() => setModalCliente(false)}
        onSalvo={() => {
          setClientesCriados((c) => c + 1);
          router.refresh();
        }}
      />
    </div>
  );
}
