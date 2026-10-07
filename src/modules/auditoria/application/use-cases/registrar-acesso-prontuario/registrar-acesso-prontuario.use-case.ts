import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IAuditoriaRepository } from '../../../domain/repositories/auditoria-repository.interface';
import type { RegistrarAcessoProntuarioInputDto } from './registrar-acesso-prontuario.input.dto';

export type RegistrarAcessoProntuarioDependencies = { auditoriaRepository: IAuditoriaRepository };

/** Exigência de LGPD: todo acesso a prontuário é registrado (spec §5). */
export class RegistrarAcessoProntuarioUseCase extends UseCase<
  RegistrarAcessoProntuarioInputDto,
  void
> {
  private readonly auditoriaRepository: IAuditoriaRepository;

  constructor(dependencies: RegistrarAcessoProntuarioDependencies) {
    super();
    this.auditoriaRepository = dependencies.auditoriaRepository;
  }

  async execute(input: RegistrarAcessoProntuarioInputDto): Promise<Result<void>> {
    await this.auditoriaRepository.registrarAcessoProntuario(input);
    return Result.ok();
  }
}
