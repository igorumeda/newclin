import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type {
  AcessoProntuarioRegistro,
  IAuditoriaRepository,
} from '../../../domain/repositories/auditoria-repository.interface';
import type { ListarAcessosProntuarioInputDto } from './listar-acessos-prontuario.input.dto';

export type ListarAcessosProntuarioDependencies = { auditoriaRepository: IAuditoriaRepository };

export class ListarAcessosProntuarioUseCase extends UseCase<
  ListarAcessosProntuarioInputDto,
  AcessoProntuarioRegistro[]
> {
  private readonly auditoriaRepository: IAuditoriaRepository;

  constructor(dependencies: ListarAcessosProntuarioDependencies) {
    super();
    this.auditoriaRepository = dependencies.auditoriaRepository;
  }

  async execute(
    input: ListarAcessosProntuarioInputDto,
  ): Promise<Result<AcessoProntuarioRegistro[]>> {
    const acessos = await this.auditoriaRepository.listarAcessosProntuario({
      redeId: input.redeId,
      pacienteId: input.pacienteId ?? null,
      limite: input.limite,
    });
    return Result.ok(acessos);
  }
}
