import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Profissional } from '../../../domain/entities/profissional.entity';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { ProfissionalMapper } from '../../mappers/profissional.mapper';
import type { ProfissionalOutputDto } from '../../mappers/profissional.output.dto';
import type { CriarProfissionalInputDto } from './criar-profissional.input.dto';

export type CriarProfissionalDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: ProfissionalMapper;
};

export class CriarProfissionalUseCase extends UseCase<
  CriarProfissionalInputDto,
  ProfissionalOutputDto
> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: ProfissionalMapper;

  constructor(dependencies: CriarProfissionalDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: CriarProfissionalInputDto): Promise<Result<ProfissionalOutputDto>> {
    const profissionalResult = Profissional.create(input);
    if (profissionalResult.isFailure) return Result.propagate(profissionalResult);

    await this.profissionalRepository.salvar(profissionalResult.value);
    return Result.ok(this.mapper.map({ profissional: profissionalResult.value }));
  }
}
