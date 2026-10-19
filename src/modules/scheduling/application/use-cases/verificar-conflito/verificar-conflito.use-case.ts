import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IAgendamentoRepository } from '../../../domain/repositories/agendamento-repository.interface';
import type {
  VerificarConflitoInputDto,
  VerificarConflitoOutputDto,
} from '../../dtos/agenda.dto';

export type VerificarConflitoDependencies = {
  agendamentoRepository: IAgendamentoRepository;
};

/**
 * Pré-checagem usada pelo formulário de agendamento: devolve os conflitos e
 * bloqueios do horário para que a UI ofereça o encaixe com aviso visual (§3.4).
 */
export class VerificarConflitoUseCase extends UseCase<
  VerificarConflitoInputDto,
  VerificarConflitoOutputDto
> {
  private readonly agendamentoRepository: IAgendamentoRepository;

  constructor(dependencies: VerificarConflitoDependencies) {
    super();
    this.agendamentoRepository = dependencies.agendamentoRepository;
  }

  async execute(input: VerificarConflitoInputDto): Promise<Result<VerificarConflitoOutputDto>> {
    const [conflitos, bloqueios] = await Promise.all([
      this.agendamentoRepository.verificarConflito({
        profissionalId: input.profissionalId,
        unidadeId: input.unidadeId,
        inicio: input.inicio,
        fim: input.fim,
        ignorarAgendamentoId: input.ignorarAgendamentoId ?? null,
      }),
      this.agendamentoRepository.verificarBloqueio({
        profissionalId: input.profissionalId,
        unidadeId: input.unidadeId,
        inicio: input.inicio,
        fim: input.fim,
      }),
    ]);

    return Result.ok({
      temConflito: conflitos.length > 0,
      conflitos,
      bloqueios,
      // Bloqueios (férias, manutenção) nunca são sobrepostos, nem com encaixe.
      podeEncaixar: conflitos.length > 0 && bloqueios.length === 0,
    });
  }
}
