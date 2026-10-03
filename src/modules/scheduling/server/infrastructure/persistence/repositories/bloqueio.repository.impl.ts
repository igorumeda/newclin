import type { SupabaseClient } from '@supabase/supabase-js';
import { BloqueioAgendaRepository } from '../../../../domain/repositories/bloqueio-repository.base';
import type { ListarBloqueiosFiltro } from '../../../../domain/repositories/bloqueio-repository.interface';
import type { BloqueioAgenda } from '../../../../domain/entities/bloqueio-agenda.entity';
import { BloqueioAgendaPersistenceMapper } from '../mappers/agenda-persistence.mapper';
import { BLOQUEIO_COLUMNS } from '../models/agenda.models';
import type { BloqueioAgendaModel } from '../models/agenda.models';

export type BloqueioAgendaRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: BloqueioAgendaPersistenceMapper;
};

export class BloqueioAgendaRepositoryImpl extends BloqueioAgendaRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: BloqueioAgendaPersistenceMapper;

  constructor(dependencies: BloqueioAgendaRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: string): Promise<BloqueioAgenda | null> {
    const { data } = await this.supabase
      .from('bloqueios_agenda')
      .select(BLOQUEIO_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<BloqueioAgendaModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarBloqueiosFiltro): Promise<BloqueioAgenda[]> {
    let query = this.supabase
      .from('bloqueios_agenda')
      .select(BLOQUEIO_COLUMNS)
      .eq('rede_id', filtro.redeId)
      .is('deleted_at', null)
      .lt('inicio', filtro.ate)
      .gt('fim', filtro.de)
      .order('inicio');

    if (filtro.unidadeId) query = query.eq('unidade_id', filtro.unidadeId);
    if (filtro.profissionalId) query = query.eq('profissional_id', filtro.profissionalId);
    if (filtro.somenteAtivos) query = query.eq('ativo', true);

    const { data } = await query.returns<BloqueioAgendaModel[]>();
    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async save(bloqueio: BloqueioAgenda): Promise<void> {
    const data = this.mapper.toPersistence({ entity: bloqueio });
    const { error } = await this.supabase.from('bloqueios_agenda').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(bloqueio: BloqueioAgenda): Promise<void> {
    const data = this.mapper.toPersistence({ entity: bloqueio });
    const { error } = await this.supabase.from('bloqueios_agenda').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }
}
