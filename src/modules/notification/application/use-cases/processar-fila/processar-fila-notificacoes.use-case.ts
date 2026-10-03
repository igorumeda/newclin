import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import type { EnviarNotificacaoUseCase } from '../enviar-notificacao/enviar-notificacao.use-case';
import type {
  ProcessarFilaNotificacoesDetalheDto,
  ProcessarFilaNotificacoesInputDto,
  ProcessarFilaNotificacoesOutputDto,
} from '../../dtos/notificacao.dto';

export type ProcessarFilaNotificacoesDependencies = {
  notificacaoRepository: INotificacaoRepository;
  enviarNotificacao: EnviarNotificacaoUseCase;
  lotePadrao: number;
};

/**
 * Worker da fila de notificações (§4.1).
 * Reserva o lote de forma atômica (`reservar_notificacoes`) para permitir mais
 * de uma instância sem envio duplicado.
 */
export class ProcessarFilaNotificacoesUseCase extends UseCase<
  ProcessarFilaNotificacoesInputDto,
  ProcessarFilaNotificacoesOutputDto
> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly enviarNotificacao: EnviarNotificacaoUseCase;
  private readonly lotePadrao: number;

  constructor(dependencies: ProcessarFilaNotificacoesDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.enviarNotificacao = dependencies.enviarNotificacao;
    this.lotePadrao = dependencies.lotePadrao;
  }

  async execute(
    input: ProcessarFilaNotificacoesInputDto,
  ): Promise<Result<ProcessarFilaNotificacoesOutputDto>> {
    const ids = input.notificacaoIds && input.notificacaoIds.length > 0
      ? input.notificacaoIds
      : (await this.notificacaoRepository.reservarLote({
          limite: input.limite ?? this.lotePadrao,
        })).map((notificacao) => notificacao.id.toString());

    const detalhes: ProcessarFilaNotificacoesDetalheDto[] = [];
    let enviadas = 0;
    let falhas = 0;

    for (const notificacaoId of ids) {
      const resultado = await this.enviarNotificacao.execute({ notificacaoId });
      if (resultado.isFailure) {
        detalhes.push({
          id: notificacaoId,
          canal: 'email',
          tipo: 'confirmacao',
          destinatario: '',
          status: 'falha',
          erro: resultado.error.message,
          fallbackEmail: false,
        });
        falhas += 1;
        continue;
      }

      const { dto, enviada, erro, fallbackEmail } = resultado.value;
      if (enviada) enviadas += 1;
      else falhas += 1;

      detalhes.push({
        id: dto.id,
        canal: dto.canal,
        tipo: dto.tipo,
        destinatario: dto.destinatario,
        status: dto.status,
        erro,
        fallbackEmail,
      });
    }

    return Result.ok({
      processadas: ids.length,
      enviadas,
      falhas,
      detalhes,
    });
  }
}
