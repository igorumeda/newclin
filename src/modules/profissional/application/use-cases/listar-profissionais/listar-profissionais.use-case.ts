import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { ProfissionalMapper } from '../../mappers/profissional.mapper';
import type { ProfissionalOutputDto } from '../../mappers/profissional.output.dto';
import type { ListarProfissionaisInputDto } from './listar-profissionais.input.dto';

export type ListarProfissionaisDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: ProfissionalMapper;
};

export class ListarProfissionaisUseCase extends UseCase<
  ListarProfissionaisInputDto,
  ProfissionalOutputDto[]
> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: ProfissionalMapper;

  constructor(dependencies: ListarProfissionaisDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: ListarProfissionaisInputDto): Promise<Result<ProfissionalOutputDto[]>> {
    const profissionais = await this.profissionalRepository.listar(input);
    return Result.ok(profissionais.map((profissional) => this.mapper.map({ profissional })));
  }
}
