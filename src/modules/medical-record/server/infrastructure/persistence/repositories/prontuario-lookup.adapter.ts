import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AnexoResumo,
  IProntuarioLookup,
  AtendimentoResumo,
} from '../../../../domain/services/prontuario-lookup.interface';
import type { DadosPreenchidos } from '../../../../domain/value-objects/dados-prontuario.vo';
import { ANEXO_COLUMNS, ATENDIMENTO_COLUMNS } from '../models/prontuario.model';
import type { AnexoModel, AtendimentoModel } from '../models/prontuario.model';

export type ProntuarioLookupAdapterDependencies = {
  supabase: SupabaseClient;
};

/**
 * ACL de leitura do prontuário consumida pelo módulo de documentos clínicos.
 * Devolve apenas os campos necessários à composição do PDF — sem template,
 * sem anexos binários e sem trilha de auditoria.
 */
export class ProntuarioLookupAdapter implements IProntuarioLookup {
  private readonly supabase: SupabaseClient;

  constructor(dependencies: ProntuarioLookupAdapterDependencies) {
    this.supabase = dependencies.supabase;
  }

  async findAtendimentoById(atendimentoId: string): Promise<AtendimentoResumo | null> {
    const { data } = await this.supabase
      .from('atendimentos')
      .select(ATENDIMENTO_COLUMNS)
      .eq('id', atendimentoId)
      .is('deleted_at', null)
      .maybeSingle<AtendimentoModel>();

    return data ? this.toResumo(data) : null;
  }

  async findAtendimentoPorAgendamento(agendamentoId: string): Promise<AtendimentoResumo | null> {
    const { data } = await this.supabase
      .from('atendimentos')
      .select(ATENDIMENTO_COLUMNS)
      .eq('agendamento_id', agendamentoId)
      .is('deleted_at', null)
      .maybeSingle<AtendimentoModel>();

    return data ? this.toResumo(data) : null;
  }

  async listarAtendimentosPorPaciente(params: {
    redeId: string;
    pacienteId: string;
    limite?: number;
  }): Promise<AtendimentoResumo[]> {
    const { data } = await this.supabase
      .from('atendimentos')
      .select(ATENDIMENTO_COLUMNS)
      .eq('rede_id', params.redeId)
      .eq('paciente_id', params.pacienteId)
      .is('deleted_at', null)
      .order('iniciado_em', { ascending: false })
      .limit(params.limite ?? 20)
      .returns<AtendimentoModel[]>();

    return (data ?? []).map((record) => this.toResumo(record));
  }

  async listarAnexos(params: {
    redeId: string;
    pacienteId?: string | null;
    atendimentoId?: string | null;
  }): Promise<AnexoResumo[]> {
    let query = this.supabase
      .from('anexos')
      .select(ANEXO_COLUMNS)
      .eq('rede_id', params.redeId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (params.pacienteId) query = query.eq('paciente_id', params.pacienteId);
    if (params.atendimentoId) query = query.eq('atendimento_id', params.atendimentoId);

    const { data } = await query.returns<AnexoModel[]>();

    return (data ?? []).map((record) => ({
      id: record.id,
      pacienteId: record.paciente_id,
      atendimentoId: record.atendimento_id,
      nomeArquivo: record.nome_arquivo,
      mimeType: record.mime_type,
      tamanhoBytes: Number(record.tamanho_bytes),
      storageBucket: record.storage_bucket,
      storagePath: record.storage_path,
      createdAt: record.created_at,
    }));
  }

  private toResumo(record: AtendimentoModel): AtendimentoResumo {
    return {
      id: record.id,
      redeId: record.rede_id,
      unidadeId: record.unidade_id,
      pacienteId: record.paciente_id,
      profissionalId: record.profissional_id,
      agendamentoId: record.agendamento_id,
      status: record.status,
      iniciadoEm: record.iniciado_em,
      finalizadoEm: record.finalizado_em,
      queixaPrincipal: record.queixa_principal,
      hipoteseDiagnostica: record.hipotese_diagnostica,
      cid: record.cid,
      conduta: record.conduta,
      anamnese: record.anamnese,
      exameFisico: record.exame_fisico,
      dadosPreenchidos: (record.dados_preenchidos ?? {}) as DadosPreenchidos,
      templateId: record.template_id,
      templateVersao: record.template_versao,
    };
  }
}
