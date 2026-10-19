import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Destinatario } from '../../../domain/value-objects/destinatario.vo';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import type { IAgendamentoRespostaPort } from '../../../domain/services/agendamento-resposta.interface';
import type { IWhatsappSender } from '../../../domain/services/whatsapp-sender.interface';
import type { Notificacao } from '../../../domain/entities/notificacao.entity';
import type {
  ProcessarRespostaWhatsappDetalheDto,
  ProcessarRespostaWhatsappInputDto,
  ProcessarRespostaWhatsappOutputDto,
} from '../../dtos/notificacao.dto';

export type ProcessarRespostaWhatsappDependencies = {
  notificacaoRepository: INotificacaoRepository;
  whatsappSender: IWhatsappSender;
  agendamentoResposta: IAgendamentoRespostaPort;
};

/**
 * Webhook do provedor WhatsApp (§4.2): registra a resposta do paciente na
 * notificação e aplica a confirmação/cancelamento no agendamento.
 */
export class ProcessarRespostaWhatsappUseCase extends UseCase<
  ProcessarRespostaWhatsappInputDto,
  ProcessarRespostaWhatsappOutputDto
> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly whatsappSender: IWhatsappSender;
  private readonly agendamentoResposta: IAgendamentoRespostaPort;

  constructor(dependencies: ProcessarRespostaWhatsappDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.whatsappSender = dependencies.whatsappSender;
    this.agendamentoResposta = dependencies.agendamentoResposta;
  }

  async execute(
    input: ProcessarRespostaWhatsappInputDto,
  ): Promise<Result<ProcessarRespostaWhatsappOutputDto>> {
    const assinaturaValida = this.whatsappSender.verificarAssinatura({
      payload: input.payloadBruto,
      assinatura: input.assinatura,
    });

    if (!assinaturaValida) {
      // Assinatura inválida: payload descartado, nada é processado.
      return Result.ok({ assinaturaValida: false, processadas: 0, detalhes: [] });
    }

    const mensagens = this.whatsappSender.interpretarWebhook(input.payload);
    const detalhes: ProcessarRespostaWhatsappDetalheDto[] = [];

    for (const mensagem of mensagens) {
      const destinatario = Destinatario.paraWhatsapp(mensagem.telefone);
      if (destinatario.isFailure) continue;

      const notificacao = await this.localizarNotificacao({
        telefone: destinatario.value.valor,
        providerMessageId: mensagem.providerMessageId,
      });

      if (!notificacao) {
        detalhes.push({
          telefone: mensagem.telefone,
          acao: mensagem.acao,
          notificacaoId: null,
          agendamentoId: null,
          aplicado: false,
          statusNovo: null,
          motivo: 'Nenhuma notificação pendente encontrada para este telefone',
        });
        continue;
      }

      const marcada = notificacao.marcarRespondida({
        resposta: mensagem.texto,
        acao: mensagem.acao,
      });
      if (marcada.isFailure) continue;

      await this.notificacaoRepository.update(notificacao);

      let aplicado = false;
      let statusNovo: string | null = null;
      let motivo: string | null = null;

      if (mensagem.acao && notificacao.agendamentoId) {
        const resultado = await this.agendamentoResposta.aplicarRespostaPaciente({
          agendamentoId: notificacao.agendamentoId,
          acao: mensagem.acao,
          origem: 'whatsapp',
          observacao: mensagem.texto,
        });
        aplicado = resultado.aplicado;
        statusNovo = resultado.statusNovo;
        motivo = resultado.motivo;
      } else if (!mensagem.acao) {
        motivo = 'Mensagem sem ação de confirmação/cancelamento identificada';
      }

      detalhes.push({
        telefone: mensagem.telefone,
        acao: mensagem.acao,
        notificacaoId: notificacao.id.toString(),
        agendamentoId: notificacao.agendamentoId,
        aplicado,
        statusNovo,
        motivo,
      });
    }

    return Result.ok({
      assinaturaValida: true,
      processadas: detalhes.length,
      detalhes,
    });
  }

  /** Prioriza a mensagem respondida; recorre à última notificação do telefone. */
  private async localizarNotificacao(params: {
    telefone: string;
    providerMessageId: string | null;
  }): Promise<Notificacao | null> {
    if (params.providerMessageId) {
      const porMensagem = await this.notificacaoRepository.buscarPorProviderMessageId({
        canal: 'whatsapp',
        providerMessageId: params.providerMessageId,
      });
      if (porMensagem) return porMensagem;
    }

    const { items } = await this.notificacaoRepository.buscar({
      canal: 'whatsapp',
      page: 1,
      perPage: 5,
    });

    return items.find((item) => item.destinatario.valor === params.telefone) ?? null;
  }
}
