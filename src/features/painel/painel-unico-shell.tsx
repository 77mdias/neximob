"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useOptimistic, useState, useTransition } from "react";
import { TabsAcessiveis, type TabItem } from "@/components/ui/tabs-acessiveis";
import { useToast } from "@/components/ui/toast-region";
import { ModalConfirmarExclusao } from "@/features/clientes/modal-confirmar-exclusao";
import { ModalFormularioCliente } from "@/features/clientes/modal-formulario-cliente";
import { AbaCobrancas } from "@/features/cobrancas/aba-cobrancas";
import { ModalAjustarValor } from "@/features/cobrancas/modal-ajustar-valor";
import { ModalCobrar } from "@/features/cobrancas/modal-cobrar";
import { ModalEnviosCliente } from "@/features/cobrancas/modal-envios-cliente";
import { ModalMarcarPago } from "@/features/cobrancas/modal-marcar-pago";
import { MenuContaPopover } from "@/features/conta/menu-conta-popover";
import { ModalMeusDadosConta } from "@/features/conta/modal-meus-dados-conta";
import { AbaObrigacoes } from "@/features/obrigacoes/aba-obrigacoes";
import { AbaRegua } from "@/features/regua/aba-regua";
import { normalizarFiltroCobranca, type FiltroCobranca } from "@/lib/cobrancas-filter";
import type {
  CobrancaDoMesRow,
  FormaPagamento,
  ReguaRow,
  ResumoDoMesRow,
} from "@/lib/database.types";
import { compararDias, mesParametro } from "@/lib/dates";
import {
  arquivarClienteAction,
  excluirClienteAction,
  reativarClienteAction,
} from "@/server/actions/clientes";
import {
  desfazerPagamentoAction,
  marcarPagamentoAction,
} from "@/server/actions/cobrancas";
import type { PainelMensalData } from "@/server/queries/painel";
import { ResumoMesStrip } from "./resumo-mes-strip";
import { TopBar } from "./top-bar";

export type AbaPainel = "cobrancas" | "obrigacoes" | "regua";

export function normalizarAbaPainel(raw?: string | null): AbaPainel {
  if (raw === "obrigacoes" || raw === "regua") return raw;
  return "cobrancas";
}

interface PainelUnicoShellProps {
  dadosIniciais: PainelMensalData;
  abaInicial: AbaPainel;
  filtroInicial: FiltroCobranca;
}

type AcaoOtimistaCobranca =
  | { tipo: "pagar"; cobrancaId: string; forma: FormaPagamento; pagoEm: string }
  | { tipo: "desfazer"; cobrancaId: string };

function recalcularSituacaoNaoPaga(vencimentoIso: string, hojeIso: string): {
  situacao: CobrancaDoMesRow["situacao"];
  diasAtraso: number;
} {
  const diff = compararDias(hojeIso, vencimentoIso);
  if (diff > 0) return { situacao: "atrasado", diasAtraso: diff };
  if (diff === 0) return { situacao: "vence_hoje", diasAtraso: 0 };
  return { situacao: "a_vencer", diasAtraso: 0 };
}

function atualizarUrlSemNavegar(mesIso: string, aba: AbaPainel, filtro: FiltroCobranca) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  params.set("mes", mesParametro(mesIso));
  if (aba === "cobrancas") {
    params.delete("aba");
  } else {
    params.set("aba", aba);
  }
  if (filtro === "todos" || aba !== "cobrancas") {
    params.delete("filtro");
  } else {
    params.set("filtro", filtro);
  }
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `/?${qs}` : "/");
}

