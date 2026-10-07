import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { ITipoAtendimentoRepository } from '../../../domain/repositories/tipo-atendimento-repository.interface';
import { TipoAtendimentoMapper } from '../../mappers/tipo-atendimento.mapper';
import type { TipoAtendimentoOutputDto } from '../../mappers/tipo-atendimento.output.dto';
import type { ListarTiposAtendimentoInputDto } from './listar-tipos-atendimento.input.dto';

export type ListarTiposAtendimentoDependencies = {
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
  mapper: TipoAtendimentoMapper;
};

export class ListarTiposAtendimentoUseCase extends UseCase<
  ListarTiposAtendimentoInputDto,
  TipoAtendimentoOutputDto[]
> {
  private readonly tipoAtendimentoRepository: ITipoAtendimentoRepository;
  private readonly mapper: TipoAtendimentoMapper;

  constructor(dependencies: ListarTiposAtendimentoDependencies) {
    super();
    this.tipoAtendimentoRepository = dependencies.tipoAtendimentoRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(
    input: ListarTiposAtendimentoInputDto,
  ): Promise<Result<TipoAtendimentoOutputDto[]>> {
    const tipos = await this.tipoAtendimentoRepository.listar({
      redeId: input.redeId,
      apenasAtivos: input.apenasAtivos,
    });
    return Result.ok(tipos.map((tipoAtendimento) => this.mapper.map({ tipoAtendimento })));
  }
}
