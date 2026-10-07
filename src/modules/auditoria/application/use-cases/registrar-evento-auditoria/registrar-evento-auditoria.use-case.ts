import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { RegistroAuditoria } from '../../../domain/entities/registro-auditoria.entity';
import type { IAuditoriaRepository } from '../../../domain/repositories/auditoria-repository.interface';
import type { RegistrarEventoAuditoriaInputDto } from './registrar-evento-auditoria.input.dto';

export type RegistrarEventoAuditoriaDependencies = { auditoriaRepository: IAuditoriaRepository };

export class RegistrarEventoAuditoriaUseCase extends UseCase<
  RegistrarEventoAuditoriaInputDto,
  void
> {
  private readonly auditoriaRepository: IAuditoriaRepository;

  constructor(dependencies: RegistrarEventoAuditoriaDependencies) {
    super();
    this.auditoriaRepository = dependencies.auditoriaRepository;
  }

  async execute(input: RegistrarEventoAuditoriaInputDto): Promise<Result<void>> {
    const registroResult = RegistroAuditoria.create(input);
    if (registroResult.isFailure) return Result.propagate(registroResult);

    await this.auditoriaRepository.registrar(registroResult.value);
    return Result.ok();
  }
}
