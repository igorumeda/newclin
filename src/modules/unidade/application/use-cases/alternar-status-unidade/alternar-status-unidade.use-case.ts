import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { UnidadeNaoEncontradaError } from '../../../domain/errors/unidade-nao-encontrada.error';
import type { IUnidadeRepository } from '../../../domain/repositories/unidade-repository.interface';
import { UnidadeMapper } from '../../mappers/unidade.mapper';
import type { UnidadeOutputDto } from '../../mappers/unidade.output.dto';
import type { AlternarStatusUnidadeInputDto } from './alternar-status-unidade.input.dto';

export type AlternarStatusUnidadeDependencies = {
  unidadeRepository: IUnidadeRepository;
  mapper: UnidadeMapper;
};

export class AlternarStatusUnidadeUseCase extends UseCase<
  AlternarStatusUnidadeInputDto,
  UnidadeOutputDto
> {
  private readonly unidadeRepository: IUnidadeRepository;
  private readonly mapper: UnidadeMapper;

  constructor(dependencies: AlternarStatusUnidadeDependencies) {
    super();
    this.unidadeRepository = dependencies.unidadeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AlternarStatusUnidadeInputDto): Promise<Result<UnidadeOutputDto>> {
    const unidade = await this.unidadeRepository.buscarPorId({ redeId: input.redeId, id: input.id });
    if (!unidade) return Result.fail(new UnidadeNaoEncontradaError({ unidadeId: input.id }));

    const resultado = input.ativo ? unidade.reativar() : unidade.desativar();
    if (resultado.isFailure) return Result.propagate(resultado);

    await this.unidadeRepository.atualizar(unidade);
    return Result.ok(this.mapper.map({ unidade }));
  }
}
