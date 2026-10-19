import { UseCase } from '@core/application/use-case.base';
import { Result } from '@core/domain/result';
import type { IRelatorioRepository } from '../../../domain/repositories/relatorio-repository.interface';
import type {
  DashboardDto,
  RelatorioAtendimentosOutputDto,
  RelatorioDistribuicaoOutputDto,
  RelatorioFaltasOutputDto,
  RelatorioFiltroInputDto,
  RelatorioNovosPacientesOutputDto,
  RelatorioProdutividadeOutputDto,
  RelatorioVisaoGeralOutputDto,
} from '../../dtos/relatorio.dto';

export type RelatorioUseCasesDependencies = {
  relatorioRepository: IRelatorioRepository;
};

/** Indicadores do topo do dashboard (§3.8) — restrito a gestão. */
export class ObterDashboardUseCase extends UseCase<{ unidadeId?: string | null }, DashboardDto> {
  private readonly repository: IRelatorioRepository;

  constructor(dependencies: RelatorioUseCasesDependencies) {
    super();
    this.repository = dependencies.relatorioRepository;
  }

  async execute(input: { unidadeId?: string | null }): Promise<Result<DashboardDto>> {
    const indicadores = await this.repository.indicadoresDashboard({ unidadeId: input.unidadeId ?? null });
    return Result.ok(indicadores);
  }
}

export class RelatorioAtendimentosUseCase extends UseCase<
  RelatorioFiltroInputDto,
  RelatorioAtendimentosOutputDto
> {
  private readonly repository: IRelatorioRepository;

  constructor(dependencies: RelatorioUseCasesDependencies) {
    super();
    this.repository = dependencies.relatorioRepository;
  }

  async execute(input: RelatorioFiltroInputDto): Promise<Result<RelatorioAtendimentosOutputDto>> {
    const linhas = await this.repository.atendimentosPorPeriodo({
      redeId: input.redeId,
      periodo: { inicio: input.inicio, fim: input.fim },
      unidadeId: input.unidadeId ?? null,
      profissionalId: input.profissionalId ?? null,
    });

    return Result.ok({
      linhas,
      totais: {
        agendados: linhas.reduce((total, linha) => total + linha.totalAgendados, 0),
        finalizados: linhas.reduce((total, linha) => total + linha.totalFinalizados, 0),
        cancelados: linhas.reduce((total, linha) => total + linha.totalCancelados, 0),
        faltas: linhas.reduce((total, linha) => total + linha.totalFaltas, 0),
      },
    });
  }
}

export class RelatorioFaltasUseCase extends UseCase<RelatorioFiltroInputDto, RelatorioFaltasOutputDto> {
  private readonly repository: IRelatorioRepository;

  constructor(dependencies: RelatorioUseCasesDependencies) {
    super();
    this.repository = dependencies.relatorioRepository;
  }

  async execute(input: RelatorioFiltroInputDto): Promise<Result<RelatorioFaltasOutputDto>> {
    const linhas = await this.repository.faltasCancelamentos({
      redeId: input.redeId,
      periodo: { inicio: input.inicio, fim: input.fim },
      unidadeId: input.unidadeId ?? null,
    });

    const agendamentos = linhas.reduce((total, linha) => total + linha.totalAgendamentos, 0);
    const faltas = linhas.reduce((total, linha) => total + linha.totalFaltas, 0);
    const cancelamentos = linhas.reduce((total, linha) => total + linha.totalCancelamentos, 0);

    return Result.ok({
      linhas,
      totais: {
        agendamentos,
        faltas,
        cancelamentos,
        taxaFaltas: agendamentos > 0 ? Number(((faltas / agendamentos) * 100).toFixed(2)) : 0,
      },
    });
  }
}

export class RelatorioNovosPacientesUseCase extends UseCase<
  RelatorioFiltroInputDto,
  RelatorioNovosPacientesOutputDto
> {
  private readonly repository: IRelatorioRepository;

  constructor(dependencies: RelatorioUseCasesDependencies) {
    super();
    this.repository = dependencies.relatorioRepository;
  }

  async execute(input: RelatorioFiltroInputDto): Promise<Result<RelatorioNovosPacientesOutputDto>> {
    const linhas = await this.repository.novosPacientesPorMes({
      redeId: input.redeId,
      periodo: { inicio: input.inicio, fim: input.fim },
    });

    return Result.ok({
      linhas,
      totalPacientes: linhas.reduce((total, linha) => total + linha.totalPacientes, 0),
    });
  }
}

