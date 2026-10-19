import type { SupabaseClient } from '@supabase/supabase-js';
import { AuditoriaRepository } from '../../../../domain/repositories/auditoria-repository.base';
import type {
  ListarAuditoriaFiltro,
  ListarAuditoriaResultado,
} from '../../../../domain/repositories/auditoria-repository.interface';
import type { Auditoria } from '../../../../domain/entities/auditoria.entity';
import { AuditoriaPersistenceMapper } from '../mappers/auditoria-persistence.mapper';
import { AUDIT_LOG_COLUMNS } from '../models/audit-log.model';
import type { AuditLogModel } from '../models/audit-log.model';

export type AuditoriaRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: AuditoriaPersistenceMapper;
};

export class AuditoriaRepositoryImpl extends AuditoriaRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: AuditoriaPersistenceMapper;

  constructor(dependencies: AuditoriaRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async registrar(auditoria: Auditoria): Promise<void> {
    const data = this.mapper.toPersistence({ entity: auditoria });
    const { error } = await this.supabase.from('audit_logs').insert(data);
    if (error) {
      // A trilha de auditoria nunca deve quebrar a operação de negócio.
      console.warn(JSON.stringify({ level: 'warn', message: `Auditoria não registrada: ${error.message}` }));
    }
  }

  async listar(filtro: ListarAuditoriaFiltro): Promise<ListarAuditoriaResultado> {
    const from = (filtro.page - 1) * filtro.perPage;
    const to = from + filtro.perPage - 1;

    let query = this.supabase
      .from('audit_logs')
      .select(AUDIT_LOG_COLUMNS, { count: 'exact' })
      .eq('rede_id', filtro.redeId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filtro.entidade) query = query.eq('entidade', filtro.entidade);
    if (filtro.acao) query = query.eq('acao', filtro.acao);
    if (filtro.usuarioId) query = query.eq('user_id', filtro.usuarioId);
    if (filtro.registroId) query = query.eq('registro_id', filtro.registroId);
    if (filtro.dataInicio) query = query.gte('created_at', `${filtro.dataInicio}T00:00:00Z`);
    if (filtro.dataFim) query = query.lte('created_at', `${filtro.dataFim}T23:59:59Z`);

    const { data, count } = await query.returns<AuditLogModel[]>();

    return {
      items: (data ?? []).map((record) => this.mapper.toDomain({ record })),
      total: count ?? 0,
    };
  }

  async listarPorRegistro(params: {
    redeId: string;
    entidade: string;
    registroId: string;
  }): Promise<Auditoria[]> {
    const { data } = await this.supabase
      .from('audit_logs')
      .select(AUDIT_LOG_COLUMNS)
      .eq('rede_id', params.redeId)
      .eq('entidade', params.entidade)
      .eq('registro_id', params.registroId)
      .order('created_at', { ascending: false })
      .limit(50)
      .returns<AuditLogModel[]>();

    return (data ?? []).map((record) => this.mapper.toDomain({ record }));
  }
}
