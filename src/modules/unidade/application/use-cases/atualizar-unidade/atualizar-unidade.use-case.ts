import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { UnidadeNaoEncontradaError } from '../../../domain/errors/unidade-nao-encontrada.error';
import type { IUnidadeRepository } from '../../../domain/repositories/unidade-repository.interface';
import { UnidadeMapper } from '../../mappers/unidade.mapper';
import type { UnidadeOutputDto } from '../../mappers/unidade.output.dto';
import type { AtualizarUnidadeInputDto } from './atualizar-unidade.input.dto';

export type AtualizarUnidadeDependencies = {
  unidadeRepository: IUnidadeRepository;
  mapper: UnidadeMapper;
};

export class AtualizarUnidadeUseCase extends UseCase<AtualizarUnidadeInputDto, UnidadeOutputDto> {
  private readonly unidadeRepository: IUnidadeRepository;
  private readonly mapper: UnidadeMapper;

  constructor(dependencies: AtualizarUnidadeDependencies) {
    super();
    this.unidadeRepository = dependencies.unidadeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarUnidadeInputDto): Promise<Result<UnidadeOutputDto>> {
    const unidade = await this.unidadeRepository.buscarPorId({ redeId: input.redeId, id: input.id });
    if (!unidade) return Result.fail(new UnidadeNaoEncontradaError({ unidadeId: input.id }));

    const resultado = unidade.atualizar(input);
    if (resultado.isFailure) return Result.propagate(resultado);

    await this.unidadeRepository.atualizar(unidade);
    return Result.ok(this.mapper.map({ unidade }));
  }
}
