import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type {
  IRelatorioRepository,
  SerieTemporalPonto,
} from '../../../domain/repositories/relatorio-repository.interface';
import type { RelatorioNovosPacientesInputDto } from './relatorio-novos-pacientes.input.dto';

export type RelatorioNovosPacientesDependencies = { relatorioRepository: IRelatorioRepository };

export class RelatorioNovosPacientesUseCase extends UseCase<
  RelatorioNovosPacientesInputDto,
  SerieTemporalPonto[]
> {
  private readonly relatorioRepository: IRelatorioRepository;

  constructor(dependencies: RelatorioNovosPacientesDependencies) {
    super();
    this.relatorioRepository = dependencies.relatorioRepository;
  }

  async execute(input: RelatorioNovosPacientesInputDto): Promise<Result<SerieTemporalPonto[]>> {
    const serie = await this.relatorioRepository.novosPacientesPorMes({
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      profissionalId: null,
      inicio: input.inicio,
      fim: input.fim,
    });
    return Result.ok(serie);
  }
}
