import type { SupabaseClient } from '@supabase/supabase-js';
import { RelatorioRepositoryImpl } from './infrastructure/persistence/repositories/relatorio.repository.impl';
import {
  ObterDashboardUseCase,
  RelatorioAtendimentosUseCase,
  RelatorioDistribuicaoUseCase,
  RelatorioFaltasUseCase,
  RelatorioNovosPacientesUseCase,
  RelatorioProdutividadeUseCase,
  RelatorioVisaoGeralUseCase,
} from '../application/use-cases/relatorios/relatorio.use-cases';
import { RelatorioController } from './api/controllers/relatorio.controller';

export type ReportModuleDependencies = {
  supabase: SupabaseClient;
};

/** Relatórios (§3.8): cálculo no banco, formatação na aplicação. */
export function createReportModule(dependencies: ReportModuleDependencies) {
  const relatorioRepository = new RelatorioRepositoryImpl({ supabase: dependencies.supabase });
  const useCaseDependencies = { relatorioRepository };

  const useCases = {
    obterDashboard: new ObterDashboardUseCase(useCaseDependencies),
    relatorioAtendimentos: new RelatorioAtendimentosUseCase(useCaseDependencies),
    relatorioFaltas: new RelatorioFaltasUseCase(useCaseDependencies),
    relatorioNovosPacientes: new RelatorioNovosPacientesUseCase(useCaseDependencies),
    relatorioDistribuicao: new RelatorioDistribuicaoUseCase(useCaseDependencies),
    relatorioProdutividade: new RelatorioProdutividadeUseCase(useCaseDependencies),
    relatorioVisaoGeral: new RelatorioVisaoGeralUseCase(useCaseDependencies),
  };

  const controller = new RelatorioController(useCases);

  return {
    controller,
    repositories: { relatorioRepository },
    useCases,
  };
}

export type ReportModule = ReturnType<typeof createReportModule>;
