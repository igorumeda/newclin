import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ProfissionalNotFoundError } from '../../../domain/errors/profissional.errors';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { ProfissionalMapper } from '../../mappers/profissional.mapper';
import type {
  AtualizarProfissionalInputDto,
  AtualizarProfissionalOutputDto,
} from '../../dtos/profissional.dto';

export type AtualizarProfissionalDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: ProfissionalMapper;
};

export class AtualizarProfissionalUseCase extends UseCase<
  AtualizarProfissionalInputDto,
  AtualizarProfissionalOutputDto
> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: ProfissionalMapper;

  constructor(dependencies: AtualizarProfissionalDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarProfissionalInputDto): Promise<Result<AtualizarProfissionalOutputDto>> {
    const profissional = await this.profissionalRepository.findById(input.profissionalId);
    if (!profissional) {
      return Result.fail(new ProfissionalNotFoundError({ profissionalId: input.profissionalId }));
    }

    const atualizacao = profissional.atualizar(input);
    if (atualizacao.isFailure) return Result.fail(atualizacao.error);

    await this.profissionalRepository.update(profissional);

    const unidades = await this.profissionalRepository.listarUnidades({
      profissionalId: input.profissionalId,
    });

    return Result.ok(this.mapper.map({ profissional, unidades }));
  }
}
