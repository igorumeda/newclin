import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import { NotificacaoMapper } from '../../mappers/notificacao.mapper';
import type { NotificacaoOutputDto } from '../../mappers/notificacao.output.dto';
import type { ListarNotificacoesInputDto } from './listar-notificacoes.input.dto';

export type ListarNotificacoesDependencies = {
  notificacaoRepository: INotificacaoRepository;
  mapper: NotificacaoMapper;
};

export class ListarNotificacoesUseCase extends UseCase<
  ListarNotificacoesInputDto,
  NotificacaoOutputDto[]
> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly mapper: NotificacaoMapper;

  constructor(dependencies: ListarNotificacoesDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarNotificacoesInputDto): Promise<Result<NotificacaoOutputDto[]>> {
    const notificacoes = await this.notificacaoRepository.listar({
      redeId: input.redeId,
      canal: input.canal ?? null,
      status: input.status ?? null,
      limite: input.limite,
    });
    return Result.ok(notificacoes.map((notificacao) => this.mapper.map({ notificacao })));
  }
}
