import type { Notificacao } from '../entities/notificacao.entity';
import type { CanalNotificacao, StatusNotificacao, TipoNotificacao } from '../value-objects/tipos.vo';

export type NotificacaoId = string;

export type ListarNotificacoesFiltro = {
  /** Ausente ou vazio = todas as redes (uso interno do worker). */
  redeId?: string | null;
  agendamentoId?: string | null;
  pacienteId?: string | null;
  canal?: CanalNotificacao | null;
  tipo?: TipoNotificacao | null;
  status?: StatusNotificacao | null;
  de?: string | null;
  ate?: string | null;
  page: number;
  perPage: number;
};

export type ListarNotificacoesResultado = {
  items: Notificacao[];
  total: number;
};

export interface INotificacaoRepository {
  findById(id: NotificacaoId): Promise<Notificacao | null>;
  buscar(filtro: ListarNotificacoesFiltro): Promise<ListarNotificacoesResultado>;
  save(notificacao: Notificacao): Promise<void>;
  update(notificacao: Notificacao): Promise<void>;
  /** Localiza a notificação de origem a partir do ID devolvido pelo provedor. */
  buscarPorProviderMessageId(params: {
    canal: CanalNotificacao;
    providerMessageId: string;
  }): Promise<Notificacao | null>;
  /** Reserva atômica do lote da fila (evita envio duplicado entre workers). */
  reservarLote(params: { limite: number }): Promise<Notificacao[]>;
  cancelarPorAgendamento(params: {
    agendamentoId: string;
    motivo: string;
    ignorarTipos?: TipoNotificacao[];
  }): Promise<number>;
}

export const NOTIFICACAO_REPOSITORY = Symbol('INotificacaoRepository');
