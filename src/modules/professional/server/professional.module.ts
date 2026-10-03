import type { SupabaseClient } from '@supabase/supabase-js';
import { ProfissionalRepositoryImpl } from './infrastructure/persistence/repositories/profissional.repository.impl';
import { ProfissionalLookupAdapter } from './infrastructure/persistence/repositories/profissional-lookup.adapter';
import {
  HorarioAtendimentoPersistenceMapper,
  ProfissionalPersistenceMapper,
} from './infrastructure/persistence/mappers/profissional-persistence.mapper';
import { ProfissionalMapper } from '../application/mappers/profissional.mapper';
import { ListarProfissionaisUseCase } from '../application/use-cases/listar-profissionais/listar-profissionais.use-case';
import { CriarProfissionalUseCase } from '../application/use-cases/criar-profissional/criar-profissional.use-case';
import { AtualizarProfissionalUseCase } from '../application/use-cases/atualizar-profissional/atualizar-profissional.use-case';
import { InativarProfissionalUseCase } from '../application/use-cases/inativar-profissional/inativar-profissional.use-case';
import { DefinirHorariosUseCase } from '../application/use-cases/definir-horarios/definir-horarios.use-case';
import { DefinirUnidadesUseCase } from '../application/use-cases/definir-unidades/definir-unidades.use-case';
import { ProfissionalController } from './api/controllers/profissional.controller';

export type ProfessionalModuleDependencies = {
  supabase: SupabaseClient;
};

export function createProfessionalModule(dependencies: ProfessionalModuleDependencies) {
  const persistenceMapper = new ProfissionalPersistenceMapper();
  const horarioMapper = new HorarioAtendimentoPersistenceMapper();
  const mapper = new ProfissionalMapper();

  const profissionalRepository = new ProfissionalRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: persistenceMapper,
    horarioMapper,
  });

  const profissionalLookup = new ProfissionalLookupAdapter({
    supabase: dependencies.supabase,
    mapper: persistenceMapper,
  });

  const listarProfissionais = new ListarProfissionaisUseCase({ profissionalRepository, mapper });
  const criarProfissional = new CriarProfissionalUseCase({ profissionalRepository, mapper });
  const atualizarProfissional = new AtualizarProfissionalUseCase({ profissionalRepository, mapper });
  const inativarProfissional = new InativarProfissionalUseCase({ profissionalRepository, mapper });
  const definirHorarios = new DefinirHorariosUseCase({ profissionalRepository });
  const definirUnidades = new DefinirUnidadesUseCase({ profissionalRepository });

  const controller = new ProfissionalController({
    listarProfissionais,
    criarProfissional,
    atualizarProfissional,
    inativarProfissional,
    definirHorarios,
    definirUnidades,
  });

  return {
    controller,
    lookups: { profissionalLookup },
    repositories: { profissionalRepository },
    useCases: {
      listarProfissionais,
      criarProfissional,
      atualizarProfissional,
      inativarProfissional,
      definirHorarios,
      definirUnidades,
    },
  };
}

export type ProfessionalModule = ReturnType<typeof createProfessionalModule>;
