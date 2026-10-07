import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { AnexoInvalidoError } from '../../../domain/errors/anexo-invalido.error';
import type { IAnexoRepository } from '../../../domain/repositories/anexo-repository.interface';
import type { RemoverAnexoInputDto } from './remover-anexo.input.dto';

export type RemoverAnexoDependencies = { anexoRepository: IAnexoRepository };

export class RemoverAnexoUseCase extends UseCase<RemoverAnexoInputDto, void> {
  private readonly anexoRepository: IAnexoRepository;

  constructor(dependencies: RemoverAnexoDependencies) {
    super();
    this.anexoRepository = dependencies.anexoRepository;
  }

  async execute(input: RemoverAnexoInputDto): Promise<Result<void>> {
    const anexo = await this.anexoRepository.buscarPorId({ redeId: input.redeId, id: input.id });
    if (!anexo) return Result.fail(new AnexoInvalidoError({ motivo: 'Anexo não encontrado' }));

    await this.anexoRepository.remover({ redeId: input.redeId, id: input.id });
    return Result.ok();
  }
}
