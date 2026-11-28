"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useToast } from "@/components/ui/toast-region";
import type { CanalEnvio, TipoCliente } from "@/lib/database.types";
import { cobrancaInicioPadrao, hojeEmBrasilia } from "@/lib/dates";
import { formatBRLInput } from "@/lib/format";
import { formatarTelefoneExibicao } from "@/lib/validation";
import {
  buscarClienteParaEdicaoAction,
  salvarClienteAction,
} from "@/server/actions/clientes";

interface ModalFormularioClienteProps {
  open: boolean;
  clienteIdEdicao: string | null;
  mesAtualVisualizado: string;
  onClose: () => void;
  onSalvo: () => void;
}

const TIPOS: ReadonlyArray<{ id: TipoCliente; label: string }> = [
  { id: "MEI", label: "MEI" },
  { id: "SIMPLES", label: "Simples" },
  { id: "PF", label: "Pessoa Física" },
];

export function ModalFormularioCliente({
  open,
  clienteIdEdicao,
  mesAtualVisualizado,
  onClose,
  onSalvo,
}: ModalFormularioClienteProps) {
  return (
    <ResponsiveDialog
      open={open}
      onClose={onClose}
      title={clienteIdEdicao ? "Editar cliente" : "Novo cliente"}
      subtitle={
        clienteIdEdicao
          ? "As alterações valem a partir das próximas cobranças."
          : "Preencha apenas o essencial para gerar honorários e obrigações."
      }
      maxWidthClass="md:max-w-[520px]"
    >
      {open ? (
        <ConteudoFormularioCliente
          key={clienteIdEdicao ?? "novo-cliente"}
          clienteIdEdicao={clienteIdEdicao}
          mesAtualVisualizado={mesAtualVisualizado}
          onClose={onClose}
          onSalvo={onSalvo}
        />
      ) : null}
    </ResponsiveDialog>
  );
}

