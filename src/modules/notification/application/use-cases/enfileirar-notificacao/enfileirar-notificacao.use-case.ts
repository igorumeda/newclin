import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Notificacao } from '../../../domain/entities/notificacao.entity';
import { Destinatario } from '../../../domain/value-objects/destinatario.vo';
import { ModeloMensagemNotFoundError } from '../../../domain/errors/notificacao.errors';
import type { IModeloMensagemRepository } from '../../../domain/repositories/modelo-mensagem-repository.interface';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import { NotificacaoMapper } from '../../mappers/notificacao.mapper';
import type {
  EnfileirarNotificacaoInputDto,
  EnfileirarNotificacaoOutputDto,
} from '../../dtos/notificacao.dto';

export type EnfileirarNotificacaoDependencies = {
  notificacaoRepository: INotificacaoRepository;
  modeloMensagemRepository: IModeloMensagemRepository;
  mapper: NotificacaoMapper;
};

/**
 * Renderiza o modelo da rede (canal + tipo) e enfileira a notificação.
 * Não realiza envio: o envio é assíncrono (§4.1).
 */
export class EnfileirarNotificacaoUseCase extends UseCase<
  EnfileirarNotificacaoInputDto,
  EnfileirarNotificacaoOutputDto
> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly modeloMensagemRepository: IModeloMensagemRepository;
  private readonly mapper: NotificacaoMapper;

  constructor(dependencies: EnfileirarNotificacaoDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.modeloMensagemRepository = dependencies.modeloMensagemRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: EnfileirarNotificacaoInputDto): Promise<Result<EnfileirarNotificacaoOutputDto>> {
    const destinatarioResult = Destinatario.create(input.canal, input.destinatario);
    if (destinatarioResult.isFailure) return Result.fail(destinatarioResult.error);

    const modelo = await this.modeloMensagemRepository.buscarAtivo({
      redeId: input.redeId,
      canal: input.canal,
      tipo: input.tipo,
    });

    if (!modelo) {
      return Result.fail(
        new ModeloMensagemNotFoundError({ canal: input.canal, tipo: input.tipo }),
      );
    }

    const renderizado = modelo.renderizar(input.variaveis);

    const notificacaoResult = Notificacao.create({
      redeId: input.redeId,
      canal: input.canal,
      tipo: input.tipo,
      destinatario: destinatarioResult.value,
      assunto: input.assunto ?? renderizado.assunto,
      conteudo: renderizado.corpo,
      agendamentoId: input.agendamentoId,
      pacienteId: input.pacienteId,
      atendimentoId: input.atendimentoId,
      documentoId: input.documentoId,
      agendadaPara: input.agendadaPara ? new Date(input.agendadaPara) : null,
      createdBy: input.createdBy,
    });

    if (notificacaoResult.isFailure) return Result.fail(notificacaoResult.error);

    const notificacao = notificacaoResult.value;
    await this.notificacaoRepository.save(notificacao);

    return Result.ok({ notificacoes: [this.mapper.map({ notificacao })] });
  }
}