export function PainelUnicoShell({
  dadosIniciais,
  abaInicial,
  filtroInicial,
}: PainelUnicoShellProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [, startMesTransition] = useTransition();

  const mesCorrenteIso = `${dadosIniciais.hojeIso.slice(0, 7)}-01`;

  const [abaAtiva, setAbaAtiva] = useState<AbaPainel>(abaInicial);
  const [filtro, setFiltro] = useState<FiltroCobranca>(normalizarFiltroCobranca(filtroInicial));
  const [busca, setBusca] = useState("");
  const [pendenteId, setPendenteId] = useState<string | null>(null);

  const [nomeContador, setNomeContador] = useState(dadosIniciais.contador.nome);
  const [chavePix, setChavePix] = useState<string | null>(dadosIniciais.contador.chave_pix);
  const [textoPendencia, setTextoPendencia] = useState(dadosIniciais.contador.texto_pendencia);
  const [passosRegua, setPassosRegua] = useState<ReguaRow[]>(dadosIniciais.passosRegua);

  // Modais
  const [modalClienteAberto, setModalClienteAberto] = useState(false);
  const [clienteIdEdicao, setClienteIdEdicao] = useState<string | null>(null);
  const [cobrancaMarcarPago, setCobrancaMarcarPago] = useState<CobrancaDoMesRow | null>(null);
  const [cobrancaCobrar, setCobrancaCobrar] = useState<CobrancaDoMesRow | null>(null);
  const [cobrancaAjustar, setCobrancaAjustar] = useState<CobrancaDoMesRow | null>(null);
  const [cobrancaEnvios, setCobrancaEnvios] = useState<CobrancaDoMesRow | null>(null);
  const [clienteParaArquivar, setClienteParaArquivar] = useState<CobrancaDoMesRow | null>(null);
  const [arquivando, setArquivando] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<CobrancaDoMesRow | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [modalMeusDadosAberto, setModalMeusDadosAberto] = useState(false);

  const [cobrancasOtimistas, aplicarOtimista] = useOptimistic(
    dadosIniciais.cobrancas,
    (estadoAtual, acao: AcaoOtimistaCobranca) => {
      return estadoAtual.map((item) => {
        if (item.cobranca_id !== acao.cobrancaId) return item;
        if (acao.tipo === "pagar") {
          return {
            ...item,
            situacao: "pago" as const,
            dias_atraso: 0,
            pago_em: acao.pagoEm,
            forma: acao.forma,
          };
        }
        const { situacao, diasAtraso } = recalcularSituacaoNaoPaga(
          item.vencimento,
          dadosIniciais.hojeIso,
        );
        return {
          ...item,
          situacao,
          dias_atraso: diasAtraso,
          pago_em: null,
          forma: null,
        };
      });
    },
  );

  const metricasResumo = useMemo(() => {
    let recebido = 0;
    let aReceber = 0;
    let cobrancasEmAberto = 0;
    let clientesEmAtraso = 0;
    let valorEmAtraso = 0;

    for (const c of cobrancasOtimistas) {
      const total = Number(c.total);
      const anteriores = Number(c.total_em_aberto_anteriores ?? 0);
      if (c.situacao === "pago") {
        recebido += total;
      } else {
        aReceber += total;
        cobrancasEmAberto += 1;
      }
      if (c.situacao === "atrasado" || c.meses_em_aberto_anteriores > 0) {
        clientesEmAtraso += 1;
        valorEmAtraso += (c.situacao === "atrasado" ? total : 0) + anteriores;
      }
    }

    const previsto = recebido + aReceber;
    const percentual = previsto > 0 ? Math.round((recebido / previsto) * 100) : 0;

    const resumo: ResumoDoMesRow = {
      ...dadosIniciais.resumo,
      recebido,
      a_receber: aReceber,
      percentual_recebido: percentual,
      clientes_em_atraso: clientesEmAtraso,
    };

    const guiasTotais = dadosIniciais.obrigacoes.reduce(
      (acc, ob) => acc + Number(ob.total_clientes ?? 0),
      0,
    );
    const pendentesPrazo = dadosIniciais.obrigacoes
      .filter((ob) => ob.situacao_prazo !== "concluida" && ob.situacao_prazo !== "sem_clientes")
      .sort((a, b) => a.prazo.localeCompare(b.prazo));
    const proximoPrazoGuia = pendentesPrazo[0]?.prazo ?? null;

    return {
      resumo,
      cobrancasEmAberto,
      valorEmAtraso,
      guiasTotais,
      proximoPrazoGuia,
    };
  }, [cobrancasOtimistas, dadosIniciais.resumo, dadosIniciais.obrigacoes]);

  const tabs: ReadonlyArray<TabItem<AbaPainel>> = useMemo(
    () => [
      { id: "cobrancas", label: "Cobranças", count: cobrancasOtimistas.length },
      {
        id: "obrigacoes",
        label: "Obrigações",
        count: dadosIniciais.resumo.guias_a_fazer,
      },
      { id: "regua", label: "Régua de cobrança" },
    ],
    [cobrancasOtimistas.length, dadosIniciais.resumo.guias_a_fazer],
  );

  const atualizarPainel = useCallback(() => {
    router.refresh();
  }, [router]);

  function handleTrocarMes(novoMesIso: string) {
    const params = new URLSearchParams();
    params.set("mes", mesParametro(novoMesIso));
    if (abaAtiva !== "cobrancas") params.set("aba", abaAtiva);
    if (abaAtiva === "cobrancas" && filtro !== "todos") params.set("filtro", filtro);
    startMesTransition(() => {
      router.push(`/?${params.toString()}`);
    });
  }

  function handleMudarAba(novaAba: AbaPainel) {
    setAbaAtiva(novaAba);
    atualizarUrlSemNavegar(dadosIniciais.mesIso, novaAba, filtro);
  }

  function handleMudarFiltro(novoFiltro: FiltroCobranca) {
    setFiltro(novoFiltro);
    atualizarUrlSemNavegar(dadosIniciais.mesIso, abaAtiva, novoFiltro);
  }

  function abrirNovoCliente() {
    setClienteIdEdicao(null);
    setModalClienteAberto(true);
  }

  async function handleDesfazerPago(linha: CobrancaDoMesRow) {
    setPendenteId(linha.cobranca_id);
    aplicarOtimista({ tipo: "desfazer", cobrancaId: linha.cobranca_id });

    const res = await desfazerPagamentoAction(linha.cobranca_id);
    setPendenteId(null);

    if (!res.ok) {
      showToast(res.error, { kind: "error" });
      router.refresh();
      return;
    }

    showToast(`Pagamento de ${linha.cliente_nome} desfeito.`);
    router.refresh();
  }

  async function handleConfirmarPago(
    linha: CobrancaDoMesRow,
    forma: FormaPagamento,
    data: string,
  ) {
    setPendenteId(linha.cobranca_id);
    setCobrancaMarcarPago(null);
    aplicarOtimista({
      tipo: "pagar",
      cobrancaId: linha.cobranca_id,
      forma,
      pagoEm: data,
    });

    const res = await marcarPagamentoAction({
      cobrancaId: linha.cobranca_id,
      forma,
      data,
    });
    setPendenteId(null);

    if (!res.ok) {
      showToast(res.error, { kind: "error" });
      router.refresh();
      return;
    }

    showToast(`Pagamento de ${linha.cliente_nome} registrado.`, {
      undoLabel: "Desfazer",
      durationMs: 6000,
      onUndo: () => {
        void handleDesfazerPago(linha);
      },
    });
    router.refresh();
  }

  async function handleConfirmarArquivarCliente() {
    if (!clienteParaArquivar) return;
    const alvo = clienteParaArquivar;
    setArquivando(true);

    const res = await arquivarClienteAction(alvo.cliente_id);
    setArquivando(false);
    setClienteParaArquivar(null);

    if (!res.ok) {
      showToast(res.error, { kind: "error" });
      return;
    }

    showToast(`Cliente ${alvo.cliente_nome} inativado.`, {
      undoLabel: "Desfazer",
      durationMs: 6000,
      onUndo: () => {
        void reativarClienteAction(alvo.cliente_id, dadosIniciais.mesIso).then((r) => {
          if (!r.ok) {
            showToast(r.error, { kind: "error" });
          } else {
            showToast(`Cliente ${alvo.cliente_nome} reativado.`);
            router.refresh();
          }
        });
      },
    });
    router.refresh();
  }

  async function handleConfirmarExcluirCliente() {
    if (!clienteParaExcluir) return;
    const alvo = clienteParaExcluir;
    setExcluindo(true);

    const res = await excluirClienteAction(alvo.cliente_id);
    setExcluindo(false);
    setClienteParaExcluir(null);

    if (!res.ok) {
      showToast(res.error, { kind: "error" });
      return;
    }

    showToast(`Cliente ${alvo.cliente_nome} excluído.`);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[var(--nx-bg)]">
      <TopBar
        mesIso={dadosIniciais.mesIso}
        mesCorrenteIso={mesCorrenteIso}
        nomeContador={nomeContador}
        onTrocarMes={handleTrocarMes}
        onNovoCliente={abrirNovoCliente}
        accountMenuSlot={
          <MenuContaPopover
            nomeContador={nomeContador}
            emailUsuario={dadosIniciais.emailUsuario}
            onAbrirMeusDados={() => setModalMeusDadosAberto(true)}
          />
        }
      />

      <main
        id="conteudo-principal"
        className="mx-auto max-w-[1152px] space-y-6 px-4 pt-[22px] pb-[92px] md:px-8 md:pt-[30px] md:pb-14 lg:px-12"
      >
        <ResumoMesStrip
          mesIso={dadosIniciais.mesIso}
          mesCorrenteIso={mesCorrenteIso}
          resumo={metricasResumo.resumo}
          cobrancasEmAberto={metricasResumo.cobrancasEmAberto}
          valorEmAtraso={metricasResumo.valorEmAtraso}
          guiasTotais={metricasResumo.guiasTotais}
          proximoPrazoGuia={metricasResumo.proximoPrazoGuia}
          possuiChavePix={Boolean(chavePix && chavePix.trim())}
          qtdClientesAtivos={dadosIniciais.qtdClientesAtivos}
          onVoltarMesAtual={() => handleTrocarMes(mesCorrenteIso)}
          onIrParaAtrasados={() => {
            setAbaAtiva("cobrancas");
            setFiltro("em_atraso");
            atualizarUrlSemNavegar(dadosIniciais.mesIso, "cobrancas", "em_atraso");
          }}
          onIrParaObrigacoes={() => handleMudarAba("obrigacoes")}
          onAbrirMeusDados={() => setModalMeusDadosAberto(true)}
        />

        <nav aria-label="Navegação principal">
          <TabsAcessiveis
            tabs={tabs}
            activeTab={abaAtiva}
            onChange={handleMudarAba}
            ariaLabel="Seções do painel mensal"
          />
        </nav>

        <div
          role="tabpanel"
          id={`panel-${abaAtiva}`}
          aria-labelledby={`tab-${abaAtiva}`}
        >
          {abaAtiva === "cobrancas" ? (
            <AbaCobrancas
              mesIso={dadosIniciais.mesIso}
              hojeIso={dadosIniciais.hojeIso}
              cobrancas={cobrancasOtimistas}
              qtdClientesAtivos={dadosIniciais.qtdClientesAtivos}
              filtro={filtro}
              busca={busca}
              pendenteId={pendenteId}
              onMudarFiltro={handleMudarFiltro}
              onMudarBusca={setBusca}
              onNovoCliente={abrirNovoCliente}
              onMarcarPago={(linha) => setCobrancaMarcarPago(linha)}
              onDesfazerPago={(linha) => void handleDesfazerPago(linha)}
              onCobrar={(linha) => setCobrancaCobrar(linha)}
              onAjustarValor={(linha) => setCobrancaAjustar(linha)}
              onVerEnvios={(linha) => setCobrancaEnvios(linha)}
              onEditarCliente={(linha) => {
                setClienteIdEdicao(linha.cliente_id);
                setModalClienteAberto(true);
              }}
              onArquivarCliente={(linha) => setClienteParaArquivar(linha)}
              onExcluirCliente={(linha) => setClienteParaExcluir(linha)}
            />
          ) : null}

          {abaAtiva === "obrigacoes" ? (
            <AbaObrigacoes
              mesIso={dadosIniciais.mesIso}
              obrigacoes={dadosIniciais.obrigacoes}
              proximosPrazos={dadosIniciais.proximosPrazos}
              qtdClientesAtivos={dadosIniciais.qtdClientesAtivos}
              onAtualizarPainel={atualizarPainel}
            />
          ) : null}

          {abaAtiva === "regua" ? (
            <AbaRegua
              mesIso={dadosIniciais.mesIso}
              nomeContador={nomeContador}
              chavePix={chavePix}
              textoPendencia={textoPendencia}
              passos={passosRegua}
              onAtualizarChavePix={(nova) => {
                setChavePix(nova);
                router.refresh();
              }}
              onPassoSalvo={(atualizado) => {
                setPassosRegua((prev) =>
                  prev.map((p) => (p.id === atualizado.id ? atualizado : p)),
                );
              }}
              onTextoPendenciaSalvo={(novo) => setTextoPendencia(novo)}
            />
          ) : null}
        </div>
      </main>

      {/* Barra inferior fixa no polegar para celular (< 768px — DV-02) */}
      <div className="fixed inset-x-0 bottom-0 z-25 border-t border-[var(--nx-border)] bg-[var(--nx-header-bg)] px-4 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom,0px))] backdrop-blur-md md:hidden">
        <button
          type="button"
          onClick={abrirNovoCliente}
          className="inline-flex h-[46px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-[6px] border-[1.5px] border-[var(--nx-accent-border)] bg-[var(--nx-accent-btn-bg)] px-4 text-[14px] font-semibold text-[var(--nx-accent-fg)] shadow-[var(--nx-shadow-popover)] transition hover:bg-[var(--nx-accent-hover)]"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Novo cliente</span>
        </button>
      </div>

      <ModalMarcarPago
        cobranca={cobrancaMarcarPago}
        hojeIso={dadosIniciais.hojeIso}
        pendente={Boolean(
          cobrancaMarcarPago && pendenteId === cobrancaMarcarPago.cobranca_id,
        )}
        onClose={() => setCobrancaMarcarPago(null)}
        onConfirmar={(linha, forma, data) => void handleConfirmarPago(linha, forma, data)}
      />

      <ModalCobrar
        cobranca={cobrancaCobrar}
        onClose={() => setCobrancaCobrar(null)}
        onEnvioRegistrado={atualizarPainel}
      />

      <ModalAjustarValor
        cobranca={cobrancaAjustar}
        onClose={() => setCobrancaAjustar(null)}
        onAjustado={atualizarPainel}
      />

      <ModalEnviosCliente
        cobranca={cobrancaEnvios}
        onClose={() => setCobrancaEnvios(null)}
      />

      <ModalFormularioCliente
        open={modalClienteAberto}
        clienteIdEdicao={clienteIdEdicao}
        mesAtualVisualizado={dadosIniciais.mesIso}
        onClose={() => {
          setModalClienteAberto(false);
          setClienteIdEdicao(null);
        }}
        onSalvo={atualizarPainel}
      />

      <ModalConfirmarExclusao
        open={Boolean(clienteParaArquivar)}
        titulo="Inativar cliente"
        descricao={
          clienteParaArquivar
            ? `${clienteParaArquivar.cliente_nome} deixará de receber novas cobranças e não entrará nas próximas obrigações, mantendo todo o histórico salvo.`
            : ""
        }
        confirmLabel="Inativar cliente"
        pendente={arquivando}
        onClose={() => setClienteParaArquivar(null)}
        onConfirmar={() => void handleConfirmarArquivarCliente()}
      />

      <ModalConfirmarExclusao
        open={Boolean(clienteParaExcluir)}
        titulo="Confirmar exclusão de cliente"
        descricao={
          clienteParaExcluir
            ? `Excluir ${clienteParaExcluir.cliente_nome} apaga também todas as cobranças, envios e marcações de guias deste cliente. Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir cliente"
        pendente={excluindo}
        onClose={() => setClienteParaExcluir(null)}
        onConfirmar={() => void handleConfirmarExcluirCliente()}
      />

      <ModalMeusDadosConta
        open={modalMeusDadosAberto}
        nomeInicial={nomeContador}
        chavePixInicial={chavePix}
        emailUsuario={dadosIniciais.emailUsuario}
        onClose={() => setModalMeusDadosAberto(false)}
        onPerfilSalvo={({ nome, chavePix: novaChave }) => {
          setNomeContador(nome);
          setChavePix(novaChave);
          router.refresh();
        }}
      />
    </div>
  );
}
