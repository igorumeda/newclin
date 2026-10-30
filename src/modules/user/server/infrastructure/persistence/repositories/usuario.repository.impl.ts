import type { SupabaseClient } from '@supabase/supabase-js';
import { UsuarioRepository } from '../../../../domain/repositories/usuario-repository.base';
import type {
  ListarUsuariosFiltro,
  ListarUsuariosResultado,
  UsuarioId,
} from '../../../../domain/repositories/usuario-repository.interface';
import type { Usuario } from '../../../../domain/entities/usuario.entity';
import type { Email } from '../../../../domain/value-objects/email.vo';
import { UsuarioPersistenceMapper } from '../mappers/usuario-persistence.mapper';
import { PROFILE_COLUMNS } from '../models/profile.model';
import type { ProfileModel } from '../models/profile.model';

export type UsuarioRepositoryDependencies = {
  supabase: SupabaseClient;
  serviceClient?: SupabaseClient;
  mapper: UsuarioPersistenceMapper;
};

export class UsuarioRepositoryImpl extends UsuarioRepository {
  private readonly supabase: SupabaseClient;
  private readonly serviceClient: SupabaseClient;
  private readonly mapper: UsuarioPersistenceMapper;

  constructor(dependencies: UsuarioRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.serviceClient = dependencies.serviceClient ?? dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: UsuarioId): Promise<Usuario | null> {
    const { data } = await this.supabase
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<ProfileModel>();

    if (data) return this.mapper.toDomain({ record: data });

    const { data: serviceData } = await this.serviceClient
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<ProfileModel>();

    return serviceData ? this.mapper.toDomain({ record: serviceData }) : null;
  }

  async findByEmail(email: Email): Promise<Usuario | null> {
    const { data } = await this.serviceClient
      .from('profiles')
      .select(PROFILE_COLUMNS)
      .eq('email', email.value)
      .is('deleted_at', null)
      .maybeSingle<ProfileModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async listar(filtro: ListarUsuariosFiltro): Promise<ListarUsuariosResultado> {
    const from = (filtro.page - 1) * filtro.perPage;
    const to = from + filtro.perPage - 1;
    const client = filtro.redeId === null ? this.serviceClient : this.supabase;

    let query = client
      .from('profiles')
      .select(PROFILE_COLUMNS, { count: 'exact' })
      .is('deleted_at', null);

    if (filtro.redeId === null) {
      query = query.is('rede_id', null);
    } else {
      query = query.eq('rede_id', filtro.redeId);
    }

    query = query.order('nome', { ascending: true }).range(from, to);

    if (filtro.busca) {
      query = query.or(`nome.ilike.%${filtro.busca}%,email.ilike.%${filtro.busca}%`);
    }
    if (filtro.role && filtro.redeId !== null) {
      query = query.eq('role', filtro.role);
    }
    if (filtro.ativo !== null && filtro.ativo !== undefined) {
      query = query.eq('ativo', filtro.ativo);
    }

    const { data, count } = await query.returns<ProfileModel[]>();

    return {
      items: (data ?? []).map((record) => this.mapper.toDomain({ record })),
      total: count ?? 0,
    };
  }

  async save(usuario: Usuario): Promise<void> {
    const data = this.mapper.toPersistence({ entity: usuario });
    const client = usuario.isMaster ? this.serviceClient : this.supabase;
    const { error } = await client
      .from('profiles')
      .upsert(data, { onConflict: 'auth_user_id' });
    if (error) throw new Error(error.message);
  }

  async update(usuario: Usuario): Promise<void> {
    const data = this.mapper.toPersistence({ entity: usuario });
    const client = usuario.isMaster ? this.serviceClient : this.supabase;
    const { error } = await client.from('profiles').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async existsByEmail(email: Email, ignorarId?: UsuarioId): Promise<boolean> {
    let query = this.serviceClient
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('email', email.value)
      .is('deleted_at', null);

    if (ignorarId) {
      query = query.neq('id', ignorarId);
    }

    const { count } = await query;
    return (count ?? 0) > 0;
  }
}
