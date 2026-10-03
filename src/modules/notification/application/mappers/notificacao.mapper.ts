import { Mapper } from '@core/application/mapper.base';
import type { Notificacao } from '../../domain/entities/notificacao.entity';
import type { ModeloMensagem } from '../../domain/entities/modelo-mensagem.entity';
import {
  CANAL_LABELS,
  STATUS_LABELS,
  TIPO_LABELS,
} from '../../domain/value-objects/notificacao.vo';
import type { ModeloMensagemDto, NotificacaoDto } from '../dtos/notificacao.dto';

export type MapNotificacaoParams = { notificacao: Notificacao };

export class NotificacaoMapper extends Mapper<MapNotificacaoParams, NotificacaoDto> {
  public map({ notificacao }: MapNotificacaoParams): NotificacaoDto {
    return {
      id: notificacao.id.toString(),
      redeId: notificacao.redeId,
      agendamentoId: notificacao.agendamentoId,
      pacienteId: notificacao.pacienteId,
      atendimentoId: notificacao.atendimentoId,
      documentoId: notificacao.documentoId,
      canal: notificacao.canal,
      canalLabel: CANAL_LABELS[notificacao.canal],
      tipo: notificacao.tipo,
      tipoLabel: TIPO_LABELS[notificacao.tipo],
      destinatario: notificacao.destinatario.valor,
      remetente: notificacao.remetente,
      assunto: notificacao.assunto,
      conteudo: notificacao.conteudo,
      status: notificacao.status,
      statusLabel: STATUS_LABELS[notificacao.status],
      provider: notificacao.provider,
      providerMessageId: notificacao.providerMessageId,
      tentativas: notificacao.tentativas,
      ultimoErro: notificacao.ultimoErro,
      agendadaPara: notificacao.agendadaPara.toISOString(),
      enviadaEm: notificacao.enviadaEm ? notificacao.enviadaEm.toISOString() : null,
      entregueEm: notificacao.entregueEm ? notificacao.entregueEm.toISOString() : null,
      respondidaEm: notificacao.respondidaEm ? notificacao.respondidaEm.toISOString() : null,
      resposta: notificacao.resposta,
      respostaAcao: notificacao.respostaAcao,
      createdAt: notificacao.createdAt.toISOString(),
    };
  }
}

export type MapModeloMensagemParams = { modelo: ModeloMensagem };

export class ModeloMensagemMapper extends Mapper<MapModeloMensagemParams, ModeloMensagemDto> {
  public map({ modelo }: MapModeloMensagemParams): ModeloMensagemDto {
    return {
      id: modelo.id.toString(),
      redeId: modelo.redeId,
      canal: modelo.canal,
      canalLabel: CANAL_LABELS[modelo.canal],
      tipo: modelo.tipo,
      tipoLabel: TIPO_LABELS[modelo.tipo],
      assunto: modelo.assunto,
      corpo: modelo.corpo,
      ativo: modelo.ativo,
      isPadrao: modelo.isPadrao,
      variaveis: modelo.variaveis(),
      createdAt: modelo.createdAt.toISOString(),
      updatedAt: modelo.updatedAt.toISOString(),
    };
  }
}
