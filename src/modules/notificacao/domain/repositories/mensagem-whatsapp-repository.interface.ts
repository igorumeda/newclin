export type DirecaoMensagem = 'entrada' | 'saida';

export type RegistrarMensagemParams = {
  redeId: string;
  direcao: DirecaoMensagem;
  telefone: string;
  conteudo: string;
  provider: string;
  providerMessageId: string | null;
  agendamentoId?: string | null;
  pacienteId?: string | null;
  payload?: Record<string, unknown>;
};
export type ListarMensagensParams = { redeId: string; telefone?: string | null; limite?: number };
export type MensagemWhatsAppRegistro = {
  id: string;
  direcao: DirecaoMensagem;
  telefone: string;
  conteudo: string;
  provider: string;
  criadoEm: string;
};
export type BuscarAgendamentoPorTelefoneParams = { telefone: string };
export type AgendamentoPorTelefone = {
  redeId: string;
  agendamentoId: string;
  pacienteId: string;
  status: string;
};

export interface IMensagemWhatsAppRepository {
  registrar(params: RegistrarMensagemParams): Promise<void>;
  listar(params: ListarMensagensParams): Promise<MensagemWhatsAppRegistro[]>;
  buscarProximoAgendamentoPorTelefone(
    params: BuscarAgendamentoPorTelefoneParams,
  ): Promise<AgendamentoPorTelefone | null>;
  atualizarStatusAgendamento(params: AtualizarStatusPorWebhookParams): Promise<void>;
}

export type AtualizarStatusPorWebhookParams = {
  redeId: string;
  agendamentoId: string;
  status: string;
  motivo?: string | null;
};

export const MENSAGEM_WHATSAPP_REPOSITORY = Symbol('IMensagemWhatsAppRepository');
