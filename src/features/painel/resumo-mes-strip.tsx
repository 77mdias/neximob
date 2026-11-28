import { AlertTriangle, KeyRound } from "lucide-react";
import type { ResumoDoMesRow } from "@/lib/database.types";
import { formatarDiaMes, formatarMesTitulo } from "@/lib/dates";
import { formatBRL } from "@/lib/format";

interface ResumoMesStripProps {
  mesIso: string;
  mesCorrenteIso: string;
  resumo: ResumoDoMesRow;
  cobrancasEmAberto: number;
  valorEmAtraso: number;
  guiasTotais: number;
  proximoPrazoGuia: string | null;
  possuiChavePix: boolean;
  qtdClientesAtivos: number;
  onVoltarMesAtual: () => void;
  onIrParaAtrasados: () => void;
  onIrParaObrigacoes: () => void;
  onAbrirMeusDados: () => void;
}

export function ResumoMesStrip({
  mesIso,
  mesCorrenteIso,
  resumo,
  cobrancasEmAberto,
  valorEmAtraso,
  guiasTotais,
  proximoPrazoGuia,
  possuiChavePix,
  qtdClientesAtivos,
  onVoltarMesAtual,
  onIrParaAtrasados,
  onIrParaObrigacoes,
  onAbrirMeusDados,
}: ResumoMesStripProps) {
  const tituloMes = formatarMesTitulo(mesIso);
  const percentual = Math.max(
    0,
    Math.min(100, Math.round(Number(resumo.percentual_recebido ?? 0))),
  );
  const aReceberNum = Number(resumo.a_receber ?? 0);
  const recebidoNum = Number(resumo.recebido ?? 0);
  const emAbertoAnt = Number(resumo.em_aberto_meses_anteriores ?? 0);
  const clientesAtraso = Number(resumo.clientes_em_atraso ?? 0);
  const guiasAFazer = Number(resumo.guias_a_fazer ?? 0);

  const complementoTitulo =
    qtdClientesAtivos === 0 && recebidoNum === 0 && aReceberNum === 0
      ? "nenhum cliente cadastrado ainda"
      : aReceberNum > 0
        ? `faltam ${formatBRL(aReceberNum)} de ${cobrancasEmAberto} ${
            cobrancasEmAberto === 1 ? "cliente" : "clientes"
          }`
        : "tudo em dia neste mês";

  return (
    <section aria-label="Resumo do mês" className="space-y-4">
      {/* Título do mês em dois tempos (Assinatura visual #1 — Newsreader + Inter) */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="m-0 font-serif text-[26px] leading-[1.15] font-normal tracking-[-0.02em] text-[var(--nx-text)] md:text-[32px]">
            {tituloMes}
          </h1>
          <span className="text-[14px] font-normal tabular-nums text-[var(--nx-text-muted)] md:text-[15px]">
            {complementoTitulo}
          </span>
        </div>

        {mesIso !== mesCorrenteIso ? (
          <button
            type="button"
            onClick={onVoltarMesAtual}
            className="inline-flex h-[28px] cursor-pointer items-center rounded-full border border-[var(--nx-border)] bg-[var(--nx-surface)] px-2.5 text-[12px] font-medium text-[var(--nx-accent)] md:hidden"
          >
            Voltar ao mês atual
          </button>
        ) : null}
      </div>

      {/* Faixa unificada do Resumo do mês (Assinatura visual #2 — 4 KPIs em 2x2 mobile / 4 col desktop) */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[8px] border border-[var(--nx-border)] bg-[var(--nx-surface)] lg:grid-cols-4">
        {/* Card 1: Recebido */}
        <div className="flex flex-col justify-between gap-1.5 p-4 md:px-[22px] md:py-5">
          <div className="flex items-center justify-between gap-1.5 text-[12px] font-semibold tracking-[0.02em] text-[var(--nx-text-muted)]">
            <span>Recebido</span>
            <span className="tabular-nums">{percentual}% do mês</span>
          </div>
          <div className="mt-0.5 font-serif text-[22px] leading-[1.1] font-medium tracking-[-0.02em] tabular-nums text-[var(--nx-text)] md:text-[28px]">
            {formatBRL(recebidoNum)}
          </div>
          <div
            className="mt-1 h-[4px] w-full overflow-hidden rounded-[4px] bg-[var(--nx-border)]"
            role="progressbar"
            aria-valuenow={percentual}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentual}% recebido em ${tituloMes.toLowerCase()}`}
          >
            <div
              className="h-full rounded-[4px] bg-[var(--nx-accent)] transition-[width] duration-[220ms]"
              style={{ width: `${percentual}%` }}
            />
          </div>
        </div>

        {/* Card 2: A receber */}
        <div className="flex flex-col justify-between gap-1.5 border-l border-[var(--nx-border)] p-4 md:px-[22px] md:py-5">
          <div className="text-[12px] font-semibold tracking-[0.02em] text-[var(--nx-text-muted)]">
            A receber
          </div>
          <div className="mt-0.5 font-serif text-[22px] leading-[1.1] font-medium tracking-[-0.02em] tabular-nums text-[var(--nx-text)] md:text-[28px]">
            {formatBRL(aReceberNum)}
          </div>
          {emAbertoAnt > 0 ? (
            <div className="inline-flex items-center gap-1 text-[12px] font-medium tabular-nums text-[var(--nx-status-overdue-fg)]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>+ {formatBRL(emAbertoAnt)} anteriores</span>
            </div>
          ) : (
            <div className="text-[12px] tabular-nums text-[var(--nx-text-muted)]">
              {cobrancasEmAberto === 0
                ? "0 em aberto"
                : `${cobrancasEmAberto} em aberto`}
            </div>
          )}
        </div>

        {/* Card 3: Em atraso (clicável -> filtra Em atraso) */}
        <button
          type="button"
          onClick={onIrParaAtrasados}
          aria-label="Filtrar clientes em atraso"
          className="flex cursor-pointer flex-col justify-between gap-1.5 border-t border-[var(--nx-border)] bg-transparent p-4 text-left transition-colors duration-150 hover:bg-[var(--nx-surface-muted)] md:px-[22px] md:py-5 lg:border-t-0 lg:border-l"
        >
          <div className="flex w-full items-center justify-between gap-1.5 text-[12px] font-semibold tracking-[0.02em] text-[var(--nx-text-muted)]">
            <span>Em atraso</span>
            <span className="font-semibold text-[var(--nx-accent)]">
              <span className="hidden min-[480px]:inline">Filtrar </span>→
            </span>
          </div>
          <div
            className={`mt-0.5 font-serif text-[22px] leading-[1.1] font-medium tracking-[-0.02em] tabular-nums md:text-[28px] ${
              clientesAtraso > 0
                ? "text-[var(--nx-status-overdue-fg)]"
                : "text-[var(--nx-text)]"
            }`}
          >
            {clientesAtraso === 1 ? "1 cliente" : `${clientesAtraso} clientes`}
          </div>
          <div className="text-[12px] tabular-nums text-[var(--nx-text-muted)]">
            {clientesAtraso > 0
              ? `${formatBRL(valorEmAtraso)} vencidos`
              : "Nenhum em atraso"}
          </div>
        </button>

        {/* Card 4: Guias a fazer (clicável -> abre aba Obrigações) */}
        <button
          type="button"
          onClick={onIrParaObrigacoes}
          aria-label="Abrir aba Obrigações"
          className="flex cursor-pointer flex-col justify-between gap-1.5 border-t border-l border-[var(--nx-border)] bg-transparent p-4 text-left transition-colors duration-150 hover:bg-[var(--nx-surface-muted)] md:px-[22px] md:py-5 lg:border-t-0"
        >
          <div className="flex w-full items-center justify-between gap-1.5 text-[12px] font-semibold tracking-[0.02em] text-[var(--nx-text-muted)]">
            <span>Guias a fazer</span>
            <span className="font-semibold text-[var(--nx-accent)]">
              <span className="hidden min-[480px]:inline">Ver obrigações </span>→
            </span>
          </div>
          <div className="mt-0.5 font-serif text-[22px] leading-[1.1] font-medium tracking-[-0.02em] tabular-nums text-[var(--nx-text)] md:text-[28px]">
            {guiasTotais > 0 ? `${guiasAFazer} de ${guiasTotais}` : `${guiasAFazer}`}
          </div>
          <div className="text-[12px] tabular-nums text-[var(--nx-text-muted)]">
            {proximoPrazoGuia
              ? `próximo prazo: ${formatarDiaMes(proximoPrazoGuia)}`
              : "Ver obrigações"}
          </div>
        </button>
      </div>

      {!possuiChavePix && qtdClientesAtivos > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[var(--nx-status-today-border)] bg-[var(--nx-status-today-bg)] px-4 py-2.5 text-[13px] text-[var(--nx-text)]">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 shrink-0 text-[var(--nx-status-today-fg)]" aria-hidden="true" />
            <span>
              Cadastre sua <strong>chave Pix</strong> para que ela entre automaticamente nos lembretes e
              cobranças.
            </span>
          </div>
          <button
            type="button"
            onClick={onAbrirMeusDados}
            className="cursor-pointer font-semibold text-[var(--nx-accent)] underline underline-offset-2"
          >
            Cadastrar chave Pix
          </button>
        </div>
      ) : null}
    </section>
  );
}
