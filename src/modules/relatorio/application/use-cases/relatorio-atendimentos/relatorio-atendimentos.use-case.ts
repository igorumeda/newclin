import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type {
  DistribuicaoItem,
  IRelatorioRepository,
  SerieTemporalPonto,
} from '../../../domain/repositories/relatorio-repository.interface';
import type { RelatorioAtendimentosInputDto } from './relatorio-atendimentos.input.dto';

export type RelatorioAtendimentosDependencies = { relatorioRepository: IRelatorioRepository };

export type RelatorioAtendimentosOutputDto = {
  inicio: string;
  fim: string;
  total: number;
  serie: SerieTemporalPonto[];
  porTipo: DistribuicaoItem[];
  porEspecialidade: DistribuicaoItem[];
};

export class RelatorioAtendimentosUseCase extends UseCase<
  RelatorioAtendimentosInputDto,
  RelatorioAtendimentosOutputDto
> {
  private readonly relatorioRepository: IRelatorioRepository;

  constructor(dependencies: RelatorioAtendimentosDependencies) {
    super();
    this.relatorioRepository = dependencies.relatorioRepository;
  }

  async execute(
    input: RelatorioAtendimentosInputDto,
  ): Promise<Result<RelatorioAtendimentosOutputDto>> {
    if (new Date(input.fim).getTime() <= new Date(input.inicio).getTime()) {
      return Result.fail(new Error('Período inválido para o relatório'));
    }

    const filtros = {
      redeId: input.redeId,
      unidadeId: input.unidadeId ?? null,
      profissionalId: input.profissionalId ?? null,
      inicio: input.inicio,
      fim: input.fim,
    };

    const [serie, porTipo, porEspecialidade] = await Promise.all([
      this.relatorioRepository.atendimentosPorPeriodo(filtros),
      this.relatorioRepository.distribuicaoPorTipo(filtros),
      this.relatorioRepository.distribuicaoPorEspecialidade(filtros),
    ]);

    return Result.ok({
      inicio: input.inicio,
      fim: input.fim,
      total: serie.reduce((soma, ponto) => soma + ponto.total, 0),
      serie,
      porTipo,
      porEspecialidade,
    });
  }
}
