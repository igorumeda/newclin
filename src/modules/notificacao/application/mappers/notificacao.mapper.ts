import { Mapper } from '@core/application/mapper.base';
import type { Notificacao } from '../../domain/entities/notificacao.entity';
import type { NotificacaoOutputDto } from './notificacao.output.dto';

export type NotificacaoMapperParams = { notificacao: Notificacao };

export class NotificacaoMapper extends Mapper<NotificacaoMapperParams, NotificacaoOutputDto> {
  public map({ notificacao }: NotificacaoMapperParams): NotificacaoOutputDto {
    return {
      id: notificacao.id.toString(),
      redeId: notificacao.redeId,
      canal: notificacao.canal.value,
      canalRotulo: notificacao.canal.rotulo,
      tipo: notificacao.tipo.value,
      tipoRotulo: notificacao.tipo.rotulo,
      destinatario: notificacao.destinatario,
      assunto: notificacao.assunto,
      conteudo: notificacao.conteudo,
      status: notificacao.status,
      tentativas: notificacao.tentativas,
      erro: notificacao.erro,
      agendadaPara: notificacao.agendadaPara.toISOString(),
      enviadaEm: notificacao.enviadaEm?.toISOString() ?? null,
      agendamentoId: notificacao.agendamentoId,
      pacienteId: notificacao.pacienteId,
      provider: notificacao.provider,
      criadoEm: notificacao.createdAt.toISOString(),
    };
  }
}
