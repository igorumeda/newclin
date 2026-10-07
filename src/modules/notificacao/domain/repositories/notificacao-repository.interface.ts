import type { Notificacao, StatusNotificacao } from '../entities/notificacao.entity';
import type { CanalNotificacaoValue } from '../value-objects/canal-notificacao.vo';
import type { TipoNotificacaoValue } from '../value-objects/tipo-notificacao.vo';

export type BuscarNotificacaoParams = { redeId: string; id: string };
export type ListarNotificacoesParams = {
  redeId: string;
  canal?: CanalNotificacaoValue | null;
  status?: StatusNotificacao | null;
  limite?: number;
};
export type ListarPendentesParams = { limite: number; referencia: Date };
export type ExisteNotificacaoParams = {
  agendamentoId: string;
  canal: CanalNotificacaoValue;
  tipo: TipoNotificacaoValue;
};

export interface INotificacaoRepository {
  buscarPorId(params: BuscarNotificacaoParams): Promise<Notificacao | null>;
  listar(params: ListarNotificacoesParams): Promise<Notificacao[]>;
  listarPendentes(params: ListarPendentesParams): Promise<Notificacao[]>;
  existe(params: ExisteNotificacaoParams): Promise<boolean>;
  salvar(notificacao: Notificacao): Promise<void>;
  atualizar(notificacao: Notificacao): Promise<void>;
}

export const NOTIFICACAO_REPOSITORY = Symbol('INotificacaoRepository');
