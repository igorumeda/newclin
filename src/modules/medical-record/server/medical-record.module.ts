import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUseCase } from '@core/application/use-case.interface';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IRedeLookup } from '@/modules/organization/domain/services/rede-lookup.interface';
import type { RegistrarAcessoProntuario } from '@/modules/audit/domain/services/log-acesso-prontuario.interface';
import type { RegistrarAuditoriaInputDto } from '@/modules/audit/application/use-cases/registrar-auditoria/registrar-auditoria.input.dto';
import type { RegistrarAuditoriaOutputDto } from '@/modules/audit/application/use-cases/registrar-auditoria/registrar-auditoria.output.dto';
import { TemplateProntuarioPersistenceMapper, AtendimentoPersistenceMapper, EvolucaoPersistenceMapper, AnexoPersistenceMapper } from './infrastructure/persistence/mappers/prontuario-persistence.mapper';
import { TemplateProntuarioRepositoryImpl } from './infrastructure/persistence/repositories/template-prontuario.repository.impl';
import { AtendimentoRepositoryImpl } from './infrastructure/persistence/repositories/atendimento.repository.impl';
import { EvolucaoRepositoryImpl } from './infrastructure/persistence/repositories/evolucao.repository.impl';
import { AnexoRepositoryImpl } from './infrastructure/persistence/repositories/anexo.repository.impl';
import { ProntuarioLookupAdapter } from './infrastructure/persistence/repositories/prontuario-lookup.adapter';
import { AnexoStorageProvider } from './infrastructure/providers/anexo-storage.provider';
import { AnexoMapper, AtendimentoMapper, EvolucaoMapper, TemplateProntuarioMapper } from '../application/mappers/prontuario.mapper';
import { ProntuarioEnricher } from '../application/services/prontuario-enricher.service';
import {
  AtualizarTemplateUseCase,
  ClonarTemplateUseCase,
  CriarTemplateUseCase,
  InativarTemplateUseCase,
  ListarTemplatesUseCase,
  ObterTemplateUseCase,
} from '../application/use-cases/templates/template.use-cases';
import {
  CancelarAtendimentoUseCase,
  FinalizarAtendimentoUseCase,
  IniciarAtendimentoUseCase,
  ObterAtendimentoUseCase,
  SalvarRascunhoAtendimentoUseCase,
} from '../application/use-cases/atendimentos/atendimento.use-cases';
import {
  AdicionarAdendoUseCase,
  ListarEvolucoesUseCase,
} from '../application/use-cases/evolucoes/evolucao.use-cases';
import { ListarAtendimentosUseCase } from '../application/use-cases/listar-atendimentos/listar-atendimentos.use-case';
import {
  EnviarAnexoUseCase,
  ListarAnexosUseCase,
  ObterLinkAnexoUseCase,
  RemoverAnexoUseCase,
} from '../application/use-cases/anexos/anexo.use-cases';
import { TemplateController } from './api/controllers/template.controller';
import { AtendimentoController } from './api/controllers/atendimento.controller';
import { AnexoController } from './api/controllers/anexo.controller';

export type MedicalRecordModuleDependencies = {
  supabase: SupabaseClient;
  /** Cliente `service_role` — emissão de URLs assinadas dos anexos. */
  serviceClient?: SupabaseClient;
  organizationLookup: { unidadeLookup: IUnidadeLookup; redeLookup: IRedeLookup };
  /** Trilha de auditoria das ações sensíveis do prontuário (§5). */
  audit: IUseCase<RegistrarAuditoriaInputDto, RegistrarAuditoriaOutputDto>;
  /** Log de leitura do prontuário — LGPD (§5), fornecido pelo módulo de auditoria. */
  logAcessoProntuario: RegistrarAcessoProntuario;
};

