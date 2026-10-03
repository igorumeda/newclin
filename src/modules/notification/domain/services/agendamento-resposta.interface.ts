import type { RespostaAcao } from '../value-objects/tipos.vo';

export type AplicarRespostaAgendamentoParams = {
  agendamentoId: string;
  acao: RespostaAcao;
  origem: 'whatsapp' | 'email';
  observacao?: string | null;
};

export type AplicarRespostaAgendamentoResultado = {
  aplicado: boolean;
  statusAnterior: string | null;
  statusNovo: string | null;
  motivo: string | null;
};

/**
 * Porta de saída que aplica a resposta do paciente ao agendamento.
 * O contrato de status pertence ao módulo de agenda; aqui só o resultado importa.
 */
export interface IAgendamentoRespostaPort {
  aplicarRespostaPaciente(
    params: AplicarRespostaAgendamentoParams,
  ): Promise<AplicarRespostaAgendamentoResultado>;
}

export const AGENDAMENTO_RESPOSTA_PORT = Symbol('IAgendamentoRespostaPort');
