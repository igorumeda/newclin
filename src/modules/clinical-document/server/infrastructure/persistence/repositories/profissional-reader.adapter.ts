import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IProfissionalReader,
  ProfissionalDocumentoResumo,
} from '../../../../domain/services/profissional-reader.interface';
import type { ProfissionalDocumentoModel } from '../models/documento.model';

export type ProfissionalReaderAdapterDependencies = {
  supabase: SupabaseClient;
};

/** Leitura do profissional que assina o documento (nome, conselho, especialidade). */
export class ProfissionalReaderAdapter implements IProfissionalReader {
  private readonly supabase: SupabaseClient;

  constructor(dependencies: ProfissionalReaderAdapterDependencies) {
    this.supabase = dependencies.supabase;
  }

  async findById(profissionalId: string): Promise<ProfissionalDocumentoResumo | null> {
    const { data } = await this.supabase
      .from('profissionais')
      .select('id, rede_id, nome, especialidade, conselho_classe, numero_conselho, uf_conselho')
      .eq('id', profissionalId)
      .is('deleted_at', null)
      .maybeSingle<ProfissionalDocumentoModel>();

    if (!data) return null;

    return {
      id: data.id,
      redeId: data.rede_id,
      nome: data.nome,
      especialidade: data.especialidade,
      conselhoClasse: data.conselho_classe,
      numeroConselho: data.numero_conselho,
      ufConselho: data.uf_conselho,
    };
  }
}
