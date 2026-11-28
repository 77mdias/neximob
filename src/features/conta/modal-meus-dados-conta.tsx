"use client";

import { Download, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useToast } from "@/components/ui/toast-region";
import {
  excluirContaAction,
  exportarMeusDadosAction,
  salvarPerfilAction,
} from "@/server/actions/conta";

interface ModalMeusDadosContaProps {
  open: boolean;
  nomeInicial: string;
  chavePixInicial: string | null;
  emailUsuario: string;
  onClose: () => void;
  onPerfilSalvo: (dados: { nome: string; chavePix: string | null }) => void;
}

export function ModalMeusDadosConta({
  open,
  nomeInicial,
  chavePixInicial,
  emailUsuario,
  onClose,
  onPerfilSalvo,
}: ModalMeusDadosContaProps) {
  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title="Meus dados e privacidade"
      subtitle={emailUsuario}
      maxWidthClass="md:max-w-[520px]"
    >
      {open ? (
        <ConteudoMeusDadosConta
          key={`${nomeInicial}-${chavePixInicial ?? ""}`}
          nomeInicial={nomeInicial}
          chavePixInicial={chavePixInicial}
          onClose={onClose}
          onPerfilSalvo={onPerfilSalvo}
        />
      ) : null}
    </ResponsiveDialog>
  );
}

function ConteudoMeusDadosConta({
  nomeInicial,
  chavePixInicial,
  onClose,
  onPerfilSalvo,
}: {
  nomeInicial: string;
  chavePixInicial: string | null;
  onClose: () => void;
  onPerfilSalvo: (dados: { nome: string; chavePix: string | null }) => void;
}) {
  const { showToast } = useToast();
  const [nome, setNome] = useState(nomeInicial);
  const [chavePix, setChavePix] = useState(chavePixInicial ?? "");
  const [erro, setErro] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [textoExclusao, setTextoExclusao] = useState("");
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);
  const [pendingSalvar, startSalvar] = useTransition();
  const [pendingExport, startExport] = useTransition();
  const [pendingDelete, startDelete] = useTransition();

  function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    startSalvar(async () => {
      const res = await salvarPerfilAction({ nome, chavePix });
      if (!res.ok) {
        setErro(res.fieldErrors?.nome ?? res.fieldErrors?.chavePix ?? res.error);
        return;
      }
      onPerfilSalvo(res.data);
      showToast("Dados do escritório salvos.");
      onClose();
    });
  }

  function handleExportar() {
    startExport(async () => {
      const res = await exportarMeusDadosAction();
      if (!res.ok) {
        showToast(res.error, { kind: "error" });
        return;
      }
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neximob-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Arquivo com seus dados baixado.");
    });
  }

  function handleExcluirConta() {
    setErroExclusao(null);
    startDelete(async () => {
      const res = await excluirContaAction(textoExclusao);
      if (res && !res.ok) {
        setErroExclusao(res.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <form id="form-meus-dados" onSubmit={handleSalvarPerfil} className="space-y-4">
        <div>
          <label
            htmlFor="conta-nome"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Nome do contador ou escritório
          </label>
          <input
            id="conta-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={200}
            className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
        </div>

        <div>
          <label
            htmlFor="conta-pix"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Chave Pix para cobranças
          </label>
          <input
            id="conta-pix"
            type="text"
            value={chavePix}
            onChange={(e) => setChavePix(e.target.value)}
            maxLength={140}
            placeholder="E-mail, celular, CNPJ ou chave aleatória"
            className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
        </div>

        {erro ? (
          <p className="text-[13px] text-[var(--nx-status-overdue-fg)]" role="alert">
            {erro}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] cursor-pointer rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
          >
            Fechar
          </button>
          <button
            type="submit"
            disabled={pendingSalvar}
            className="min-h-[40px] cursor-pointer rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
          >
            {pendingSalvar ? "Salvando..." : "Salvar dados"}
          </button>
        </div>
      </form>

      <div className="border-t border-[var(--nx-border-subtle)] pt-4">
        <h3 className="text-[14px] font-semibold text-[var(--nx-text)]">Seus direitos na LGPD</h3>
        <p className="mt-1 text-[13px] text-[var(--nx-text-body)]">
          Você pode baixar uma cópia completa dos seus clientes, cobranças e envios em formato
          JSON a qualquer momento.
        </p>
        <button
          type="button"
          disabled={pendingExport}
          onClick={handleExportar}
          className="mt-3 inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3.5 text-[13px] font-medium text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)] disabled:opacity-50"
        >
          <Download className="h-4 w-4 text-[var(--nx-accent)]" aria-hidden="true" />
          <span>{pendingExport ? "Gerando arquivo..." : "Exportar meus dados (JSON)"}</span>
        </button>
      </div>

      <div className="border-t border-[var(--nx-border-subtle)] pt-4">
        {!confirmandoExclusao ? (
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-[var(--nx-status-overdue-fg)]">
                Excluir minha conta
              </p>
              <p className="text-[12px] text-[var(--nx-text-muted)]">
                Remove permanentemente sua conta e todos os registros do escritório.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmandoExclusao(true)}
              className="inline-flex min-h-[36px] shrink-0 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] px-3 text-[13px] font-medium text-[var(--nx-status-overdue-fg)]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Excluir</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3 rounded-[8px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] p-3.5">
            <p className="text-[13px] font-medium text-[var(--nx-status-overdue-fg)]">
              Esta ação não pode ser desfeita. Digite <strong>EXCLUIR</strong> para confirmar:
            </p>
            <input
              type="text"
              value={textoExclusao}
              onChange={(e) => setTextoExclusao(e.target.value)}
              placeholder="EXCLUIR"
              aria-label="Confirmação para excluir a conta"
              className="min-h-[38px] w-full rounded-[6px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-bg)] px-3 text-[14px] text-[var(--nx-text)]"
            />
            {erroExclusao ? (
              <p className="text-[12px] text-[var(--nx-status-overdue-fg)]">{erroExclusao}</p>
            ) : null}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmandoExclusao(false);
                  setTextoExclusao("");
                  setErroExclusao(null);
                }}
                className="min-h-[36px] cursor-pointer rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-3 text-[13px] font-medium text-[var(--nx-text-body)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={pendingDelete || textoExclusao.trim() !== "EXCLUIR"}
                onClick={handleExcluirConta}
                className="min-h-[36px] cursor-pointer rounded-[6px] bg-[var(--nx-status-overdue-fg)] px-3 text-[13px] font-medium text-white disabled:opacity-50"
              >
                {pendingDelete ? "Excluindo..." : "Confirmar exclusão"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
