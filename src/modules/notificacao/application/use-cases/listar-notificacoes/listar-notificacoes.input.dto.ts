import type { StatusNotificacao } from '../../../domain/entities/notificacao.entity';
import type { CanalNotificacaoValue } from '../../../domain/value-objects/canal-notificacao.vo';

export type ListarNotificacoesInputDto = {
  redeId: string;
  canal?: CanalNotificacaoValue | null;
  status?: StatusNotificacao | null;
  limite?: number;
};
