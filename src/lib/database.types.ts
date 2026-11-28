export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TipoCliente = "MEI" | "SIMPLES" | "PF";
export type Periodicidade = "mensal" | "anual";
export type Competencia = "periodo_anterior" | "mesmo_periodo";
export type CanalEnvio = "email" | "whatsapp" | "manual";
export type StatusEnvio =
  | "pendente"
  | "enviando"
  | "enviado"
  | "falhou"
  | "pulado"
  | "cancelado"
  | "entregue"
  | "lido";
export type FormaPagamento = "pix" | "transferencia" | "dinheiro" | "outro";
export type SituacaoEmail = "ok" | "devolvido" | "spam";
export type SituacaoCobranca = "pago" | "a_vencer" | "vence_hoje" | "atrasado";
export type SituacaoPrazo = "a_vencer" | "vence_hoje" | "vencida" | "concluida" | "sem_clientes";
export type TipoMensagemRegua = "passo" | "pendencia";

export type ContadorRow = {
  id: string;
  nome: string;
  email: string;
  chave_pix: string | null;
  plano: string;
  termos_versao: string | null;
  termos_aceitos_em: string | null;
  texto_pendencia: string;
  criado_em: string;
};

export type ClienteRow = {
  id: string;
  contador_id: string;
  nome: string;
  tipo: TipoCliente;
  honorario: number;
  dia_vencimento: number;
  cobranca_inicio: string;
  telefone: string | null;
  email: string | null;
  email_situacao: SituacaoEmail;
  canais: CanalEnvio[];
  ativo: boolean;
  provedor_cliente_id: string | null;
  criado_em: string;
};

export type CobrancaRow = {
  id: string;
  contador_id: string;
  cliente_id: string;
  mes: string;
  vencimento: string;
  valor: number;
  extra: number;
  motivo_extra: string | null;
  pago_em: string | null;
  forma: FormaPagamento | null;
  provedor_cobranca_id: string | null;
  criado_em: string;
};

export type ReguaRow = {
  id: string;
  contador_id: string;
  dias: -3 | 0 | 3 | 7;
  nome: string;
  ativo: boolean;
  texto: string;
};

export type ObrigacaoRow = {
  id: string;
  contador_id: string;
  padrao_id: string | null;
  nome: string;
  tipos_cliente: TipoCliente[];
  periodicidade: Periodicidade;
  prazo_dia: number;
  prazo_mes: number | null;
  competencia: Competencia;
  personalizada: boolean;
  ativo: boolean;
};

export type EnvioRow = {
  id: string;
  contador_id: string;
  cliente_id: string;
  mes: string;
  regua_id: string;
  canal: CanalEnvio;
  status: StatusEnvio;
  tentativas: number;
  proxima_tentativa_em: string | null;
  enviado_em: string | null;
  erro: string | null;
  provedor_mensagem_id: string | null;
  criado_em: string;
  tipo: TipoMensagemRegua;
  reservado_em: string | null;
};

export type ResumoDoMesRow = {
  mes: string;
  recebido: number;
  a_receber: number;
  percentual_recebido: number;
  em_aberto_meses_anteriores: number;
  clientes_em_atraso: number;
  guias_a_fazer: number;
};

export type CobrancaDoMesRow = {
  cobranca_id: string;
  cliente_id: string;
  cliente_nome: string;
  tipo: TipoCliente;
  mes: string;
  vencimento: string;
  valor: number;
  extra: number;
  total: number;
  motivo_extra: string | null;
  situacao: SituacaoCobranca;
  dias_atraso: number;
  pago_em: string | null;
  forma: FormaPagamento | null;
  meses_em_aberto_anteriores: number;
  total_em_aberto_anteriores: number;
  proximo_lembrete: string | null;
  proximo_lembrete_tipo: TipoMensagemRegua | null;
  sem_contato: boolean;
  email_situacao: SituacaoEmail;
};

export type ObrigacaoDoMesRow = {
  obrigacao_id: string;
  nome: string;
  periodicidade: Periodicidade;
  prazo: string;
  periodo: string;
  competencia: string;
  total_clientes: number;
  feitos: number;
  situacao_prazo: SituacaoPrazo;
  dias_para_o_prazo: number;
};

export type ClienteDaObrigacaoRow = {
  cliente_id: string;
  nome: string;
  tipo: TipoCliente;
  feito: boolean;
  feito_em: string | null;
};

