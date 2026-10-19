import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Notificacao } from '../../../../domain/entities/notificacao.entity';
import { ModeloMensagem } from '../../../../domain/entities/modelo-mensagem.entity';
import { Destinatario } from '../../../../domain/value-objects/destinatario.vo';
import type {
  CanalNotificacao,
  RespostaAcao,
  StatusNotificacao,
  TipoNotificacao,
} from '../../../../domain/value-objects/tipos.vo';
import type {
  ModeloMensagemModel,
  ModeloMensagemModelData,
  NotificacaoModel,
  NotificacaoModelData,
} from '../models/notificacao.model';

export class NotificacaoPersistenceMapper extends PersistenceMapper<
  Notificacao,
  NotificacaoModel,
  NotificacaoModelData
> {
  public toDomain({ record }: ToDomainParams<NotificacaoModel>): Notificacao {
    return Notificacao.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        agendamentoId: record.agendamento_id,
        pacienteId: record.paciente_id,
        atendimentoId: record.atendimento_id,
        documentoId: record.documento_id,
        canal: record.canal as CanalNotificacao,
        tipo: record.tipo as TipoNotificacao,
        destinatario: Destinatario.reconstitute(
          record.canal as CanalNotificacao,
          record.destinatario,
        ),
        remetente: record.remetente,
        assunto: record.assunto,
        conteudo: record.conteudo,
        status: record.status as StatusNotificacao,
        provider: record.provider,
        providerMessageId: record.provider_message_id,
        tentativas: record.tentativas,
        ultimoErro: record.ultimo_erro,
        agendadaPara: new Date(record.agendada_para),
        enviadaEm: record.enviada_em ? new Date(record.enviada_em) : null,
        entregueEm: record.entregue_em ? new Date(record.entregue_em) : null,
        respondidaEm: record.respondida_em ? new Date(record.respondida_em) : null,
        resposta: record.resposta,
        respostaAcao: record.resposta_acao as RespostaAcao | null,
        createdBy: record.created_by,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Notificacao>): NotificacaoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      agendamento_id: entity.agendamentoId,
      paciente_id: entity.pacienteId,
      atendimento_id: entity.atendimentoId,
      documento_id: entity.documentoId,
      canal: entity.canal,
      tipo: entity.tipo,
      destinatario: entity.destinatario.valor,
      remetente: entity.remetente,
      assunto: entity.assunto,
      conteudo: entity.conteudo,
      status: entity.status,
      provider: entity.provider,
      provider_message_id: entity.providerMessageId,
      tentativas: entity.tentativas,
      ultimo_erro: entity.ultimoErro,
      agendada_para: entity.agendadaPara.toISOString(),
      enviada_em: entity.enviadaEm ? entity.enviadaEm.toISOString() : null,
      entregue_em: entity.entregueEm ? entity.entregueEm.toISOString() : null,
      respondida_em: entity.respondidaEm ? entity.respondidaEm.toISOString() : null,
      resposta: entity.resposta,
      resposta_acao: entity.respostaAcao,
      created_by: entity.createdBy,
    };
  }
}

export class ModeloMensagemPersistenceMapper extends PersistenceMapper<
  ModeloMensagem,
  ModeloMensagemModel,
  ModeloMensagemModelData
> {
  public toDomain({ record }: ToDomainParams<ModeloMensagemModel>): ModeloMensagem {
    return ModeloMensagem.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        canal: record.canal as CanalNotificacao,
        tipo: record.tipo as TipoNotificacao,
        assunto: record.assunto,
        corpo: record.corpo,
        ativo: record.ativo,
        isPadrao: record.is_padrao,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<ModeloMensagem>): ModeloMensagemModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      canal: entity.canal,
      tipo: entity.tipo,
      assunto: entity.assunto,
      corpo: entity.corpo,
      ativo: entity.ativo,
      is_padrao: entity.isPadrao,
    };
  }
}
