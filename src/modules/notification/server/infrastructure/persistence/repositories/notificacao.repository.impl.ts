import type { SupabaseClient } from '@supabase/supabase-js';
import { NotificacaoRepository } from '../../../../domain/repositories/notificacao-repository.base';
import type {
  ListarNotificacoesFiltro,
  ListarNotificacoesResultado,
  NotificacaoId,
} from '../../../../domain/repositories/notificacao-repository.interface';
import type { Notificacao } from '../../../../domain/entities/notificacao.entity';
import type { CanalNotificacao, TipoNotificacao } from '../../../../domain/value-objects/tipos.vo';
import { NotificacaoPersistenceMapper } from '../mappers/notificacao-persistence.mapper';
import { NOTIFICACAO_COLUMNS } from '../models/notificacao.model';
import type { NotificacaoModel } from '../models/notificacao.model';

export type NotificacaoRepositoryDependencies = {
  supabase: SupabaseClient;
  mapper: NotificacaoPersistenceMapper;
};

/**
 * A fila é operada com `service_role` (worker sem sessão de usuário); as
 * consultas de tela usam o client com RLS, conforme o handler recebido.
 */
export class NotificacaoRepositoryImpl extends NotificacaoRepository {
  private readonly supabase: SupabaseClient;
  private readonly mapper: NotificacaoPersistenceMapper;

  constructor(dependencies: NotificacaoRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: NotificacaoId): Promise<Notificacao | null> {
    const { data } = await this.supabase
      .from('notificacoes')
      .select(NOTIFICACAO_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<NotificacaoModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async buscar(filtro: ListarNotificacoesFiltro): Promise<ListarNotificacoesResultado> {
    const from = (filtro.page - 1) * filtro.perPage;

    let query = this.supabase
      .from('notificacoes')
      .select(NOTIFICACAO_COLUMNS, { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, from + filtro.perPage - 1);

    if (filtro.redeId) query = query.eq('rede_id', filtro.redeId);
    if (filtro.agendamentoId) query = query.eq('agendamento_id', filtro.agendamentoId);
    if (filtro.pacienteId) query = query.eq('paciente_id', filtro.pacienteId);
    if (filtro.canal) query = query.eq('canal', filtro.canal);
    if (filtro.tipo) query = query.eq('tipo', filtro.tipo);
    if (filtro.status) query = query.eq('status', filtro.status);
    if (filtro.de) query = query.gte('created_at', filtro.de);
    if (filtro.ate) query = query.lte('created_at', filtro.ate);

    const { data, count } = await query.returns<NotificacaoModel[]>();

    return {
      items: (data ?? []).map((record) => this.mapper.toDomain({ record })),
      total: count ?? 0,
    };
  }

  async save(notificacao: Notificacao): Promise<void> {
    const data = this.mapper.toPersistence({ entity: notificacao });
    const { error } = await this.supabase.from('notificacoes').insert(data);
    if (error) throw new Error(error.message);
  }

  async update(notificacao: Notificacao): Promise<void> {
    const data = this.mapper.toPersistence({ entity: notificacao });
    const { error } = await this.supabase.from('notificacoes').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async buscarPorProviderMessageId(params: {
    canal: CanalNotificacao;
    providerMessageId: string;
  }): Promise<Notificacao | null> {
    const { data } = await this.supabase
      .from('notificacoes')
      .select(NOTIFICACAO_COLUMNS)
      .eq('canal', params.canal)
      .eq('provider_message_id', params.providerMessageId)
      .is('deleted_at', null)
      .maybeSingle<NotificacaoModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  /** `reservar_notificacoes` incrementa tentativas e devolve o lote travado. */
  async reservarLote(params: { limite: number }): Promise<Notificacao[]> {
    const { data, error } = await this.supabase.rpc('reservar_notificacoes', {
      p_limite: params.limite,
    });

    if (error) throw new Error(error.message);
    return ((data ?? []) as NotificacaoModel[]).map((record) => this.mapper.toDomain({ record }));
  }

  async cancelarPorAgendamento(params: {
    agendamentoId: string;
    motivo: string;
    ignorarTipos?: TipoNotificacao[];
  }): Promise<number> {
    let query = this.supabase
      .from('notificacoes')
      .update({
        status: 'cancelado',
        ultimo_erro: params.motivo,
        updated_at: new Date().toISOString(),
      })
      .eq('agendamento_id', params.agendamentoId)
      .eq('status', 'pendente');

    if (params.ignorarTipos && params.ignorarTipos.length > 0) {
      query = query.not('tipo', 'in', `(${params.ignorarTipos.join(',')})`);
    }

    const { data, error } = await query.select('id');
    if (error) throw new Error(error.message);

    return (data ?? []).length;
  }
}
