import type { Notificacao } from '../entities/notificacao.entity';
import type {
  BuscarNotificacaoParams,
  ExisteNotificacaoParams,
  INotificacaoRepository,
  ListarNotificacoesParams,
  ListarPendentesParams,
} from './notificacao-repository.interface';

export abstract class NotificacaoRepository implements INotificacaoRepository {
  abstract buscarPorId(params: BuscarNotificacaoParams): Promise<Notificacao | null>;
  abstract listar(params: ListarNotificacoesParams): Promise<Notificacao[]>;
  abstract listarPendentes(params: ListarPendentesParams): Promise<Notificacao[]>;
  abstract existe(params: ExisteNotificacaoParams): Promise<boolean>;
  abstract salvar(notificacao: Notificacao): Promise<void>;
  abstract atualizar(notificacao: Notificacao): Promise<void>;
}
