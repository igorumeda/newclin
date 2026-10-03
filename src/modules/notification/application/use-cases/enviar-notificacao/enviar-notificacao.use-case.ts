import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { InvalidNotificationOperationError, NotificacaoNotFoundError } from '../../../domain/errors/notificacao.errors';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import type { IEmailSender } from '../../../domain/services/email-sender.interface';
import type { IWhatsappSender } from '../../../domain/services/whatsapp-sender.interface';
import { NotificacaoMapper } from '../../mappers/notificacao.mapper';
import type { EnviarNotificacaoInputDto, EnviarNotificacaoOutputDto } from '../../dtos/notificacao.dto';

export type EnviarNotificacaoDependencies = {
  notificacaoRepository: INotificacaoRepository;
  emailSender: IEmailSender;
  whatsappSender: IWhatsappSender;
  mapper: NotificacaoMapper;
  maxTentativas: number;
  /** Intervalo de retentativa em minutos quando o provedor falha. */
  backoffMinutos: number;
};

export type EnviarNotificacaoResultado = {
  dto: EnviarNotificacaoOutputDto;
  enviada: boolean;
  erro: string | null;
  fallbackEmail: boolean;
};

/**
 * Envia uma notificação por e-mail (SMTP) ou WhatsApp (provedor atrás da porta).
 * Falhas não interrompem a fila: o item permanece pendente para retentativa
 * enquanto houver tentativas disponíveis e vira "falha" no limite.
 */
export class EnviarNotificacaoUseCase extends UseCase<
  EnviarNotificacaoInputDto,
  EnviarNotificacaoResultado
> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly emailSender: IEmailSender;
  private readonly whatsappSender: IWhatsappSender;
  private readonly mapper: NotificacaoMapper;
  private readonly maxTentativas: number;
  private readonly backoffMinutos: number;

  constructor(dependencies: EnviarNotificacaoDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.emailSender = dependencies.emailSender;
    this.whatsappSender = dependencies.whatsappSender;
    this.mapper = dependencies.mapper;
    this.maxTentativas = dependencies.maxTentativas;
    this.backoffMinutos = dependencies.backoffMinutos;
  }

  async execute(input: EnviarNotificacaoInputDto): Promise<Result<EnviarNotificacaoResultado>> {
    const notificacao = await this.notificacaoRepository.findById(input.notificacaoId);
    if (!notificacao) {
      return Result.fail(new NotificacaoNotFoundError({ notificacaoId: input.notificacaoId }));
    }

    if (!notificacao.estaPendente()) {
      return Result.fail(
        new InvalidNotificationOperationError({
          reason: `Notificação com status "${notificacao.status}" não está na fila`,
        }),
      );
    }

    notificacao.registrarTentativa();

    try {
      if (notificacao.canal === 'email') {
        const resultado = await this.emailSender.enviar({
          para: notificacao.destinatario.valor,
          assunto: notificacao.assunto ?? 'Notificação',
          corpo: notificacao.conteudo,
        });

        notificacao.marcarEnviada({
          provider: resultado.provider,
          providerMessageId: resultado.messageId,
          remetente: resultado.remetente,
        });
      } else {
        const resultado = await this.whatsappSender.enviar({
          para: notificacao.destinatario.valor,
          corpo: notificacao.conteudo,
          botoes: this.botoesDoTipo(notificacao.tipo),
        });

        notificacao.marcarEnviada({
          provider: resultado.provider,
          providerMessageId: resultado.messageId,
        });
      }

      await this.notificacaoRepository.update(notificacao);

      return Result.ok({
        dto: this.mapper.map({ notificacao }),
        enviada: true,
        erro: null,
        fallbackEmail: false,
      });
    } catch (error) {
      const motivo = error instanceof Error ? error.message : 'Erro desconhecido ao enviar notificação';

      if (notificacao.tentativas >= this.maxTentativas) {
        notificacao.marcarFalha(motivo);
      } else {
        notificacao.marcarFalhaRetentavel({
          motivo,
          reagendarPara: new Date(Date.now() + this.backoffMinutos * 60 * 1000),
        });
      }

      await this.notificacaoRepository.update(notificacao);

      return Result.ok({
        dto: this.mapper.map({ notificacao }),
        enviada: false,
        erro: motivo,
        fallbackEmail: await this.existeAlternativaEmail(notificacao),
      });
    }
  }

  /** O e-mail é enfileirado em paralelo pelo dispatcher: sinaliza o fallback disponível. */
  private async existeAlternativaEmail(notificacao: {
    canal: string;
    tipo: string;
    pacienteId: string | null;
    agendamentoId: string | null;
  }): Promise<boolean> {
    if (notificacao.canal !== 'whatsapp' || !notificacao.pacienteId) return false;

    const { items } = await this.notificacaoRepository.buscar({
      redeId: '',
      pacienteId: notificacao.pacienteId,
      agendamentoId: notificacao.agendamentoId,
      canal: 'email',
      tipo: notificacao.tipo as never,
      status: 'pendente',
      page: 1,
      perPage: 1,
    });

    return items.length > 0;
  }

  private botoesDoTipo(tipo: string): { acao: 'confirmar' | 'cancelar'; label: string }[] | undefined {
    if (tipo !== 'confirmacao' && tipo !== 'lembrete') return undefined;
    return [
      { acao: 'confirmar', label: 'Confirmar' },
      { acao: 'cancelar', label: 'Cancelar' },
    ];
  }
}
