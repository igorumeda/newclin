import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ProfissionalNotFoundError } from '../../../domain/errors/profissional.errors';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { ProfissionalMapper } from '../../mappers/profissional.mapper';
import type {
  InativarProfissionalInputDto,
  InativarProfissionalOutputDto,
} from '../../dtos/profissional.dto';

export type InativarProfissionalDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: ProfissionalMapper;
};

export class InativarProfissionalUseCase extends UseCase<
  InativarProfissionalInputDto,
  InativarProfissionalOutputDto
> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: ProfissionalMapper;

  constructor(dependencies: InativarProfissionalDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: InativarProfissionalInputDto): Promise<Result<InativarProfissionalOutputDto>> {
    const profissional = await this.profissionalRepository.findById(input.profissionalId);
    if (!profissional) {
      return Result.fail(new ProfissionalNotFoundError({ profissionalId: input.profissionalId }));
    }

    const result = input.reativar ? profissional.reativar() : profissional.inativar();
    if (result.isFailure) return Result.fail(result.error);

    await this.profissionalRepository.update(profissional);

    const unidades = await this.profissionalRepository.listarUnidades({
      profissionalId: input.profissionalId,
    });

    return Result.ok(this.mapper.map({ profissional, unidades }));
  }
}
