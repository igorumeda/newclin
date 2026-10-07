import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { ProfissionalNaoEncontradoError } from '../../../domain/errors/profissional-nao-encontrado.error';
import type { IProfissionalRepository } from '../../../domain/repositories/profissional-repository.interface';
import { ProfissionalMapper } from '../../mappers/profissional.mapper';
import type { ProfissionalOutputDto } from '../../mappers/profissional.output.dto';
import type { AtualizarProfissionalInputDto } from './atualizar-profissional.input.dto';

export type AtualizarProfissionalDependencies = {
  profissionalRepository: IProfissionalRepository;
  mapper: ProfissionalMapper;
};

export class AtualizarProfissionalUseCase extends UseCase<
  AtualizarProfissionalInputDto,
  ProfissionalOutputDto
> {
  private readonly profissionalRepository: IProfissionalRepository;
  private readonly mapper: ProfissionalMapper;

  constructor(dependencies: AtualizarProfissionalDependencies) {
    super();
    this.profissionalRepository = dependencies.profissionalRepository;
    this.mapper = dependencies.mapper;
  }

  async execute(input: AtualizarProfissionalInputDto): Promise<Result<ProfissionalOutputDto>> {
    const profissional = await this.profissionalRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!profissional) {
      return Result.fail(new ProfissionalNaoEncontradoError({ profissionalId: input.id }));
    }

    const resultado = profissional.atualizar(input);
    if (resultado.isFailure) return Result.propagate(resultado);

    await this.profissionalRepository.atualizar(profissional);
    return Result.ok(this.mapper.map({ profissional }));
  }
}
