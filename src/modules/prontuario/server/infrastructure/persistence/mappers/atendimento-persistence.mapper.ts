import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Atendimento } from '../../../../domain/entities/atendimento.entity';
import type {
  FontePagadora,
  StatusAtendimento,
} from '../../../../domain/entities/atendimento.entity';
import type { AtendimentoModel, AtendimentoModelData } from '../models/atendimento.model';

export type AtendimentoToDomainParams = ToDomainParams<AtendimentoModel>;
export type AtendimentoToPersistenceParams = ToPersistenceParams<Atendimento>;

export class AtendimentoPersistenceMapper extends PersistenceMapper<
  Atendimento,
  AtendimentoModel,
  AtendimentoModelData
> {
  toDomain({ record }: AtendimentoToDomainParams): Atendimento {
    return Atendimento.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        unidadeId: record.unidade_id,
        agendamentoId: record.agendamento_id,
        pacienteId: record.paciente_id,
        profissionalId: record.profissional_id,
        templateId: record.template_id,
        templateVersao: record.template_versao,
        dadosPreenchidos: record.dados_preenchidos ?? {},
        camposFixos: {
          queixaPrincipal: record.queixa_principal,
          anamnese: record.anamnese,
          exameFisico: record.exame_fisico,
          hipoteseDiagnostica: record.hipotese_diagnostica,
          cid10: record.cid10,
          conduta: record.conduta,
        },
        fontePagadora: record.fonte_pagadora as FontePagadora,
        status: record.status as StatusAtendimento,
        iniciadoEm: new Date(record.iniciado_em),
        finalizadoEm: record.finalizado_em ? new Date(record.finalizado_em) : null,
      },
    });
  }

  toPersistence({ entity }: AtendimentoToPersistenceParams): AtendimentoModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      unidade_id: entity.unidadeId,
      agendamento_id: entity.agendamentoId,
      paciente_id: entity.pacienteId,
      profissional_id: entity.profissionalId,
      template_id: entity.templateId,
      template_versao: entity.templateVersao,
      dados_preenchidos: JSON.stringify(entity.dadosPreenchidos),
      queixa_principal: entity.camposFixos.queixaPrincipal,
      anamnese: entity.camposFixos.anamnese,
      exame_fisico: entity.camposFixos.exameFisico,
      hipotese_diagnostica: entity.camposFixos.hipoteseDiagnostica,
      cid10: entity.camposFixos.cid10,
      conduta: entity.camposFixos.conduta,
      fonte_pagadora: entity.fontePagadora,
      status: entity.status,
      iniciado_em: entity.iniciadoEm,
      finalizado_em: entity.finalizadoEm,
    };
  }
}