export class RelatorioDistribuicaoUseCase extends UseCase<
  RelatorioFiltroInputDto & { dimensao?: 'tipo' | 'especialidade' | null },
  RelatorioDistribuicaoOutputDto
> {
  private readonly repository: IRelatorioRepository;

  constructor(dependencies: RelatorioUseCasesDependencies) {
    super();
    this.repository = dependencies.relatorioRepository;
  }

  async execute(
    input: RelatorioFiltroInputDto & { dimensao?: 'tipo' | 'especialidade' | null },
  ): Promise<Result<RelatorioDistribuicaoOutputDto>> {
    const dimensao = input.dimensao ?? 'tipo';

    const linhas = await this.repository.distribuicao({
      redeId: input.redeId,
      periodo: { inicio: input.inicio, fim: input.fim },
      unidadeId: input.unidadeId ?? null,
      dimensao,
    });

    return Result.ok({ linhas, dimensao });
  }
}

export class RelatorioProdutividadeUseCase extends UseCase<
  RelatorioFiltroInputDto,
  RelatorioProdutividadeOutputDto
> {
  private readonly repository: IRelatorioRepository;

  constructor(dependencies: RelatorioUseCasesDependencies) {
    super();
    this.repository = dependencies.relatorioRepository;
  }

  async execute(input: RelatorioFiltroInputDto): Promise<Result<RelatorioProdutividadeOutputDto>> {
    const linhas = await this.repository.produtividade({
      redeId: input.redeId,
      periodo: { inicio: input.inicio, fim: input.fim },
      unidadeId: input.unidadeId ?? null,
    });

    return Result.ok({
      linhas,
      totalAtendimentos: linhas.reduce((total, linha) => total + linha.totalAtendimentos, 0),
    });
  }
}

/** Todas as visões em uma única chamada — usado pela página de relatórios. */
export class RelatorioVisaoGeralUseCase extends UseCase<
  RelatorioFiltroInputDto,
  RelatorioVisaoGeralOutputDto
> {
  private readonly repository: IRelatorioRepository;

  constructor(dependencies: RelatorioUseCasesDependencies) {
    super();
    this.repository = dependencies.relatorioRepository;
  }

  async execute(input: RelatorioFiltroInputDto): Promise<Result<RelatorioVisaoGeralOutputDto>> {
    const periodo = { inicio: input.inicio, fim: input.fim };
    const base = { redeId: input.redeId, periodo, unidadeId: input.unidadeId ?? null };

    const [dashboard, atendimentos, faltas, novosPacientes, distribuicao, produtividade] =
      await Promise.all([
        this.repository.indicadoresDashboard({ unidadeId: input.unidadeId ?? null }),
        this.repository.atendimentosPorPeriodo({
          ...base,
          profissionalId: input.profissionalId ?? null,
        }),
        this.repository.faltasCancelamentos(base),
        this.repository.novosPacientesPorMes({ redeId: input.redeId, periodo }),
        this.repository.distribuicao(base),
        this.repository.produtividade(base),
      ]);

    const agendamentos = atendimentos.reduce((total, linha) => total + linha.totalAgendados, 0);
    const totalFaltas = atendimentos.reduce((total, linha) => total + linha.totalFaltas, 0);

    return Result.ok({
      periodo,
      dashboard,
      atendimentos: {
        linhas: atendimentos,
        totais: {
          agendados: agendamentos,
          finalizados: atendimentos.reduce((total, linha) => total + linha.totalFinalizados, 0),
          cancelados: atendimentos.reduce((total, linha) => total + linha.totalCancelados, 0),
          faltas: totalFaltas,
        },
      },
      faltas: {
        linhas: faltas,
        totais: {
          agendamentos: faltas.reduce((total, linha) => total + linha.totalAgendamentos, 0),
          faltas: faltas.reduce((total, linha) => total + linha.totalFaltas, 0),
          cancelamentos: faltas.reduce((total, linha) => total + linha.totalCancelamentos, 0),
          taxaFaltas: agendamentos > 0 ? Number(((totalFaltas / agendamentos) * 100).toFixed(2)) : 0,
        },
      },
      novosPacientes: {
        linhas: novosPacientes,
        totalPacientes: novosPacientes.reduce((total, linha) => total + linha.totalPacientes, 0),
      },
      distribuicao: {
        tipo: distribuicao.filter((linha) => linha.dimensao === 'tipo'),
        especialidade: distribuicao.filter((linha) => linha.dimensao === 'especialidade'),
      },
      produtividade: {
        linhas: produtividade,
        totalAtendimentos: produtividade.reduce((total, linha) => total + linha.totalAtendimentos, 0),
      },
    });
  }
}
