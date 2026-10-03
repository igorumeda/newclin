import type { SupabaseClient } from '@supabase/supabase-js';
import { getEnv, getMaxUploadSizeBytes, getStorageSignedUrlTtl } from '@/server/config/env.config';
import { RedeRepositoryImpl } from './infrastructure/persistence/repositories/rede.repository.impl';
import { UnidadeRepositoryImpl } from './infrastructure/persistence/repositories/unidade.repository.impl';
import { UnidadeLookupAdapter } from './infrastructure/persistence/repositories/unidade-lookup.adapter';
import { RedeLookupAdapter } from './infrastructure/persistence/repositories/rede-lookup.adapter';
import {
  RedePersistenceMapper,
  UnidadePersistenceMapper,
} from './infrastructure/persistence/mappers/organizacao-persistence.mapper';
import { SupabaseLogoStorageProvider } from './infrastructure/providers/supabase-logo-storage.provider';
import { OrganizacaoMapper, UnidadeMapper } from '../application/mappers/organizacao.mapper';
import { ObterOrganizacaoUseCase } from '../application/use-cases/obter-organizacao/obter-organizacao.use-case';
import { AtualizarOrganizacaoUseCase } from '../application/use-cases/atualizar-organizacao/atualizar-organizacao.use-case';
import { AtualizarTemaUseCase } from '../application/use-cases/atualizar-tema/atualizar-tema.use-case';
import { DefinirLogotipoUseCase } from '../application/use-cases/definir-logotipo/definir-logotipo.use-case';
import { ListarUnidadesUseCase } from '../application/use-cases/listar-unidades/listar-unidades.use-case';
import { CriarUnidadeUseCase } from '../application/use-cases/criar-unidade/criar-unidade.use-case';
import { AtualizarUnidadeUseCase } from '../application/use-cases/atualizar-unidade/atualizar-unidade.use-case';
import { InativarUnidadeUseCase } from '../application/use-cases/inativar-unidade/inativar-unidade.use-case';
import { OrganizacaoController } from './api/controllers/organizacao.controller';

export type OrganizationModuleDependencies = {
  supabase: SupabaseClient;
  serviceClient: SupabaseClient;
};

export function createOrganizationModule(dependencies: OrganizationModuleDependencies) {
  const env = getEnv();
  const redeMapper = new RedePersistenceMapper();
  const unidadeMapper = new UnidadePersistenceMapper();
  const organizacaoMapper = new OrganizacaoMapper();
  const unidadeDtoMapper = new UnidadeMapper();

  const redeRepository = new RedeRepositoryImpl({ supabase: dependencies.supabase, mapper: redeMapper });
  const unidadeRepository = new UnidadeRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: unidadeMapper,
  });
  const redeLookup = new RedeLookupAdapter({ supabase: dependencies.supabase });
  const unidadeLookup = new UnidadeLookupAdapter({
    supabase: dependencies.supabase,
    mapper: unidadeMapper,
  });
  const logoStorage = new SupabaseLogoStorageProvider({
    serviceClient: dependencies.serviceClient,
    bucket: env.SUPABASE_STORAGE_BUCKET_LOGOS,
  });

  const obterOrganizacao = new ObterOrganizacaoUseCase({
    redeRepository,
    mapper: organizacaoMapper,
  });
  const atualizarOrganizacao = new AtualizarOrganizacaoUseCase({
    redeRepository,
    mapper: organizacaoMapper,
  });
  const atualizarTema = new AtualizarTemaUseCase({ redeRepository });
  const definirLogotipo = new DefinirLogotipoUseCase({
    redeRepository,
    logoStorage,
    maxUploadSizeBytes: getMaxUploadSizeBytes(),
    signedUrlTtlSeconds: getStorageSignedUrlTtl(),
  });
  const listarUnidades = new ListarUnidadesUseCase({
    unidadeRepository,
    mapper: unidadeDtoMapper,
  });
  const criarUnidade = new CriarUnidadeUseCase({ unidadeRepository, mapper: unidadeDtoMapper });
  const atualizarUnidade = new AtualizarUnidadeUseCase({ unidadeRepository, mapper: unidadeDtoMapper });
  const inativarUnidade = new InativarUnidadeUseCase({ unidadeRepository, mapper: unidadeDtoMapper });

  const controller = new OrganizacaoController({
    obterOrganizacao,
    atualizarOrganizacao,
    atualizarTema,
    definirLogotipo,
    listarUnidades,
    criarUnidade,
    atualizarUnidade,
    inativarUnidade,
  });

  return {
    controller,
    lookups: { redeLookup, unidadeLookup },
    repositories: { redeRepository, unidadeRepository },
    useCases: {
      obterOrganizacao,
      atualizarOrganizacao,
      atualizarTema,
      definirLogotipo,
      listarUnidades,
      criarUnidade,
      atualizarUnidade,
      inativarUnidade,
    },
  };
}

export type OrganizationModule = ReturnType<typeof createOrganizationModule>;
