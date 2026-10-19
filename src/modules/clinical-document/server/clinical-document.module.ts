import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IRedeLookup } from '@/modules/organization/domain/services/rede-lookup.interface';
import type { IPacienteLookup } from '@/modules/patient/domain/services/paciente-lookup.interface';
import type { IProntuarioLookup } from '@/modules/medical-record/domain/services/prontuario-lookup.interface';
import type { NotificacaoDispatcher } from '@/modules/notification/application/services/notificacao-dispatcher.service';
import { DocumentoPersistenceMapper } from './infrastructure/persistence/mappers/documento-persistence.mapper';
import { DocumentoRepositoryImpl } from './infrastructure/persistence/repositories/documento.repository.impl';
import { ProfissionalReaderAdapter } from './infrastructure/persistence/repositories/profissional-reader.adapter';
import { DocumentoStorageProvider } from './infrastructure/providers/documento-storage.provider';
import { PdfLibDocumentoProvider } from './infrastructure/providers/pdf-lib-documento.provider';
import { DocumentoMapper } from '../application/mappers/documento.mapper';
import {
  AtualizarDocumentoUseCase,
  CancelarDocumentoUseCase,
  CriarDocumentoUseCase,
  EmitirDocumentoUseCase,
  ListarDocumentosUseCase,
  ObterDocumentoUseCase,
  ObterLinkDocumentoUseCase,
  PrevisualizarDocumentoUseCase,
  type DocumentoUseCaseDependencies,
} from '../application/use-cases/documentos/documento.use-cases';
import { DocumentoController } from './api/controllers/documento.controller';

export type ClinicalDocumentModuleDependencies = {
  supabase: SupabaseClient;
  serviceClient?: SupabaseClient;
  medicalRecordLookups: { prontuarioLookup: IProntuarioLookup };
  organizationLookup: { unidadeLookup: IUnidadeLookup; redeLookup: IRedeLookup };
  patientLookup: { pacienteLookup: IPacienteLookup };
  /** Use cases do módulo de notificação: link do documento enviado ao paciente. */
  notification: { notificacaoDispatcher: NotificacaoDispatcher };
};

export function createClinicalDocumentModule(dependencies: ClinicalDocumentModuleDependencies) {
  const persistenceMapper = new DocumentoPersistenceMapper();
  const mapper = new DocumentoMapper();

  const documentoRepository = new DocumentoRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: persistenceMapper,
  });

  const useCaseDependencies: DocumentoUseCaseDependencies = {
    documentoRepository,
    storage: new DocumentoStorageProvider({
      supabase: dependencies.supabase,
      serviceClient: dependencies.serviceClient,
    }),
    pdf: new PdfLibDocumentoProvider(),
    mapper,
    unidadeLookup: dependencies.organizationLookup.unidadeLookup,
    redeLookup: dependencies.organizationLookup.redeLookup,
    pacienteLookup: dependencies.patientLookup.pacienteLookup,
    prontuarioLookup: dependencies.medicalRecordLookups.prontuarioLookup,
    profissionalReader: new ProfissionalReaderAdapter({ supabase: dependencies.supabase }),
    notification: dependencies.notification.notificacaoDispatcher,
  };

  const useCases = {
    criarDocumento: new CriarDocumentoUseCase(useCaseDependencies),
    atualizarDocumento: new AtualizarDocumentoUseCase(useCaseDependencies),
    emitirDocumento: new EmitirDocumentoUseCase(useCaseDependencies),
    cancelarDocumento: new CancelarDocumentoUseCase(useCaseDependencies),
    listarDocumentos: new ListarDocumentosUseCase(useCaseDependencies),
    obterDocumento: new ObterDocumentoUseCase(useCaseDependencies),
    obterLinkDocumento: new ObterLinkDocumentoUseCase(useCaseDependencies),
    previsualizarDocumento: new PrevisualizarDocumentoUseCase(useCaseDependencies),
  };

  const controller = new DocumentoController(useCases);

  return {
    controller,
    repositories: { documentoRepository },
    useCases,
    services: { pdf: useCaseDependencies.pdf, storage: useCaseDependencies.storage },
  };
}

export type ClinicalDocumentModule = ReturnType<typeof createClinicalDocumentModule>;
