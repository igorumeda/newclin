import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Unidade } from '../../../domain/entities/unidade.entity';
import type { IUnidadeRepository } from '../../../domain/repositories/unidade-repository.interface';
import { UnidadeMapper } from '../../mappers/unidade.mapper';
import type { UnidadeOutputDto } from '../../mappers/unidade.output.dto';
import type { CriarUnidadeInputDto } from './criar-unidade.input.dto';

export type CriarUnidadeDependencies = {
  unidadeRepository: IUnidadeRepository;
  mapper: UnidadeMapper;
};

export class CriarUnidadeUseCase extends UseCase<CriarUnidadeInputDto, UnidadeOutputDto> {
  private readonly unidadeRepository: IUnidadeRepository;
  private readonly mapper: UnidadeMapper;

  constructor(dependencies: CriarUnidadeDependencies) {
    super();
    this.unidadeRepository = dependencies.unidadeRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarUnidadeInputDto): Promise<Result<UnidadeOutputDto>> {
    const unidadeResult = Unidade.create(input);
    if (unidadeResult.isFailure) return Result.propagate(unidadeResult);

    await this.unidadeRepository.salvar(unidadeResult.value);
    return Result.ok(this.mapper.map({ unidade: unidadeResult.value }));
  }
}