function ConteudoFormularioCliente({
  clienteIdEdicao,
  mesAtualVisualizado,
  onClose,
  onSalvo,
}: {
  clienteIdEdicao: string | null;
  mesAtualVisualizado: string;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const { showToast } = useToast();
  const hojeIso = hojeEmBrasilia();
  const padraoInicial = cobrancaInicioPadrao(10, hojeIso);

  const [carregando, setCarregando] = useState(Boolean(clienteIdEdicao));
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoCliente>("MEI");
  const [honorarioRaw, setHonorarioRaw] = useState("");
  const [diaVencimento, setDiaVencimento] = useState(10);
  const [cobrancaInicio, setCobrancaInicio] = useState<string>(
    padraoInicial.vencimentoJaPassou ? padraoInicial.proximoMes : padraoInicial.esteMes,
  );
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [canalEmail, setCanalEmail] = useState(true);
  const [canalWhatsapp, setCanalWhatsapp] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  const regraInicio = cobrancaInicioPadrao(diaVencimento, hojeIso);

  useEffect(() => {
    if (!clienteIdEdicao) return;

    let cancelado = false;
    void buscarClienteParaEdicaoAction(clienteIdEdicao).then((res) => {
      if (cancelado) return;
      setCarregando(false);
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      const c = res.data;
      setNome(c.nome);
      setTipo(c.tipo);
      setHonorarioRaw(formatBRLInput(Number(c.honorario)));
      setDiaVencimento(c.dia_vencimento);
      setCobrancaInicio(c.cobranca_inicio);
      setEmail(c.email ?? "");
      setTelefone(formatarTelefoneExibicao(c.telefone));
      setCanalEmail(c.canais.includes("email"));
      setCanalWhatsapp(c.canais.includes("whatsapp"));
    });

    return () => {
      cancelado = true;
    };
  }, [clienteIdEdicao]);

  function handleMudarDia(novoDia: number) {
    const seguro = Math.min(28, Math.max(1, Number.isFinite(novoDia) ? novoDia : 10));
    setDiaVencimento(seguro);
    if (!clienteIdEdicao) {
      const info = cobrancaInicioPadrao(seguro, hojeIso);
      setCobrancaInicio(info.vencimentoJaPassou ? info.proximoMes : info.esteMes);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});

    const canais: Array<Exclude<CanalEnvio, "manual">> = [];
    if (canalEmail) canais.push("email");
    if (canalWhatsapp) canais.push("whatsapp");

    startTransition(async () => {
      const res = await salvarClienteAction({
        clienteId: clienteIdEdicao ?? undefined,
        mesAtualVisualizado,
        nome,
        tipo,
        honorarioRaw,
        diaVencimento,
        cobrancaInicio: clienteIdEdicao ? undefined : cobrancaInicio,
        email,
        telefone,
        canais,
      });

      if (!res.ok) {
        setErro(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }

      showToast(
        clienteIdEdicao
          ? `Dados de ${res.data.cliente.nome} atualizados.`
          : `Cliente ${res.data.cliente.nome} cadastrado.`,
      );
      onSalvo();
      onClose();
    });
  }

  if (carregando) {
    return (
      <div className="flex items-center gap-2 py-8 text-[14px] text-[var(--nx-text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        <span>Carregando dados do cliente...</span>
      </div>
    );
  }

  return (
    <form id="form-cliente" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="cliente-nome"
          className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
        >
          Nome do cliente ou empresa
        </label>
        <input
          id="cliente-nome"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          maxLength={200}
          placeholder="Ex.: Padaria Central Ltda"
          className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
        />
        {fieldErrors.nome ? (
          <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
            {fieldErrors.nome}
          </p>
        ) : null}
      </div>

      <fieldset>
        <legend className="text-[13px] font-medium text-[var(--nx-text-strong)]">
          Enquadramento
        </legend>
        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {TIPOS.map((item) => {
            const ativo = tipo === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={ativo}
                onClick={() => setTipo(item.id)}
                className={`min-h-[38px] cursor-pointer rounded-[6px] border px-2 text-[13px] transition ${
                  ativo
                    ? "border-[var(--nx-accent)] bg-[var(--nx-accent-tint)] font-semibold text-[var(--nx-accent)]"
                    : "border-[var(--nx-border)] bg-[var(--nx-bg)] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cliente-honorario"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Honorário mensal (R$)
          </label>
          <input
            id="cliente-honorario"
            type="text"
            inputMode="decimal"
            value={honorarioRaw}
            onChange={(e) => setHonorarioRaw(e.target.value)}
            placeholder="350,00"
            className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] tabular-nums text-[var(--nx-text)]"
          />
          {fieldErrors.honorarioRaw ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.honorarioRaw}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="cliente-dia"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Dia de vencimento (1 a 28)
          </label>
          <input
            id="cliente-dia"
            type="number"
            min={1}
            max={28}
            value={diaVencimento}
            onChange={(e) => handleMudarDia(Number(e.target.value))}
            className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] tabular-nums text-[var(--nx-text)]"
          />
          {fieldErrors.diaVencimento ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.diaVencimento}
            </p>
          ) : null}
        </div>
      </div>

      {!clienteIdEdicao && regraInicio.vencimentoJaPassou ? (
        <div className="rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-surface-subtle)] p-3">
          <p className="text-[13px] font-medium text-[var(--nx-text-strong)]">
            O dia {diaVencimento} deste mês já passou. Quando começa a cobrar?
          </p>
          <div className="mt-2 flex flex-col gap-2 text-[13px]">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="cobranca-inicio"
                checked={cobrancaInicio === regraInicio.proximoMes}
                onChange={() => setCobrancaInicio(regraInicio.proximoMes)}
                className="accent-[var(--nx-accent)]"
              />
              <span>Começar no próximo mês (recomendado)</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="cobranca-inicio"
                checked={cobrancaInicio === regraInicio.esteMes}
                onChange={() => setCobrancaInicio(regraInicio.esteMes)}
                className="accent-[var(--nx-accent)]"
              />
              <span>Cobrar ainda neste mês (já nasce como atrasado)</span>
            </label>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor="cliente-email"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            E-mail para lembretes
          </label>
          <input
            id="cliente-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="financeiro@empresa.com.br"
            className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="cliente-telefone"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            WhatsApp com DDD
          </label>
          <input
            id="cliente-telefone"
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="mt-1.5 min-h-[40px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
          {fieldErrors.telefone ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.telefone}
            </p>
          ) : null}
        </div>
      </div>

      <fieldset>
        <legend className="text-[13px] font-medium text-[var(--nx-text-strong)]">
          Canais de envio automático
        </legend>
        <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-[var(--nx-text-body)]">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={canalEmail}
              onChange={(e) => setCanalEmail(e.target.checked)}
              className="h-4 w-4 accent-[var(--nx-accent)]"
            />
            <span>E-mail</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={canalWhatsapp}
              onChange={(e) => setCanalWhatsapp(e.target.checked)}
              className="h-4 w-4 accent-[var(--nx-accent)]"
            />
            <span>WhatsApp</span>
          </label>
        </div>
      </fieldset>

      {erro && Object.keys(fieldErrors).length === 0 ? (
        <p className="text-[13px] text-[var(--nx-status-overdue-fg)]" role="alert">
          {erro}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--nx-border-subtle)] pt-4">
        <button
          type="button"
          onClick={onClose}
          className="min-h-[40px] cursor-pointer rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-body)] hover:bg-[var(--nx-surface-subtle)]"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="min-h-[40px] cursor-pointer rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
        >
          {pending ? "Salvando..." : clienteIdEdicao ? "Salvar alterações" : "Cadastrar cliente"}
        </button>
      </div>
    </form>
  );
}