export function createMedicalRecordModule(dependencies: MedicalRecordModuleDependencies) {
  const templateMapper = new TemplateProntuarioPersistenceMapper();
  const atendimentoMapper = new AtendimentoPersistenceMapper();
  const evolucaoMapper = new EvolucaoPersistenceMapper();
  const anexoMapper = new AnexoPersistenceMapper();

  const mapper = {
    template: new TemplateProntuarioMapper(),
    atendimento: new AtendimentoMapper(),
    evolucao: new EvolucaoMapper(),
    anexo: new AnexoMapper(),
  };

  const templateRepository = new TemplateProntuarioRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: templateMapper,
  });
  const atendimentoRepository = new AtendimentoRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: atendimentoMapper,
  });
  const evolucaoRepository = new EvolucaoRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: evolucaoMapper,
  });
  const anexoRepository = new AnexoRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: anexoMapper,
  });

  const storage = new AnexoStorageProvider({
    supabase: dependencies.supabase,
    serviceClient: dependencies.serviceClient,
  });

  const enricher = new ProntuarioEnricher({ supabase: dependencies.supabase });

  const templateUseCases = {
    listarTemplates: new ListarTemplatesUseCase({ templateRepository, mapper: mapper.template }),
    obterTemplate: new ObterTemplateUseCase({ templateRepository, mapper: mapper.template }),
    criarTemplate: new CriarTemplateUseCase({ templateRepository, mapper: mapper.template }),
    clonarTemplate: new ClonarTemplateUseCase({ templateRepository, mapper: mapper.template }),
    atualizarTemplate: new AtualizarTemplateUseCase({ templateRepository, mapper: mapper.template }),
    inativarTemplate: new InativarTemplateUseCase({ templateRepository, mapper: mapper.template }),
  };

  const atendimentoDependencies = {
    atendimentoRepository,
    templateRepository,
    mapper: mapper.atendimento,
    auditoria: dependencies.audit,
    registrarAcesso: dependencies.logAcessoProntuario,
    enricher,
  };

  const atendimentoUseCases = {
    iniciarAtendimento: new IniciarAtendimentoUseCase(atendimentoDependencies),
    obterAtendimento: new ObterAtendimentoUseCase(atendimentoDependencies),
    salvarRascunho: new SalvarRascunhoAtendimentoUseCase(atendimentoDependencies),
    finalizarAtendimento: new FinalizarAtendimentoUseCase(atendimentoDependencies),
    cancelarAtendimento: new CancelarAtendimentoUseCase(atendimentoDependencies),
    listarAtendimentos: new ListarAtendimentosUseCase({
      atendimentoRepository,
      mapper: mapper.atendimento,
      enricher,
    }),
  };

  const adendoUseCases = {
    adicionarAdendo: new AdicionarAdendoUseCase({
      atendimentoRepository,
      evolucaoRepository,
      mapper: mapper.evolucao,
    }),
    listarEvolucoes: new ListarEvolucoesUseCase({
      atendimentoRepository,
      evolucaoRepository,
      mapper: mapper.evolucao,
    }),
  };

  const anexoDependencies = { anexoRepository, storage, mapper: mapper.anexo };

  const anexoUseCases = {
    enviarAnexo: new EnviarAnexoUseCase(anexoDependencies),
    listarAnexos: new ListarAnexosUseCase(anexoDependencies),
    obterLinkAnexo: new ObterLinkAnexoUseCase(anexoDependencies),
    removerAnexo: new RemoverAnexoUseCase(anexoDependencies),
  };

  const templateController = new TemplateController(templateUseCases);
  const atendimentoController = new AtendimentoController({
    ...atendimentoUseCases,
    adicionarAdendo: adendoUseCases.adicionarAdendo,
    listarEvolucoes: adendoUseCases.listarEvolucoes,
  });
  const anexoController = new AnexoController(anexoUseCases);

  return {
    templateController,
    atendimentoController,
    anexoController,
    controllers: { template: templateController, atendimento: atendimentoController, anexo: anexoController },
    lookups: { prontuarioLookup: new ProntuarioLookupAdapter({ supabase: dependencies.supabase }) },
    repositories: { templateRepository, atendimentoRepository, evolucaoRepository, anexoRepository },
    useCases: { ...templateUseCases, ...atendimentoUseCases, ...adendoUseCases, ...anexoUseCases },
    services: { enricher, storage },
  };
}

export type MedicalRecordModule = ReturnType<typeof createMedicalRecordModule>;
