import type { SupabaseClient } from '@supabase/supabase-js';
import type { IPacienteLookup, PacienteResumo } from '../../../../domain/services/paciente-lookup.interface';
import { PacientePersistenceMapper } from '../mappers/paciente-persistence.mapper';
import { toPacienteResumo } from '../../../../application/mappers/paciente.mapper';
import { PACIENTE_COLUMNS } from '../models/paciente.model';
import type { PacienteModel } from '../models/paciente.model';

export type PacienteLookupAdapterDependencies = {
  supabase: SupabaseClient;
  mapper: PacientePersistenceMapper;
};

/** ACL de leitura consumida por agenda, prontuário e documentos clínicos. */
export class PacienteLookupAdapter implements IPacienteLookup {
  private readonly supabase: SupabaseClient;
  private readonly mapper: PacientePersistenceMapper;

  constructor(dependencies: PacienteLookupAdapterDependencies) {
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(pacienteId: string): Promise<PacienteResumo | null> {
    const { data } = await this.supabase
      .from('pacientes')
      .select(PACIENTE_COLUMNS)
      .eq('id', pacienteId)
      .is('deleted_at', null)
      .maybeSingle<PacienteModel>();

    return data ? toPacienteResumo(this.mapper.toDomain({ record: data })) : null;
  }

  async listarPorIds(pacienteIds: string[]): Promise<PacienteResumo[]> {
    if (pacienteIds.length === 0) return [];

    const { data } = await this.supabase
      .from('pacientes')
      .select(PACIENTE_COLUMNS)
      .in('id', pacienteIds)
      .is('deleted_at', null)
      .returns<PacienteModel[]>();

    return (data ?? []).map((record) => toPacienteResumo(this.mapper.toDomain({ record })));
  }
}
