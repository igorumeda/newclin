import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { UnidadeNotFoundError } from '../../../domain/errors/unidade.errors';
import type { IUnidadeRepository } from '../../../domain/repositories/unidade-repository.interface';
import { UnidadeMapper } from '../../mappers/organizacao.mapper';
import type { InativarUnidadeInputDto, InativarUnidadeOutputDto } from '../../dtos/organizacao.dto';

export type InativarUnidadeDependencies = {
  unidadeRepository: IUnidadeRepository;
  mapper: UnidadeMapper;
};

/** Unidades são inativadas (soft delete) — nunca excluídas fisicamente (§5). */
export class InativarUnidadeUseCase extends UseCase<InativarUnidadeInputDto, InativarUnidadeOutputDto> {
  private readonly unidadeRepository: IUnidadeRepository;
  private readonly mapper: UnidadeMapper;

  constructor(dependencies: InativarUnidadeDependencies) {
    super();
    this.unidadeRepository = dependencies.unidadeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: InativarUnidadeInputDto): Promise<Result<InativarUnidadeOutputDto>> {
    const unidade = await this.unidadeRepository.findById(input.unidadeId);
    if (!unidade) return Result.fail(new UnidadeNotFoundError({ unidadeId: input.unidadeId }));

    const result = input.reativar ? unidade.reativar() : unidade.inativar();
    if (result.isFailure) return Result.fail(result.error);

    await this.unidadeRepository.update(unidade);

    return Result.ok(this.mapper.map({ unidade }));
  }
}
