import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Profissional } from '../../../../domain/entities/profissional.entity';
import { Especialidade } from '../../../../domain/value-objects/especialidade.vo';
import { RegistroConselho } from '../../../../domain/value-objects/registro-conselho.vo';
import type { ConselhoValue } from '../../../../domain/value-objects/registro-conselho.vo';
import type { ProfissionalModel, ProfissionalModelData } from '../models/profissional.model';

export type ProfissionalToDomainParams = ToDomainParams<ProfissionalModel>;
export type ProfissionalToPersistenceParams = ToPersistenceParams<Profissional>;

export class ProfissionalPersistenceMapper extends PersistenceMapper<
  Profissional,
  ProfissionalModel,
  ProfissionalModelData
> {
  toDomain({ record }: ProfissionalToDomainParams): Profissional {
    return Profissional.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        cpf: record.cpf,
        email: record.email,
        telefone: record.telefone,
        registro: RegistroConselho.reconstitute({
          conselho: record.conselho_classe as ConselhoValue,
          numero: record.numero_conselho,
          uf: record.uf_conselho,
        }),
        especialidade: Especialidade.reconstitute(record.especialidade),
        corAgenda: record.cor_agenda,
        unidades: record.unidades ?? [],
        ativo: record.ativo,
      },
    });
  }

  toPersistence({ entity }: ProfissionalToPersistenceParams): ProfissionalModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      cpf: entity.cpf,
      email: entity.email,
      telefone: entity.telefone,
      conselho_classe: entity.registro.conselho,
      numero_conselho: entity.registro.numero,
      uf_conselho: entity.registro.uf,
      especialidade: entity.especialidade.value,
      cor_agenda: entity.corAgenda,
      ativo: entity.ativo,
    };
  }
}
