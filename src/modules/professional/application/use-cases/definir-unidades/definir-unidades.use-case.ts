import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ProfissionalNotFoundError } from '../../../domain/errors/profissional.errors';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import type {
  DefinirUnidadesProfissionalInputDto,
  DefinirUnidadesProfissionalOutputDto,
} from '../../dtos/profissional.dto';

export type DefinirUnidadesDependencies = {
  profissionalRepository: IProfissionalRepository;
};

/** Define em quais unidades o profissional atua (§3.1). */
export class DefinirUnidadesUseCase extends UseCase<
  DefinirUnidadesProfissionalInputDto,
  DefinirUnidadesProfissionalOutputDto
> {
  private readonly profissionalRepository: IProfissionalRepository;

  constructor(dependencies: DefinirUnidadesDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
  }

  async execute(
    input: DefinirUnidadesProfissionalInputDto,
  ): Promise<Result<DefinirUnidadesProfissionalOutputDto>> {
    const profissional = await this.profissionalRepository.findById(input.profissionalId);
    if (!profissional) {
      return Result.fail(new ProfissionalNotFoundError({ profissionalId: input.profissionalId }));
    }

    await this.profissionalRepository.definirUnidades({
      redeId: input.redeId,
      profissionalId: input.profissionalId,
      unidadeIds: input.unidadeIds,
    });

    const unidades = await this.profissionalRepository.listarUnidades({
      profissionalId: input.profissionalId,
    });

    return Result.ok({ unidades });
  }
}
