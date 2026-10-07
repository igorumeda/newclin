import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Agendamento } from '../../../../domain/entities/agendamento.entity';
import type { OrigemAgendamento } from '../../../../domain/entities/agendamento.entity';
import { Periodo } from '../../../../domain/value-objects/periodo.vo';
import { StatusAgendamento } from '../../../../domain/value-objects/status-agendamento.vo';
import type { StatusAgendamentoValue } from '../../../../domain/value-objects/status-agendamento.vo';
import type { AgendamentoModel, AgendamentoModelData } from '../models/agendamento.model';

export type AgendamentoToDomainParams = ToDomainParams<AgendamentoModel>;
export type AgendamentoToPersistenceParams = ToPersistenceParams<Agendamento>;

export class AgendamentoPersistenceMapper extends PersistenceMapper<
  Agendamento,
  AgendamentoModel,
  AgendamentoModelData
> {
  toDomain({ record }: AgendamentoToDomainParams): Agendamento {
    return Agendamento.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        unidadeId: record.unidade_id,
        profissionalId: record.profissional_id,
        pacienteId: record.paciente_id,
        tipoAtendimentoId: record.tipo_atendimento_id,
        periodo: Periodo.reconstitute({
          inicio: new Date(record.data_hora_inicio),
          fim: new Date(record.data_hora_fim),
        }),
        status: StatusAgendamento.reconstitute(record.status as StatusAgendamentoValue),
        encaixe: record.encaixe,
        observacoes: record.observacoes,
        motivoCancelamento: record.motivo_cancelamento,
        checkinEm: record.checkin_em ? new Date(record.checkin_em) : null,
        ordemChegada: record.ordem_chegada,
        origem: record.origem as OrigemAgendamento,
        criadoPor: record.criado_por,
      },
    });
  }

  toPersistence({ entity }: AgendamentoToPersistenceParams): AgendamentoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      unidade_id: entity.unidadeId,
      profissional_id: entity.profissionalId,
      paciente_id: entity.pacienteId,
      tipo_atendimento_id: entity.tipoAtendimentoId,
      data_hora_inicio: entity.periodo.inicio,
      data_hora_fim: entity.periodo.fim,
      status: entity.status.value,
      encaixe: entity.encaixe,
      observacoes: entity.observacoes,
      motivo_cancelamento: entity.motivoCancelamento,
      checkin_em: entity.checkinEm,
      ordem_chegada: entity.ordemChegada,
      origem: entity.origem,
      criado_por: entity.criadoPor,
    };
  }
}