export type MensagemParaCobrarRow = {
  regua_id: string;
  dias: number;
  assunto: string;
  texto: string;
  cobrancas: string[];
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      contadores: {
        Row: ContadorRow;
        Insert: {
          id: string;
          nome: string;
          email: string;
          chave_pix?: string | null;
          plano?: string;
          termos_versao?: string | null;
          termos_aceitos_em?: string | null;
          texto_pendencia?: string;
        };
        Update: {
          nome?: string;
          chave_pix?: string | null;
          termos_versao?: string | null;
          termos_aceitos_em?: string | null;
          texto_pendencia?: string;
        };
        Relationships: [];
      };
      clientes: {
        Row: ClienteRow;
        Insert: {
          id?: string;
          contador_id?: string;
          nome: string;
          tipo: TipoCliente;
          honorario: number;
          dia_vencimento: number;
          cobranca_inicio?: string;
          telefone?: string | null;
          email?: string | null;
          canais?: CanalEnvio[];
          ativo?: boolean;
        };
        Update: {
          nome?: string;
          tipo?: TipoCliente;
          honorario?: number;
          dia_vencimento?: number;
          cobranca_inicio?: string;
          telefone?: string | null;
          email?: string | null;
          canais?: CanalEnvio[];
          ativo?: boolean;
        };
        Relationships: [];
      };
      cobrancas: {
        Row: CobrancaRow;
        Insert: {
          id?: string;
          contador_id?: string;
          cliente_id: string;
          mes: string;
          vencimento: string;
          valor: number;
        };
        Update: {
          valor?: number;
          vencimento?: string;
          extra?: number;
          motivo_extra?: string | null;
          pago_em?: string | null;
          forma?: FormaPagamento | null;
        };
        Relationships: [];
      };
      regua: {
        Row: ReguaRow;
        Insert: never;
        Update: {
          ativo?: boolean;
          texto?: string;
        };
        Relationships: [];
      };
      obrigacoes_padrao: {
        Row: {
          id: string;
          ano: number;
          codigo: string;
          nome: string;
          tipos_cliente: TipoCliente[];
          periodicidade: Periodicidade;
          prazo_dia: number;
          prazo_mes: number | null;
          competencia: Competencia;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      obrigacoes: {
        Row: ObrigacaoRow;
        Insert: {
          id?: string;
          contador_id?: string;
          nome: string;
          tipos_cliente: TipoCliente[];
          periodicidade: Periodicidade;
          prazo_dia: number;
          prazo_mes?: number | null;
          competencia?: Competencia;
          personalizada?: boolean;
          ativo?: boolean;
        };
        Update: {
          nome?: string;
          tipos_cliente?: TipoCliente[];
          periodicidade?: Periodicidade;
          prazo_dia?: number;
          prazo_mes?: number | null;
          competencia?: Competencia;
          personalizada?: boolean;
          ativo?: boolean;
        };
        Relationships: [];
      };
      obrigacoes_feitas: {
        Row: {
          id: string;
          contador_id: string;
          obrigacao_id: string;
          cliente_id: string;
          periodo: string;
          feito_em: string;
        };
        Insert: {
          id?: string;
          contador_id?: string;
          obrigacao_id: string;
          cliente_id: string;
          periodo: string;
        };
        Update: never;
        Relationships: [];
      };
      envios: {
        Row: EnvioRow;
        Insert: {
          id?: string;
          contador_id?: string;
          cliente_id: string;
          mes: string;
          regua_id: string;
          canal: CanalEnvio;
          status?: StatusEnvio;
          enviado_em?: string | null;
          tipo?: TipoMensagemRegua;
        };
        Update: never;
        Relationships: [];
      };
      envio_cobrancas: {
        Row: {
          envio_id: string;
          cobranca_id: string;
          contador_id: string;
        };
        Insert: {
          envio_id: string;
          cobranca_id: string;
          contador_id?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      cobrancas_situacao: {
        Row: {
          id: string;
          contador_id: string;
          cliente_id: string;
          mes: string;
          vencimento: string;
          valor: number;
          extra: number;
          total: number;
          motivo_extra: string | null;
          pago_em: string | null;
          forma: FormaPagamento | null;
          situacao: SituacaoCobranca;
          dias_atraso: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      garantir_cobrancas: {
        Args: { p_mes: string };
        Returns: number;
      };
      resumo_do_mes: {
        Args: { p_mes: string };
        Returns: ResumoDoMesRow[];
      };
      cobrancas_do_mes: {
        Args: { p_mes: string; p_filtro?: string };
        Returns: CobrancaDoMesRow[];
      };
      registrar_pagamento: {
        Args: { p_cobranca_id: string; p_forma: FormaPagamento; p_data?: string };
        Returns: string;
      };
      desfazer_pagamento: {
        Args: { p_cobranca_id: string };
        Returns: undefined;
      };
      ajustar_valor_do_mes: {
        Args: { p_cobranca_id: string; p_extra: number; p_motivo?: string | null };
        Returns: number;
      };
      mensagem_para_cobrar: {
        Args: { p_cobranca_id: string };
        Returns: MensagemParaCobrarRow[];
      };
      registrar_envio_manual: {
        Args: { p_cobranca_id: string };
        Returns: string;
      };
      obrigacoes_do_mes: {
        Args: { p_mes: string };
        Returns: ObrigacaoDoMesRow[];
      };
      clientes_da_obrigacao: {
        Args: { p_obrigacao_id: string; p_mes: string };
        Returns: ClienteDaObrigacaoRow[];
      };
      marcar_obrigacao: {
        Args: { p_obrigacao_id: string; p_cliente_id: string; p_mes: string; p_feito?: boolean };
        Returns: boolean;
      };
      proximos_prazos: {
        Args: { p_a_partir?: string; p_meses?: number };
        Returns: ObrigacaoDoMesRow[];
      };
      campos_desconhecidos: {
        Args: { p_texto: string };
        Returns: string[];
      };
      previa_mensagem: {
        Args: { p_texto: string; p_tipo?: string };
        Returns: string;
      };
      restaurar_texto_padrao: {
        Args: { p_regua_id: string };
        Returns: string;
      };
      restaurar_texto_pendencia: {
        Args: Record<string, never>;
        Returns: string;
      };
      aceitar_termos: {
        Args: { p_versao: string };
        Returns: string;
      };
      exportar_meus_dados: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: {
      tipo_cliente: TipoCliente;
      periodicidade: Periodicidade;
      competencia: Competencia;
      canal_envio: CanalEnvio;
      status_envio: StatusEnvio;
      forma_pagamento: FormaPagamento;
      situacao_email: SituacaoEmail;
      situacao_cobranca: SituacaoCobranca;
    };
    CompositeTypes: Record<string, never>;
  };
};
