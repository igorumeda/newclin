import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Notificacao } from '../../../../domain/entities/notificacao.entity';
import type { StatusNotificacao } from '../../../../domain/entities/notificacao.entity';
import { CanalNotificacao } from '../../../../domain/value-objects/canal-notificacao.vo';
import type { CanalNotificacaoValue } from '../../../../domain/value-objects/canal-notificacao.vo';
import { TipoNotificacao } from '../../../../domain/value-objects/tipo-notificacao.vo';
import type { TipoNotificacaoValue } from '../../../../domain/value-objects/tipo-notificacao.vo';
import type { NotificacaoModel, NotificacaoModelData } from '../models/notificacao.model';

export type NotificacaoToDomainParams = ToDomainParams<NotificacaoModel>;
export type NotificacaoToPersistenceParams = ToPersistenceParams<Notificacao>;

export class NotificacaoPersistenceMapper extends PersistenceMapper<
  Notificacao,
  NotificacaoModel,
  NotificacaoModelData
> {
  toDomain({ record }: NotificacaoToDomainParams): Notificacao {
    return Notificacao.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        canal: CanalNotificacao.reconstitute(record.canal as CanalNotificacaoValue),
        tipo: TipoNotificacao.reconstitute(record.tipo as TipoNotificacaoValue),
        destinatario: record.destinatario,
        assunto: record.assunto,
        conteudo: record.conteudo,
        variaveis: record.variaveis ?? {},
        status: record.status as StatusNotificacao,
        tentativas: record.tentativas,
        erro: record.erro,
        agendadaPara: new Date(record.agendada_para),
        enviadaEm: record.enviada_em ? new Date(record.enviada_em) : null,
        agendamentoId: record.agendamento_id,
        pacienteId: record.paciente_id,
        documentoId: record.documento_id,
        provider: record.provider,
        providerMessageId: record.provider_message_id,
        fallbackDe: record.fallback_de,
      },
    });
  }

  toPersistence({ entity }: NotificacaoToPersistenceParams): NotificacaoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      canal: entity.canal.value,
      tipo: entity.tipo.value,
      destinatario: entity.destinatario,
      assunto: entity.assunto,
      conteudo: entity.conteudo,
      variaveis: JSON.stringify(entity.variaveis),
      status: entity.status,
      tentativas: entity.tentativas,
      erro: entity.erro,
      agendada_para: entity.agendadaPara,
      enviada_em: entity.enviadaEm,
      agendamento_id: entity.agendamentoId,
      paciente_id: entity.pacienteId,
      documento_id: entity.documentoId,
      provider: entity.provider,
      provider_message_id: entity.providerMessageId,
      fallback_de: entity.fallbackDe,
    };
  }
}
