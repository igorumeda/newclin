import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IMensagemWhatsAppRepository } from '../../../domain/repositories/mensagem-whatsapp-repository.interface';
import type { IWhatsAppProvider } from '../../../domain/services/whatsapp-provider.interface';
import type { ProcessarWebhookWhatsAppInputDto } from './processar-webhook-whatsapp.input.dto';

export type ProcessarWebhookWhatsAppDependencies = {
  whatsappProvider: IWhatsAppProvider;
  mensagemWhatsAppRepository: IMensagemWhatsAppRepository;
};

export type ProcessarWebhookWhatsAppOutputDto = {
  recebidas: number;
  confirmados: number;
  cancelados: number;
};

type InterpretarRespostaParams = { mensagem: string };
type RespostaPaciente = 'confirmar' | 'cancelar' | 'ignorar';

const RESPOSTAS_CONFIRMACAO = ['sim', 's', 'confirmo', 'confirmar', '1'];
const RESPOSTAS_CANCELAMENTO = ['nao', 'não', 'n', 'cancelar', 'cancela', '2'];

/** Webhook de WhatsApp: resposta do paciente atualiza o status do agendamento. */
export class ProcessarWebhookWhatsAppUseCase extends UseCase<
  ProcessarWebhookWhatsAppInputDto,
  ProcessarWebhookWhatsAppOutputDto
> {
  private readonly whatsappProvider: IWhatsAppProvider;
  private readonly mensagemWhatsAppRepository: IMensagemWhatsAppRepository;

  constructor(dependencies: ProcessarWebhookWhatsAppDependencies) {
    super();
    this.whatsappProvider = dependencies.whatsappProvider;
    this.mensagemWhatsAppRepository = dependencies.mensagemWhatsAppRepository;
  }

  async execute(
    input: ProcessarWebhookWhatsAppInputDto,
  ): Promise<Result<ProcessarWebhookWhatsAppOutputDto>> {
    const eventos = this.whatsappProvider.interpretarWebhook({ payload: input.payload });
    let confirmados = 0;
    let cancelados = 0;

    for (const evento of eventos) {
      const agendamento =
        await this.mensagemWhatsAppRepository.buscarProximoAgendamentoPorTelefone({
          telefone: evento.telefone,
        });

      await this.mensagemWhatsAppRepository.registrar({
        redeId: agendamento?.redeId ?? '',
        direcao: 'entrada',
        telefone: evento.telefone,
        conteudo: evento.mensagem,
        provider: this.whatsappProvider.nome,
        providerMessageId: evento.mensagemId,
        agendamentoId: agendamento?.agendamentoId ?? null,
        pacienteId: agendamento?.pacienteId ?? null,
      });

      if (!agendamento) continue;

      const resposta = this.interpretarResposta({ mensagem: evento.mensagem });
      if (resposta === 'confirmar' && agendamento.status === 'agendado') {
        await this.mensagemWhatsAppRepository.atualizarStatusAgendamento({
          redeId: agendamento.redeId,
          agendamentoId: agendamento.agendamentoId,
          status: 'confirmado',
        });
        confirmados += 1;
      }
      if (resposta === 'cancelar' && ['agendado', 'confirmado'].includes(agendamento.status)) {
        await this.mensagemWhatsAppRepository.atualizarStatusAgendamento({
          redeId: agendamento.redeId,
          agendamentoId: agendamento.agendamentoId,
          status: 'cancelado',
          motivo: 'Cancelado pelo paciente via WhatsApp',
        });
        cancelados += 1;
      }
    }

    return Result.ok({ recebidas: eventos.length, confirmados, cancelados });
  }

  private interpretarResposta({ mensagem }: InterpretarRespostaParams): RespostaPaciente {
    const normalizada = mensagem.trim().toLowerCase();
    if (RESPOSTAS_CONFIRMACAO.includes(normalizada)) return 'confirmar';
    if (RESPOSTAS_CANCELAMENTO.includes(normalizada)) return 'cancelar';
    return 'ignorar';
  }
}
