"use client";

import { Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  criarContaAction,
  entrarAction,
  redefinirSenhaAction,
  reenviarConfirmacaoAction,
  solicitarRecuperacaoAction,
} from "@/server/actions/auth";

export function FormEntrar({
  contaExcluida = false,
  linkInvalido = false,
}: {
  contaExcluida?: boolean;
  linkInvalido?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState<string | null>(
    linkInvalido
      ? "O link de confirmação expirou ou já foi usado. Entre ou solicite um novo."
      : null,
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await entrarAction({ email, password });
      if (res && !res.ok) {
        setErro(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[26px] font-semibold tracking-tight text-[var(--nx-text)]">
          Entrar no Neximob
        </h1>
        <p className="mt-1 text-[14px] text-[var(--nx-text-body)]">
          Acesse o controle mensal do seu escritório.
        </p>
      </div>

      {contaExcluida ? (
        <div
          role="status"
          className="rounded-[6px] border border-[var(--nx-status-paid-border)] bg-[var(--nx-status-paid-bg)] p-3 text-[13px] text-[var(--nx-status-paid-fg)]"
        >
          Sua conta e todos os dados do escritório foram excluídos permanentemente.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="entrar-email"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            E-mail
          </label>
          <input
            id="entrar-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@escritorio.com.br"
            className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="entrar-senha"
              className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
            >
              Senha
            </label>
            <Link
              href="/esqueci-senha"
              className="text-[12px] font-medium text-[var(--nx-accent)] hover:underline"
            >
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative mt-1.5">
            <input
              id="entrar-senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] pr-10 pl-3 text-[14px] text-[var(--nx-text)]"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[4px] text-[var(--nx-text-muted)] hover:bg-[var(--nx-surface-muted)]"
            >
              {mostrarSenha ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        {erro && Object.keys(fieldErrors).length === 0 ? (
          <p
            role="alert"
            className="rounded-[6px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] px-3 py-2 text-[13px] text-[var(--nx-status-overdue-fg)]"
          >
            {erro}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] transition hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="border-t border-[var(--nx-border-subtle)] pt-4 text-center text-[13px] text-[var(--nx-text-body)]">
        Ainda não tem conta?{" "}
        <Link href="/criar-conta" className="font-medium text-[var(--nx-accent)] hover:underline">
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}

export function FormCriarConta() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await criarContaAction({
        nome,
        email,
        password,
        aceitouTermos,
      });
      if (res && !res.ok) {
        setErro(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[26px] font-semibold tracking-tight text-[var(--nx-text)]">
          Criar conta no Neximob
        </h1>
        <p className="mt-1 text-[14px] text-[var(--nx-text-body)]">
          Organize honorários, guias e lembretes em minutos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="cadastro-nome"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Seu nome ou do escritório
          </label>
          <input
            id="cadastro-nome"
            type="text"
            autoComplete="name"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Ana Contabilidade"
            maxLength={200}
            className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
          {fieldErrors.nome ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.nome}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="cadastro-email"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            E-mail
          </label>
          <input
            id="cadastro-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@escritorio.com.br"
            className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
          {fieldErrors.email ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="cadastro-senha"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Senha (mínimo 8 caracteres)
          </label>
          <div className="relative mt-1.5">
            <input
              id="cadastro-senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] pr-10 pl-3 text-[14px] text-[var(--nx-text)]"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[4px] text-[var(--nx-text-muted)] hover:bg-[var(--nx-surface-muted)]"
            >
              {mostrarSenha ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {fieldErrors.password ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-[var(--nx-text-body)]">
            <input
              type="checkbox"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--nx-accent)]"
            />
            <span>
              Li e concordo com os{" "}
              <Link
                href="/termos"
                target="_blank"
                className="font-medium text-[var(--nx-accent)] underline"
              >
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacidade"
                target="_blank"
                className="font-medium text-[var(--nx-accent)] underline"
              >
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
          {fieldErrors.aceitouTermos ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.aceitouTermos}
            </p>
          ) : null}
        </div>

        {erro && Object.keys(fieldErrors).length === 0 ? (
          <p
            role="alert"
            className="rounded-[6px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] px-3 py-2 text-[13px] text-[var(--nx-status-overdue-fg)]"
          >
            {erro}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] transition hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
        >
          {pending ? "Criando conta..." : "Criar conta"}
        </button>
      </form>

      <p className="border-t border-[var(--nx-border-subtle)] pt-4 text-center text-[13px] text-[var(--nx-text-body)]">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-medium text-[var(--nx-accent)] hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}

export function PainelConfirmarEmail({ email }: { email: string }) {
  const [reenviado, setReenviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleReenviar() {
    if (!email) return;
    setErro(null);
    startTransition(async () => {
      const res = await reenviarConfirmacaoAction(email);
      if (!res.ok) {
        setErro(res.error);
        return;
      }
      setReenviado(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--nx-surface-brand)] text-[var(--nx-text)]">
        <MailCheck className="h-5 w-5" aria-hidden="true" />
      </div>

      <h1 className="font-serif text-[25px] font-semibold tracking-tight text-[var(--nx-text)]">
        Confirme seu e-mail
      </h1>

      <p className="text-[14px] leading-relaxed text-[var(--nx-text-body)]">
        Enviamos um link de confirmação{" "}
        {email ? (
          <>
            para <strong className="text-[var(--nx-text)]">{email}</strong>
          </>
        ) : (
          "para o endereço informado"
        )}
        . Abra o e-mail e clique no botão para ativar sua conta e concluir os primeiros passos.
      </p>

      {erro ? (
        <p className="text-[13px] text-[var(--nx-status-overdue-fg)]" role="alert">
          {erro}
        </p>
      ) : null}

      {reenviado ? (
        <p className="rounded-[6px] border border-[var(--nx-status-paid-border)] bg-[var(--nx-status-paid-bg)] p-3 text-[13px] text-[var(--nx-status-paid-fg)]">
          Novo link enviado. Confira também a caixa de spam.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 pt-2">
        {email ? (
          <button
            type="button"
            disabled={pending}
            onClick={handleReenviar}
            className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-[6px] border border-[var(--nx-border)] bg-[var(--nx-bg)] px-4 text-[14px] font-medium text-[var(--nx-text-strong)] hover:bg-[var(--nx-surface-subtle)] disabled:opacity-50"
          >
            {pending ? "Reenviando..." : "Reenviar e-mail de confirmação"}
          </button>
        ) : null}

        <Link
          href="/entrar"
          className="inline-flex min-h-[40px] items-center justify-center rounded-[6px] text-[13px] font-medium text-[var(--nx-accent)] hover:underline"
        >
          Voltar para entrar
        </Link>
      </div>
    </div>
  );
}

export function FormEsqueciSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await solicitarRecuperacaoAction({ email });
      if (!res.ok) {
        setErro(res.error);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      setEnviado(true);
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[25px] font-semibold tracking-tight text-[var(--nx-text)]">
          Recuperar acesso
        </h1>
        <p className="mt-1 text-[14px] text-[var(--nx-text-body)]">
          Informe seu e-mail para receber um link de redefinição de senha.
        </p>
      </div>

      {enviado ? (
        <div
          role="status"
          className="space-y-3 rounded-[6px] border border-[var(--nx-status-paid-border)] bg-[var(--nx-status-paid-bg)] p-4 text-[13px] text-[var(--nx-status-paid-fg)]"
        >
          <p>
            Se houver uma conta cadastrada com este e-mail, enviaremos um link para você escolher
            uma nova senha.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="recuperar-email"
              className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
            >
              E-mail
            </label>
            <input
              id="recuperar-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@escritorio.com.br"
              className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>

          {erro && Object.keys(fieldErrors).length === 0 ? (
            <p className="text-[13px] text-[var(--nx-status-overdue-fg)]" role="alert">
              {erro}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
          >
            {pending ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
      )}

      <p className="border-t border-[var(--nx-border-subtle)] pt-4 text-center text-[13px]">
        <Link href="/entrar" className="font-medium text-[var(--nx-accent)] hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </div>
  );
}

export function FormNovaSenha() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setFieldErrors({});
    startTransition(async () => {
      const res = await redefinirSenhaAction({ password, confirmPassword });
      if (res && !res.ok) {
        setErro(res.error);
        setFieldErrors(res.fieldErrors ?? {});
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-[25px] font-semibold tracking-tight text-[var(--nx-text)]">
          Definir nova senha
        </h1>
        <p className="mt-1 text-[14px] text-[var(--nx-text-body)]">
          Escolha uma senha com pelo menos 8 caracteres.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="nova-senha"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Nova senha
          </label>
          <input
            id="nova-senha"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
          {fieldErrors.password ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.password}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="confirmar-nova-senha"
            className="block text-[13px] font-medium text-[var(--nx-text-strong)]"
          >
            Confirmar nova senha
          </label>
          <input
            id="confirmar-nova-senha"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="mt-1.5 min-h-[42px] w-full rounded-[6px] border border-[var(--nx-border-strong)] bg-[var(--nx-input-bg)] px-3 text-[14px] text-[var(--nx-text)]"
          />
          {fieldErrors.confirmPassword ? (
            <p className="mt-1 text-[12px] text-[var(--nx-status-overdue-fg)]">
              {fieldErrors.confirmPassword}
            </p>
          ) : null}
        </div>

        {erro && Object.keys(fieldErrors).length === 0 ? (
          <p
            role="alert"
            className="rounded-[6px] border border-[var(--nx-status-overdue-border)] bg-[var(--nx-status-overdue-bg)] px-3 py-2 text-[13px] text-[var(--nx-status-overdue-fg)]"
          >
            {erro}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-[42px] w-full cursor-pointer items-center justify-center rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-medium text-[var(--nx-accent-fg)] hover:bg-[var(--nx-accent-hover)] disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
    </div>
  );
}
