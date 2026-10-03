import type {
  CanalNotificacao,
  RespostaAcao,
  StatusNotificacao,
  TipoNotificacao,
  VariaveisMensagem,
} from '../../domain/value-objects/tipos.vo';

export type NotificacaoDto = {
  id: string;
  redeId: string;
  agendamentoId: string | null;
  pacienteId: string | null;
  atendimentoId: string | null;
  documentoId: string | null;
  canal: CanalNotificacao;
  canalLabel: string;
  tipo: TipoNotificacao;
  tipoLabel: string;
  destinatario: string;
  remetente: string | null;
  assunto: string | null;
  conteudo: string;
  status: StatusNotificacao;
  statusLabel: string;
  provider: string | null;
  providerMessageId: string | null;
  tentativas: number;
  ultimoErro: string | null;
  agendadaPara: string;
  enviadaEm: string | null;
  entregueEm: string | null;
  respondidaEm: string | null;
  resposta: string | null;
  respostaAcao: RespostaAcao | null;
  createdAt: string;
};

export type ModeloMensagemDto = {
  id: string;
  redeId: string;
  canal: CanalNotificacao;
  canalLabel: string;
  tipo: TipoNotificacao;
  tipoLabel: string;
  assunto: string | null;
  corpo: string;
  ativo: boolean;
  isPadrao: boolean;
  variaveis: string[];
  createdAt: string;
  updatedAt: string;
};

export type EnfileirarNotificacaoInputDto = {
  redeId: string;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
  destinatario: string;
  variaveis: VariaveisMensagem;
  assunto?: string | null;
  agendamentoId?: string | null;
  pacienteId?: string | null;
  atendimentoId?: string | null;
  documentoId?: string | null;
  agendadaPara?: string | null;
  createdBy?: string | null;
  /** Quando o canal é WhatsApp, envia os botões de confirmação/cancelamento. */
  botoes?: { acao: RespostaAcao; label: string }[];
};

export type EnfileirarNotificacaoOutputDto = { notificacoes: NotificacaoDto[] };

export type EnviarNotificacaoInputDto = { notificacaoId: string };
export type EnviarNotificacaoOutputDto = NotificacaoDto;

export type ProcessarFilaNotificacoesInputDto = {
  limite?: number;
  redeId?: string | null;
  /** Permite reenviar itens específicos (ação manual do gestor). */
  notificacaoIds?: string[];
};

export type ProcessarFilaNotificacoesDetalheDto = {
  id: string;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
  destinatario: string;
  status: StatusNotificacao;
  erro: string | null;
  fallbackEmail: boolean;
};

export type ProcessarFilaNotificacoesOutputDto = {
  processadas: number;
  enviadas: number;
  falhas: number;
  detalhes: ProcessarFilaNotificacoesDetalheDto[];
};

export type EnfileirarLembretesInputDto = {
  redeId?: string | null;
  horasAntecedencia?: number;
  limite?: number;
};

export type EnfileirarLembretesDetalheDto = {
  agendamentoId: string;
  pacienteId: string;
  canal: CanalNotificacao | null;
  enfileirado: boolean;
  motivo: string | null;
};

export type EnfileirarLembretesOutputDto = {
  agendamentosAnalisados: number;
  lembretesEnfileirados: number;
  detalhes: EnfileirarLembretesDetalheDto[];
};

export type ListarNotificacoesInputDto = {
  redeId: string;
  agendamentoId?: string | null;
  pacienteId?: string | null;
  canal?: CanalNotificacao | null;
  tipo?: TipoNotificacao | null;
  status?: StatusNotificacao | null;
  de?: string | null;
  ate?: string | null;
  page: number;
  perPage: number;
};

export type ListarNotificacoesOutputDto = {
  items: NotificacaoDto[];
  total: number;
  page: number;
  perPage: number;
};

export type ListarModelosMensagemInputDto = { redeId: string };
export type ListarModelosMensagemOutputDto = { items: ModeloMensagemDto[] };

export type SalvarModeloMensagemInputDto = {
  redeId: string;
  canal: CanalNotificacao;
  tipo: TipoNotificacao;
  assunto?: string | null;
  corpo: string;
  ativo?: boolean;
};

export type SalvarModeloMensagemOutputDto = ModeloMensagemDto;

export type CancelarNotificacoesAgendamentoInputDto = {
  agendamentoId: string;
  motivo?: string | null;
  ignorarTipos?: TipoNotificacao[];
};

export type CancelarNotificacoesAgendamentoOutputDto = { canceladas: number };

export type ProcessarRespostaWhatsappInputDto = {
  payload: unknown;
  payloadBruto: string;
  assinatura: string | null;
};

export type ProcessarRespostaWhatsappDetalheDto = {
  telefone: string;
  acao: RespostaAcao | null;
  notificacaoId: string | null;
  agendamentoId: string | null;
  aplicado: boolean;
  statusNovo: string | null;
  motivo: string | null;
};

export type ProcessarRespostaWhatsappOutputDto = {
  assinaturaValida: boolean;
  processadas: number;
  detalhes: ProcessarRespostaWhatsappDetalheDto[];
};

/** Contexto compartilhado pelas fábricas de mensagem do dispatcher. */
export type ContatoNotificacaoDto = {
  pacienteId: string;
  pacienteNome: string;
  telefone?: string | null;
  email?: string | null;
};

export type UnidadeNotificacaoDto = {
  nome: string;
  enderecoCompleto: string;
  telefone?: string | null;
};

export type DadosAgendamentoNotificacaoDto = {
  redeId: string;
  redeNome: string;
  agendamentoId: string;
  data: string;
  hora: string;
  profissionalNome: string;
  profissionalEspecialidade?: string | null;
  paciente: ContatoNotificacaoDto;
  unidade: UnidadeNotificacaoDto;
  unidadeId?: string | null;
  createdBy?: string | null;
  agendadaPara?: string | null;
};

export type DadosDocumentoNotificacaoDto = {
  redeId: string;
  redeNome: string;
  documentoId: string;
  atendimentoId?: string | null;
  paciente: ContatoNotificacaoDto;
  profissionalNome: string;
  tipoDocumento: string;
  dataEmissao: string;
  linkDocumento?: string | null;
  createdBy?: string | null;
};
