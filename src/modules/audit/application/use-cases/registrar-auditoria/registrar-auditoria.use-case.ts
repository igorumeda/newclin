import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import { Auditoria } from '../../../domain/entities/auditoria.entity';
import type { IAuditoriaRepository } from '../../../domain/repositories/auditoria-repository.interface';
import type { RegistrarAuditoriaInputDto } from './registrar-auditoria.input.dto';
import type { RegistrarAuditoriaOutputDto } from './registrar-auditoria.output.dto';

export type RegistrarAuditoriaDependencies = {
  auditoriaRepository: IAuditoriaRepository;
};

/** Grava uma entrada na trilha de auditoria (imutável, somente inserção). */
export class RegistrarAuditoriaUseCase extends UseCase<
  RegistrarAuditoriaInputDto,
  RegistrarAuditoriaOutputDto
> {
  private readonly auditoriaRepository: IAuditoriaRepository;

  constructor(dependencies: RegistrarAuditoriaDependencies) {
    super();
    this.auditoriaRepository = dependencies.auditoriaRepository;
  }

  async execute(input: RegistrarAuditoriaInputDto): Promise<Result<RegistrarAuditoriaOutputDto>> {
    const auditoriaResult = Auditoria.registrar(input);
    if (auditoriaResult.isFailure) return Result.fail(auditoriaResult.error);

    await this.auditoriaRepository.registrar(auditoriaResult.value);

    return Result.ok({ id: auditoriaResult.value.id.toString() });
  }
}
