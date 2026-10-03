import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Profissional } from '../../../../domain/entities/profissional.entity';
import { HorarioAtendimento } from '../../../../domain/entities/horario-atendimento.entity';
import { RegistroConselho } from '../../../../domain/value-objects/registro-conselho.vo';
import type { ConselhoClasse } from '../../../../domain/value-objects/registro-conselho.vo';
import type {
  HorarioAtendimentoModel,
  HorarioAtendimentoModelData,
  ProfissionalModel,
  ProfissionalModelData,
} from '../models/profissional.models';

export class ProfissionalPersistenceMapper extends PersistenceMapper<
  Profissional,
  ProfissionalModel,
  ProfissionalModelData
> {
  public toDomain({ record }: ToDomainParams<ProfissionalModel>): Profissional {
    return Profissional.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        registro: RegistroConselho.reconstitute({
          conselhoClasse: record.conselho_classe as ConselhoClasse,
          numero: record.numero_conselho,
          uf: record.uf_conselho,
        }),
        cpf: record.cpf,
        especialidade: record.especialidade,
        registroEspecialista: record.registro_especialista,
        telefone: record.telefone,
        email: record.email,
        corAgenda: record.cor_agenda,
        observacoes: record.observacoes,
        ativo: record.ativo,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Profissional>): ProfissionalModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      cpf: entity.cpf,
      conselho_classe: entity.registro.conselhoClasse,
      numero_conselho: entity.registro.numero,
      uf_conselho: entity.registro.uf,
      especialidade: entity.especialidade,
      registro_especialista: entity.registroEspecialista,
      telefone: entity.telefone,
      email: entity.email,
      cor_agenda: entity.corAgenda,
      observacoes: entity.observacoes,
      ativo: entity.ativo,
    };
  }
}

export class HorarioAtendimentoPersistenceMapper extends PersistenceMapper<
  HorarioAtendimento,
  HorarioAtendimentoModel,
  HorarioAtendimentoModelData
> {
  public toDomain({ record }: ToDomainParams<HorarioAtendimentoModel>): HorarioAtendimento {
    return HorarioAtendimento.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        profissionalId: record.profissional_id,
        unidadeId: record.unidade_id,
        diaSemana: record.dia_semana,
        horaInicio: record.hora_inicio.slice(0, 5),
        horaFim: record.hora_fim.slice(0, 5),
        duracaoSlotMinutos: record.duracao_slot_minutos,
        intervaloMinutos: record.intervalo_minutos,
        ativo: record.ativo,
      },
    });
  }

  public toPersistence({
    entity,
  }: ToPersistenceParams<HorarioAtendimento>): HorarioAtendimentoModelData {
    return {
      rede_id: entity.redeId,
      profissional_id: entity.profissionalId,
      unidade_id: entity.unidadeId,
      dia_semana: entity.diaSemana,
      hora_inicio: entity.horaInicio,
      hora_fim: entity.horaFim,
      duracao_slot_minutos: entity.duracaoSlotMinutos,
      intervalo_minutos: entity.intervaloMinutos,
      ativo: entity.ativo,
    };
  }
}
