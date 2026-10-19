import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IModeloMensagemRepository } from '../../../domain/repositories/modelo-mensagem-repository.interface';
import { ModeloMensagemMapper } from '../../mappers/notificacao.mapper';
import type {
  ListarModelosMensagemInputDto,
  ListarModelosMensagemOutputDto,
} from '../../dtos/notificacao.dto';

export type ListarModelosMensagemDependencies = {
  modeloMensagemRepository: IModeloMensagemRepository;
  mapper: ModeloMensagemMapper;
};

export class ListarModelosMensagemUseCase extends UseCase<
  ListarModelosMensagemInputDto,
  ListarModelosMensagemOutputDto
> {
  private readonly modeloMensagemRepository: IModeloMensagemRepository;
  private readonly mapper: ModeloMensagemMapper;

  constructor(dependencies: ListarModelosMensagemDependencies) {
    super();
    this.modeloMensagemRepository = dependencies.modeloMensagemRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: ListarModelosMensagemInputDto,
  ): Promise<Result<ListarModelosMensagemOutputDto>> {
    const modelos = await this.modeloMensagemRepository.listar(input.redeId);
    return Result.ok({ items: modelos.map((modelo) => this.mapper.map({ modelo })) });
  }
}
