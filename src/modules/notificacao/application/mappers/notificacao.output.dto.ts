import type { StatusNotificacao } from '../../domain/entities/notificacao.entity';
import type { CanalNotificacaoValue } from '../../domain/value-objects/canal-notificacao.vo';
import type { TipoNotificacaoValue } from '../../domain/value-objects/tipo-notificacao.vo';

export type NotificacaoOutputDto = {
  id: string;
  redeId: string;
  canal: CanalNotificacaoValue;
  canalRotulo: string;
  tipo: TipoNotificacaoValue;
  tipoRotulo: string;
  destinatario: string;
  assunto: string | null;
  conteudo: string;
  status: StatusNotificacao;
  tentativas: number;
  erro: string | null;
  agendadaPara: string;
  enviadaEm: string | null;
  agendamentoId: string | null;
  pacienteId: string | null;
  provider: string | null;
  criadoEm: string;
};
