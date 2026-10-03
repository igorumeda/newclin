import type { SupabaseClient } from '@supabase/supabase-js';
import { PacienteRepository } from '../../../../domain/repositories/paciente-repository.base';
import type {
  BuscarPacientesFiltro,
  BuscarPacientesResultado,
  PacienteId,
  VerificarDuplicidadeParams,
} from '../../../../domain/repositories/paciente-repository.interface';
import type { Paciente } from '../../../../domain/entities/paciente.entity';
import type { PacienteDuplicadoDetalhe } from '../../../../domain/errors/paciente.errors';
import { PacientePersistenceMapper } from '../mappers/paciente-persistence.mapper';
import { PACIENTE_COLUMNS } from '../models/paciente.model';
import type { PacienteBuscaModel, PacienteDuplicadoModel, PacienteModel } from '../models/paciente.model';

export type PacienteRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: PacientePersistenceMapper;
};

export class PacienteRepositoryImpl extends PacienteRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: PacientePersistenceMapper;

  constructor(dependencies: PacienteRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: PacienteId): Promise<Paciente | null> {
    const { data } = await this.supabase
      .from('pacientes')
      .select(PACIENTE_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<PacienteModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  /** Busca executada no banco (`buscar_pacientes`): nome parcial ou CPF exato. */
  async buscar(filtro: BuscarPacientesFiltro): Promise<BuscarPacientesResultado> {
    const { data, error } = await this.supabase.rpc('buscar_pacientes', {
      p_termo: filtro.termo ?? null,
      p_unidade_id: filtro.unidadeId ?? null,
      p_somente_ativos: filtro.somenteAtivos ?? true,
      p_limit: filtro.perPage,
      p_offset: (filtro.page - 1) * filtro.perPage,
    });

    if (error) throw new Error(error.message);

    const linhas = (data ?? []) as (PacienteBuscaModel & { id: string; total_count: number })[];
    if (linhas.length === 0) return { items: [], total: 0 };

    const ids = linhas.map((linha) => linha.id);
    const pacientes = await this.buscarPorIds(ids);

    // Preserva a ordenação alfabética devolvida pelo banco.
    const porId = new Map(pacientes.map((paciente) => [paciente.id.toString(), paciente]));
    const items = ids
      .map((id) => porId.get(id))
      .filter((paciente): paciente is Paciente => Boolean(paciente));

    return { items, total: Number(linhas[0]?.total_count ?? 0) };
  }

  async buscarPorIds(ids: PacienteId[]): Promise<Paciente[]> {
    if (ids.length === 0) return [];

    const { data } = await this.supabase
      .from('pacientes')
      .select(PACIENTE_COLUMNS)
      .in('id', ids)
      .is('deleted_at', null)
      .returns<PacienteModel[]>();

    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }

  async save(paciente: Paciente): Promise<void> {
    const data = this.mapper.toPersistence({ entity: paciente });
    const { error } = await this.supabase.from('pacientes').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(paciente: Paciente): Promise<void> {
    const data = this.mapper.toPersistence({ entity: paciente });
    const { error } = await this.supabase.from('pacientes').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async existePorCpf(params: {
    redeId: string;
    cpf: string;
    ignorarId?: string | null;
  }): Promise<boolean> {
    let query = this.supabase
      .from('pacientes')
      .select('id', { count: 'exact', head: true })
      .eq('rede_id', params.redeId)
      .eq('cpf', params.cpf)
      .is('deleted_at', null);

    if (params.ignorarId) query = query.neq('id', params.ignorarId);

    const { count } = await query;
    return (count ?? 0) > 0;
  }

  async verificarDuplicidade(params: VerificarDuplicidadeParams): Promise<PacienteDuplicadoDetalhe[]> {
    const { data, error } = await this.supabase.rpc('verificar_paciente_duplicado', {
      p_rede_id: params.redeId,
      p_cpf: params.cpf,
      p_nome: params.nome,
      p_data_nascimento: params.dataNascimento || null,
      p_ignorar_id: params.ignorarId ?? null,
    });

    if (error) throw new Error(error.message);

    return ((data ?? []) as PacienteDuplicadoModel[]).map((linha) => ({
      id: linha.id,
      nome: linha.nome,
      cpf: linha.cpf,
      dataNascimento: String(linha.data_nascimento).slice(0, 10),
      ativo: linha.ativo,
      motivo: linha.motivo === 'cpf' ? 'cpf' : 'nome_data_nascimento',
    }));
  }

  async exportarDados(pacienteId: PacienteId): Promise<Record<string, unknown> | null> {
    const { data, error } = await this.supabase.rpc('exportar_dados_paciente', {
      p_paciente_id: pacienteId,
    });

    if (error) throw new Error(error.message);

    return (data as Record<string, unknown> | null) ?? null;
  }
}
