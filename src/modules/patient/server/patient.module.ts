import type { SupabaseClient } from '@supabase/supabase-js';
import { PacientePersistenceMapper } from './infrastructure/persistence/mappers/paciente-persistence.mapper';
import { PacienteRepositoryImpl } from './infrastructure/persistence/repositories/paciente.repository.impl';
import { PacienteLookupAdapter } from './infrastructure/persistence/repositories/paciente-lookup.adapter';
import { PacienteMapper } from '../application/mappers/paciente.mapper';
import { ListarPacientesUseCase } from '../application/use-cases/listar-pacientes/listar-pacientes.use-case';
import { ObterPacienteUseCase } from '../application/use-cases/obter-paciente/obter-paciente.use-case';
import { CriarPacienteUseCase } from '../application/use-cases/criar-paciente/criar-paciente.use-case';
import { AtualizarPacienteUseCase } from '../application/use-cases/atualizar-paciente/atualizar-paciente.use-case';
import { InativarPacienteUseCase } from '../application/use-cases/inativar-paciente/inativar-paciente.use-case';
import { VerificarDuplicidadePacienteUseCase } from '../application/use-cases/verificar-duplicidade/verificar-duplicidade.use-case';
import { ImportarPacientesUseCase } from '../application/use-cases/importar-pacientes/importar-pacientes.use-case';
import { ExportarDadosPacienteUseCase } from '../application/use-cases/exportar-dados-paciente/exportar-dados-paciente.use-case';
import { PacienteController } from './api/controllers/paciente.controller';
import type { RegistrarAcessoProntuario } from '@/modules/audit/domain/services/log-acesso-prontuario.interface';

export type PatientModuleDependencies = {
  supabase: SupabaseClient;
  /** Cliente service_role — usado apenas para gravação do log de acesso LGPD. */
  serviceClient: SupabaseClient;
  /** Log de leitura/exportação dos dados do titular — LGPD (§5). */
  logAcessoProntuario: RegistrarAcessoProntuario;
};

export function createPatientModule(dependencies: PatientModuleDependencies) {
  const persistenceMapper = new PacientePersistenceMapper();
  const mapper = new PacienteMapper();

  const pacienteRepository = new PacienteRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: persistenceMapper,
  });

  const pacienteLookup = new PacienteLookupAdapter({
    supabase: dependencies.serviceClient,
    mapper: persistenceMapper,
  });

  const listarPacientes = new ListarPacientesUseCase({ pacienteRepository, mapper });
  const obterPaciente = new ObterPacienteUseCase({
    pacienteRepository,
    mapper,
    registrarAcesso: dependencies.logAcessoProntuario,
  });
  const criarPaciente = new CriarPacienteUseCase({ pacienteRepository, mapper });
  const atualizarPaciente = new AtualizarPacienteUseCase({ pacienteRepository, mapper });
  const inativarPaciente = new InativarPacienteUseCase({ pacienteRepository, mapper });
  const verificarDuplicidade = new VerificarDuplicidadePacienteUseCase({ pacienteRepository });
  const importarPacientes = new ImportarPacientesUseCase({ pacienteRepository });
  const exportarDadosPaciente = new ExportarDadosPacienteUseCase({
    pacienteRepository,
    registrarAcesso: dependencies.logAcessoProntuario,
  });

  const controller = new PacienteController({
    listarPacientes,
    obterPaciente,
    criarPaciente,
    atualizarPaciente,
    inativarPaciente,
    verificarDuplicidade,
    importarPacientes,
    exportarDadosPaciente,
  });

  return {
    controller,
    lookups: { pacienteLookup },
    repositories: { pacienteRepository },
    useCases: {
      listarPacientes,
      obterPaciente,
      criarPaciente,
      atualizarPaciente,
      inativarPaciente,
      verificarDuplicidade,
      importarPacientes,
      exportarDadosPaciente,
    },
  };
}

export type PatientModule = ReturnType<typeof createPatientModule>;
