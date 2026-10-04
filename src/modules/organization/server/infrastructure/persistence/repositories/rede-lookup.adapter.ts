import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IRedeLookup,
  RedeResumo,
} from '../../../../domain/services/rede-lookup.interface';
import { REDE_COLUMNS } from '../models/organizacao.models';
import type { RedeModel } from '../models/organizacao.models';
import { Tema } from '../../../../domain/value-objects/tema.vo';

export type RedeLookupAdapterDependencies = {
  supabase: SupabaseClient;
};

/** ACL de leitura da rede — usada por agenda, prontuário e documentos. */
export class RedeLookupAdapter implements IRedeLookup {
  private readonly supabase: SupabaseClient;

  constructor(dependencies: RedeLookupAdapterDependencies) {
    this.supabase = dependencies.supabase;
  }

  async findById(redeId: string): Promise<RedeResumo | null> {
    const { data } = await this.supabase
      .from('redes')
      .select(REDE_COLUMNS)
      .eq('id', redeId)
      .is('deleted_at', null)
      .maybeSingle<RedeModel>();

    if (!data) return null;

    const tema = data.tema ? Tema.reconstitute(data.tema) : Tema.defaultPreset();

    return {
      id: data.id,
      nome: data.nome,
      razaoSocial: data.razao_social,
      cnpj: data.cnpj,
      telefone: data.telefone,
      email: data.email,
      logotipoUrl: data.logotipo_url,
      tema: {
        preset: tema.preset,
        light: tema.light,
        dark: tema.dark,
      },
    };
  }
}
