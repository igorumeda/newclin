import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { BloqueioNaoEncontradoError } from '../../../domain/errors/bloqueio-nao-encontrado.error';
import type { IBloqueioAgendaRepository } from '../../../domain/repositories/bloqueio-repository.interface';
import type { RemoverBloqueioInputDto } from './remover-bloqueio.input.dto';

export type RemoverBloqueioDependencies = { bloqueioRepository: IBloqueioAgendaRepository };

export class RemoverBloqueioUseCase extends UseCase<RemoverBloqueioInputDto, void> {
  private readonly bloqueioRepository: IBloqueioAgendaRepository;

  constructor(dependencies: RemoverBloqueioDependencies) {
    super();
    this.bloqueioRepository = dependencies.bloqueioRepository;
  }

  async execute(input: RemoverBloqueioInputDto): Promise<Result<void>> {
    const bloqueio = await this.bloqueioRepository.buscarPorId({
      redeId: input.redeId,
      id: input.id,
    });
    if (!bloqueio) return Result.fail(new BloqueioNaoEncontradoError({ bloqueioId: input.id }));

    await this.bloqueioRepository.remover({ redeId: input.redeId, id: input.id });
    return Result.ok();
  }
}
