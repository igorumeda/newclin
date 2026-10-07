import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { TemplateProntuario } from '../../../../domain/entities/template-prontuario.entity';
import { EstruturaTemplate } from '../../../../domain/value-objects/estrutura-template.vo';
import type { TemplateModel, TemplateModelData } from '../models/template.model';

export type TemplateToDomainParams = ToDomainParams<TemplateModel>;
export type TemplateToPersistenceParams = ToPersistenceParams<TemplateProntuario>;

export class TemplatePersistenceMapper extends PersistenceMapper<
  TemplateProntuario,
  TemplateModel,
  TemplateModelData
> {
  toDomain({ record }: TemplateToDomainParams): TemplateProntuario {
    return TemplateProntuario.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        especialidade: record.especialidade,
        descricao: record.descricao,
        versao: record.versao,
        estrutura: EstruturaTemplate.reconstitute({ secoes: record.estrutura?.secoes ?? [] }),
        padrao: record.padrao,
        ativo: record.ativo,
      },
    });
  }

  toPersistence({ entity }: TemplateToPersistenceParams): TemplateModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      especialidade: entity.especialidade,
      descricao: entity.descricao,
      versao: entity.versao,
      estrutura: JSON.stringify({ secoes: entity.estrutura.secoes }),
      padrao: entity.padrao,
      ativo: entity.ativo,
    };
  }
}
