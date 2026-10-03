/**
 * Container de injeção de dependências.
 * Construído por requisição (o client Supabase lê os cookies da sessão), liga
 * repositórios, providers e casos de uso, e expõe o gravador de auditoria para
 * o pipeline HTTP.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { createRouteClient, createServiceClient } from '../config/supabase.config';
import { registerAuditRecorder } from '../api/route-adapter';
import type { AuditRecorder } from '../api/route-adapter';
import { createAuditModule } from '@/modules/audit/server/audit.module';
import { createUsuarioModule } from '@/modules/user/server/usuario.module';
import { createNotificationModule } from '@/modules/notification/server/notification.module';
import { createOrganizationModule } from '@/modules/organization/server/organization.module';
import { createProfessionalModule } from '@/modules/professional/server/professional.module';
import { createPatientModule } from '@/modules/patient/server/patient.module';
import { createSchedulingModule } from '@/modules/scheduling/server/scheduling.module';
import { createMedicalRecordModule } from '@/modules/medical-record/server/medical-record.module';
import { createClinicalDocumentModule } from '@/modules/clinical-document/server/clinical-document.module';
import { createReportModule } from '@/modules/report/server/report.module';

export type AppContainer = ReturnType<typeof buildContainer>;

function buildContainer() {
  const supabase: SupabaseClient = createRouteClient();
  const serviceClient: SupabaseClient = createServiceClient();

  // Providers de infraestrutura compartilhados entre módulos.
  const audit = createAuditModule({ supabase });
  const notification = createNotificationModule({ supabase, serviceClient });

  const organization = createOrganizationModule({ supabase, serviceClient });
  const professional = createProfessionalModule({ supabase });
  const patient = createPatientModule({
    supabase,
    serviceClient,
    logAcessoProntuario: audit.logAcessoProntuario,
  });
  const scheduling = createSchedulingModule({
    supabase,
    notification: notification.useCases,
    patientLookup: patient.lookups,
    organizationLookup: organization.lookups,
    professionalLookup: professional.lookups,
  });
  const medicalRecord = createMedicalRecordModule({
    supabase,
    serviceClient,
    organizationLookup: organization.lookups,
    audit: audit.useCases.registrarAuditoria,
    logAcessoProntuario: audit.logAcessoProntuario,
  });
  const clinicalDocument = createClinicalDocumentModule({
    supabase,
    medicalRecordLookups: medicalRecord.lookups,
    organizationLookup: organization.lookups,
    patientLookup: patient.lookups,
    notification: notification.useCases,
  });
  const report = createReportModule({ supabase });
  const usuario = createUsuarioModule({ supabase, serviceClient });

  const auditRecorder: AuditRecorder = async (params) => {
    const entry = {
      redeId: params.context.redeId,
      userId: params.context.userId,
      userName: params.context.userName,
      userEmail: params.context.userEmail,
      userRole: params.context.role,
      unidadeId: extractUnitId(params.response.body),
      action: params.options.action,
      entity: params.options.entity,
      recordId: extractRecordId(params.response.body),
      description: params.options.description ?? null,
      before: null,
      after: (params.response.body as { data?: unknown })?.data ?? null,
      ip: params.context.ip,
      userAgent: params.context.userAgent,
    };
    await audit.writer.write(entry);
  };

  return {
    supabase,
    serviceClient,
    auditRecorder,
    modules: {
      audit,
      usuario,
      organization,
      professional,
      patient,
      scheduling,
      medicalRecord,
      clinicalDocument,
      report,
      notification,
    },
    controllers: {
      auditoria: audit.controller,
      usuario: usuario.controller,
      organizacao: organization.controller,
      profissional: professional.controller,
      paciente: patient.controller,
      agenda: scheduling.agendaController,
      recepcao: scheduling.recepcaoController,
      tiposAtendimento: scheduling.tipoAtendimentoController,
      bloqueio: scheduling.bloqueioController,
      template: medicalRecord.templateController,
      atendimento: medicalRecord.atendimentoController,
      anexo: medicalRecord.anexoController,
      documento: clinicalDocument.controller,
      relatorio: report.controller,
      notificacao: notification.controller,
    },
  };
}

function extractRecordId(body: unknown): string | null {
  const data = (body as { data?: Record<string, unknown> })?.data;
  if (!data || typeof data !== 'object') return null;
  return typeof data.id === 'string' ? data.id : null;
}

function extractUnitId(body: unknown): string | null {
  const data = (body as { data?: Record<string, unknown> })?.data;
  if (!data || typeof data !== 'object') return null;
  return typeof data.unidadeId === 'string' ? data.unidadeId : null;
}

/** Construído no escopo da requisição para respeitar cookies e RLS. */
export function getContainer(): AppContainer {
  return buildContainer();
}

/**
 * Acesso tardio aos controllers: a construção do container (clients Supabase)
 * acontece no primeiro acesso ao controller, dentro do `handleRoute` — assim
 * erros de configuração são convertidos na resposta padronizada da API em vez
 * de escaparem como HTTP 500 sem corpo.
 */
export function lazyControllers(): AppContainer['controllers'] {
  return new Proxy({} as AppContainer['controllers'], {
    get(_alvo, propriedade) {
      return getContainer().controllers[propriedade as keyof AppContainer['controllers']];
    },
  });
}

// O adaptador de rotas grava a auditoria sem conhecer o módulo audit.
registerAuditRecorder(() => getContainer().auditRecorder);
