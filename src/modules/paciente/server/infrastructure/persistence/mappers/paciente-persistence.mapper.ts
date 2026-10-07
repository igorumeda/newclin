import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import {
  ENDERECO_PACIENTE_VAZIO,
  Paciente,
} from '../../../../domain/entities/paciente.entity';
import type { EnderecoPaciente } from '../../../../domain/entities/paciente.entity';
import { Cpf } from '../../../../domain/value-objects/cpf.vo';
import { DataNascimento } from '../../../../domain/value-objects/data-nascimento.vo';
import { Sexo } from '../../../../domain/value-objects/sexo.vo';
import type { SexoValue } from '../../../../domain/value-objects/sexo.vo';
import { Telefone } from '../../../../domain/value-objects/telefone.vo';
import type { PacienteModel, PacienteModelData } from '../models/paciente.model';

export type PacienteToDomainParams = ToDomainParams<PacienteModel>;
export type PacienteToPersistenceParams = ToPersistenceParams<Paciente>;

export class PacientePersistenceMapper extends PersistenceMapper<
  Paciente,
  PacienteModel,
  PacienteModelData
> {
  toDomain({ record }: PacienteToDomainParams): Paciente {
    const nascimento =
      record.data_nascimento instanceof Date
        ? record.data_nascimento
        : new Date(`${String(record.data_nascimento).slice(0, 10)}T00:00:00.000Z`);

    return Paciente.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        cpf: Cpf.reconstitute(record.cpf),
        dataNascimento: DataNascimento.reconstitute(nascimento),
        sexo: Sexo.reconstitute(record.sexo as SexoValue),
        telefone: record.telefone ? Telefone.reconstitute(record.telefone) : null,
        email: record.email,
        endereco: {
          ...ENDERECO_PACIENTE_VAZIO,
          ...((record.endereco ?? {}) as Partial<EnderecoPaciente>),
        },
        responsavelNome: record.responsavel_nome,
        responsavelTelefone: record.responsavel_telefone
          ? Telefone.reconstitute(record.responsavel_telefone)
          : null,
        alergias: record.alergias ?? [],
        condicoesCronicas: record.condicoes_cronicas ?? [],
        observacoes: record.observacoes,
        consentimentoLgpd: record.consentimento_lgpd,
        consentimentoEm: record.consentimento_em,
        ativo: record.ativo,
      },
    });
  }

  toPersistence({ entity }: PacienteToPersistenceParams): PacienteModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      cpf: entity.cpf.value,
      data_nascimento: entity.dataNascimento.iso,
      sexo: entity.sexo.value,
      telefone: entity.telefone?.value ?? null,
      email: entity.email,
      endereco: JSON.stringify(entity.endereco),
      responsavel_nome: entity.responsavelNome,
      responsavel_telefone: entity.responsavelTelefone?.value ?? null,
      alergias: entity.alergias,
      condicoes_cronicas: entity.condicoesCronicas,
      observacoes: entity.observacoes,
      consentimento_lgpd: entity.consentimentoLgpd,
      consentimento_em: entity.consentimentoEm,
      ativo: entity.ativo,
    };
  }
}
