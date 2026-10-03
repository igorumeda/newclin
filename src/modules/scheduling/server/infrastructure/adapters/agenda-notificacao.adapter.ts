import type { NotificacaoDispatcher } from '@/modules/notification/application/services/notificacao-dispatcher.service';
import type { CancelarNotificacoesAgendamentoUseCase } from '@/modules/notification/application/use-cases/cancelar-notificacoes-agendamento/cancelar-notificacoes-agendamento.use-case';
import type {
  DadosNotificacaoAgendamento,
  IAgendaNotificacaoPort,
  ResultadoEnfileiramento,
} from '../../../domain/services/agenda-notificacao.interface';

export type AgendaNotificacaoAdapterDependencies = {
  dispatcher: NotificacaoDispatcher;
  cancelarNotificacoes: CancelarNotificacoesAgendamentoUseCase;
};

/**
 * Adaptador da agenda para o módulo de notificações (§4.1/§4.2).
 * Vive na infraestrutura: troca a mensagem da agenda pelo contrato de fila do
 * módulo de notificações sem que o domínio conheça canais ou provedores.
 */
export class AgendaNotificacaoAdapter implements IAgendaNotificacaoPort {
  private readonly dispatcher: NotificacaoDispatcher;
  private readonly cancelarNotificacoes: CancelarNotificacoesAgendamentoUseCase;

  constructor(dependencies: AgendaNotificacaoAdapterDependencies) {
    this.dispatcher = dependencies.dispatcher;
    this.cancelarNotificacoes = dependencies.cancelarNotificacoes;
  }

  async confirmacaoAgendamento(dados: DadosNotificacaoAgendamento): Promise<ResultadoEnfileiramento> {
    return this.converter(await this.dispatcher.confirmacaoAgendamento(dados));
  }

  async lembreteAgendamento(dados: DadosNotificacaoAgendamento): Promise<ResultadoEnfileiramento> {
    return this.converter(await this.dispatcher.lembreteAgendamento(dados));
  }

  async cancelamentoAgendamento(
    dados: DadosNotificacaoAgendamento,
    motivo?: string | null,
  ): Promise<ResultadoEnfileiramento> {
    return this.converter(await this.dispatcher.cancelamentoAgendamento(dados, motivo ?? null));
  }

  async cancelarNotificacoesPendentes(params: {
    agendamentoId: string;
    motivo: string;
  }): Promise<number> {
    const resultado = await this.cancelarNotificacoes.execute({
      agendamentoId: params.agendamentoId,
      motivo: params.motivo,
    });

    return resultado.isSuccess ? resultado.value.canceladas : 0;
  }

  private converter(resultado: {
    enfileiradas: unknown[];
    canalEscolhido: string | null;
    motivo: string | null;
  }): ResultadoEnfileiramento {
    return {
      enfileiradas: resultado.enfileiradas.length,
      canalEscolhido: resultado.canalEscolhido,
      motivo: resultado.motivo,
    };
  }
}
