import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { normalizePagination } from '@core/application/pagination/pagination';
import type { INotificacaoRepository } from '../../../domain/repositories/notificacao-repository.interface';
import { NotificacaoMapper } from '../../mappers/notificacao.mapper';
import type {
  ListarNotificacoesInputDto,
  ListarNotificacoesOutputDto,
} from '../../dtos/notificacao.dto';

export type ListarNotificacoesDependencies = {
  notificacaoRepository: INotificacaoRepository;
  mapper: NotificacaoMapper;
};

/** Log de envios consultável por agendamento, paciente, canal, tipo e período. */
export class ListarNotificacoesUseCase extends UseCase<
  ListarNotificacoesInputDto,
  ListarNotificacoesOutputDto
> {
  private readonly notificacaoRepository: INotificacaoRepository;
  private readonly mapper: NotificacaoMapper;

  constructor(dependencies: ListarNotificacoesDependencies) {
    super();
    this.notificacaoRepository = dependencies.notificacaoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarNotificacoesInputDto): Promise<Result<ListarNotificacoesOutputDto>> {
    const pagination = normalizePagination({ page: input.page, perPage: input.perPage });

    const { items, total } = await this.notificacaoRepository.buscar({
      redeId: input.redeId,
      agendamentoId: input.agendamentoId ?? null,
      pacienteId: input.pacienteId ?? null,
      canal: input.canal ?? null,
      tipo: input.tipo ?? null,
      status: input.status ?? null,
      de: input.de ?? null,
      ate: input.ate ?? null,
      page: pagination.page,
      perPage: pagination.perPage,
    });

    return Result.ok({
      items: items.map((notificacao) => this.mapper.map({ notificacao })),
      total,
      page: pagination.page,
      perPage: pagination.perPage,
    });
  }
}
