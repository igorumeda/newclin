import type { CanalNotificacaoValue } from '../../../domain/value-objects/canal-notificacao.vo';
import type { TipoNotificacaoValue } from '../../../domain/value-objects/tipo-notificacao.vo';

export type AgendarNotificacaoInputDto = {
  redeId: string;
  agendamentoId: string;
  tipo: TipoNotificacaoValue;
  canais?: CanalNotificacaoValue[];
  agendadaPara?: string | null;
  motivo?: string | null;
  evitarDuplicidade?: boolean;
};
