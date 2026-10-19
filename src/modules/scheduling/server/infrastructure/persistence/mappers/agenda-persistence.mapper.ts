import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Agendamento } from '../../../../domain/entities/agendamento.entity';
import { TipoAtendimento } from '../../../../domain/entities/tipo-atendimento.entity';
import { BloqueioAgenda } from '../../../../domain/entities/bloqueio-agenda.entity';
import type { TipoBloqueio } from '../../../../domain/entities/bloqueio-agenda.entity';
import { JanelaHorario } from '../../../../domain/value-objects/janela-horario.vo';
import type { OrigemConfirmacao, StatusAgendamento } from '../../../../domain/value-objects/status-agendamento.vo';
import type {
  AgendamentoModel,
  AgendamentoModelData,
  BloqueioAgendaModel,
  BloqueioAgendaModelData,
  TipoAtendimentoModel,
  TipoAtendimentoModelData,
} from '../models/agenda.models';

export class AgendamentoPersistenceMapper extends PersistenceMapper<
  Agendamento,
  AgendamentoModel,
  AgendamentoModelData
> {
  public toDomain({ record }: ToDomainParams<AgendamentoModel>): Agendamento {
    return Agendamento.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        unidadeId: record.unidade_id,
        profissionalId: record.profissional_id,
        pacienteId: record.paciente_id,
        tipoAtendimentoId: record.tipo_atendimento_id,
        janela: JanelaHorario.reconstitute({
          inicio: new Date(record.data_hora_inicio),
          fim: new Date(record.data_hora_fim),
        }),
        status: record.status as StatusAgendamento,
        encaixe: record.encaixe,
        encaixeJustificativa: record.encaixe_justificativa,
        observacoes: record.observacoes,
        checkInEm: record.check_in_em ? new Date(record.check_in_em) : null,
        iniciadoEm: record.iniciado_em ? new Date(record.iniciado_em) : null,
        finalizadoEm: record.finalizado_em ? new Date(record.finalizado_em) : null,
        canceladoEm: record.cancelado_em ? new Date(record.cancelado_em) : null,
        motivoCancelamento: record.motivo_cancelamento,
        confirmadoEm: record.confirmado_em ? new Date(record.confirmado_em) : null,
        confirmadoPor: record.confirmado_por as OrigemConfirmacao | null,
        criadoPor: record.criado_por,
        ativo: record.ativo,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Agendamento>): AgendamentoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      unidade_id: entity.unidadeId,
      profissional_id: entity.profissionalId,
      paciente_id: entity.pacienteId,
      tipo_atendimento_id: entity.tipoAtendimentoId,
      data_hora_inicio: entity.janela.inicio.toISOString(),
      data_hora_fim: entity.janela.fim.toISOString(),
      status: entity.status,
      encaixe: entity.encaixe,
      encaixe_justificativa: entity.encaixeJustificativa,
      observacoes: entity.observacoes,
      check_in_em: entity.checkInEm ? entity.checkInEm.toISOString() : null,
      iniciado_em: entity.iniciadoEm ? entity.iniciadoEm.toISOString() : null,
      finalizado_em: entity.finalizadoEm ? entity.finalizadoEm.toISOString() : null,
      cancelado_em: entity.canceladoEm ? entity.canceladoEm.toISOString() : null,
      motivo_cancelamento: entity.motivoCancelamento,
      confirmado_em: entity.confirmadoEm ? entity.confirmadoEm.toISOString() : null,
      confirmado_por: entity.confirmadoPor,
      criado_por: entity.criadoPor,
      ativo: entity.ativo,
    };
  }
}

export class TipoAtendimentoPersistenceMapper extends PersistenceMapper<
  TipoAtendimento,
  TipoAtendimentoModel,
  TipoAtendimentoModelData
> {
  public toDomain({ record }: ToDomainParams<TipoAtendimentoModel>): TipoAtendimento {
    return TipoAtendimento.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        descricao: record.descricao,
        duracaoMinutos: record.duracao_minutos,
        cor: record.cor,
        requerConfirmacao: record.requer_confirmacao,
        ativo: record.ativo,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<TipoAtendimento>): TipoAtendimentoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      descricao: entity.descricao,
      duracao_minutos: entity.duracaoMinutos,
      cor: entity.cor,
      requer_confirmacao: entity.requerConfirmacao,
      ativo: entity.ativo,
    };
  }
}

export class BloqueioAgendaPersistenceMapper extends PersistenceMapper<
  BloqueioAgenda,
  BloqueioAgendaModel,
  BloqueioAgendaModelData
> {
  public toDomain({ record }: ToDomainParams<BloqueioAgendaModel>): BloqueioAgenda {
    return BloqueioAgenda.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        profissionalId: record.profissional_id,
        unidadeId: record.unidade_id,
        tipo: record.tipo as TipoBloqueio,
        motivo: record.motivo,
        janela: JanelaHorario.reconstitute({
          inicio: new Date(record.inicio),
          fim: new Date(record.fim),
        }),
        diaInteiro: record.dia_inteiro,
        criadoPor: record.criado_por,
        ativo: record.ativo,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<BloqueioAgenda>): BloqueioAgendaModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      profissional_id: entity.profissionalId,
      unidade_id: entity.unidadeId,
      tipo: entity.tipo,
      motivo: entity.motivo,
      inicio: entity.janela.inicio.toISOString(),
      fim: entity.janela.fim.toISOString(),
      dia_inteiro: entity.diaInteiro,
      criado_por: entity.criadoPor,
      ativo: entity.ativo,
    };
  }
}
