import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Unidade } from '../../../../domain/entities/unidade.entity';
import { Endereco } from '../../../../domain/value-objects/endereco.vo';
import type { EnderecoProps } from '../../../../domain/value-objects/endereco.vo';
import type { UnidadeModel, UnidadeModelData } from '../models/unidade.model';

export type UnidadeToDomainParams = ToDomainParams<UnidadeModel>;
export type UnidadeToPersistenceParams = ToPersistenceParams<Unidade>;

const ENDERECO_VAZIO: EnderecoProps = {
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  cep: '',
};

export class UnidadePersistenceMapper extends PersistenceMapper<
  Unidade,
  UnidadeModel,
  UnidadeModelData
> {
  toDomain({ record }: UnidadeToDomainParams): Unidade {
    return Unidade.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        codigo: record.codigo,
        telefone: record.telefone,
        email: record.email,
        endereco: Endereco.reconstitute({
          ...ENDERECO_VAZIO,
          ...((record.endereco ?? {}) as Partial<EnderecoProps>),
        }),
        fusoHorario: record.fuso_horario,
        ativo: record.ativo,
      },
    });
  }

  toPersistence({ entity }: UnidadeToPersistenceParams): UnidadeModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      codigo: entity.codigo,
      telefone: entity.telefone,
      email: entity.email,
      endereco: JSON.stringify(entity.endereco.valores),
      fuso_horario: entity.fusoHorario,
      ativo: entity.ativo,
    };
  }
}
