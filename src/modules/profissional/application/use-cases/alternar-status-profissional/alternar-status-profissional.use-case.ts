import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ProfissionalNaoEncontradoError } from '../../../domain/errors/profissional-nao-encontrado.error';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { ProfissionalMapper } from '../../mappers/profissional.mapper';
import type { ProfissionalOutputDto } from '../../mappers/profissional.output.dto';
import type { AlternarStatusProfissionalInputDto } from './alternar-status-profissional.input.dto';

export type AlternarStatusProfissionalDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: ProfissionalMapper;
};

export class AlternarStatusProfissionalUseCase extends UseCase<
  AlternarStatusProfissionalInputDto,
  ProfissionalOutputDto
> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: ProfissionalMapper;

  constructor(dependencies: AlternarStatusProfissionalDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AlternarStatusProfissionalInputDto): Promise<Result<ProfissionalOutputDto>> {
    const profissional = await this.profissionalRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!profissional) {
      return Result.fail(new ProfissionalNaoEncontradoError({ profissionalId: input.id }));
    }

    const resultado = input.ativo ? profissional.reativar() : profissional.desativar();
    if (resultado.isFailure) return Result.propagate(resultado);

    await this.profissionalRepository.atualizar(profissional);
    return Result.ok(this.mapper.map({ profissional }));
  }
}
