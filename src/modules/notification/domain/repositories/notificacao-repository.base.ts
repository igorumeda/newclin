import type { Notificacao } from '../entities/notificacao.entity';
import type {
  INotificacaoRepository,
  ListarNotificacoesFiltro,
  ListarNotificacoesResultado,
  NotificacaoId,
} from './notificacao-repository.interface';
import type { CanalNotificacao, TipoNotificacao } from '../value-objects/tipos.vo';

export abstract class NotificacaoRepository implements INotificacaoRepository {
  abstract findById(id: NotificacaoId): Promise<Notificacao | null>;
  abstract buscar(filtro: ListarNotificacoesFiltro): Promise<ListarNotificacoesResultado>;
  abstract save(notificacao: Notificacao): Promise<void>;
  abstract update(notificacao: Notificacao): Promise<void>;
  abstract buscarPorProviderMessageId(params: {
    canal: CanalNotificacao;
    providerMessageId: string;
  }): Promise<Notificacao | null>;
  abstract reservarLote(params: { limite: number }): Promise<Notificacao[]>;
  abstract cancelarPorAgendamento(params: {
    agendamentoId: string;
    motivo: string;
    ignorarTipos?: TipoNotificacao[];
  }): Promise<number>;
}
