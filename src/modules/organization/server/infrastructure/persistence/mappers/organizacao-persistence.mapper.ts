import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Rede, REDE_CONFIG_PADRAO } from '../../../../domain/entities/rede.entity';
import { Unidade } from '../../../../domain/entities/unidade.entity';
import { Endereco } from '../../../../domain/value-objects/endereco.vo';
import { Tema } from '../../../../domain/value-objects/tema.vo';
import type { RedeModel, RedeModelData, UnidadeModel, UnidadeModelData } from '../models/organizacao.models';

export class RedePersistenceMapper extends PersistenceMapper<Rede, RedeModel, RedeModelData> {
  public toDomain({ record }: ToDomainParams<RedeModel>): Rede {
    return Rede.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        nome: record.nome,
        razaoSocial: record.razao_social,
        cnpj: record.cnpj,
        slug: record.slug,
        email: record.email,
        telefone: record.telefone,
        tema: Tema.reconstitute(record.tema),
        logotipoUrl: record.logotipo_url,
        logotipoPath: record.logotipo_path,
        config: {
          agenda: { ...REDE_CONFIG_PADRAO.agenda, ...(record.config?.agenda ?? {}) },
          notificacoes: { ...REDE_CONFIG_PADRAO.notificacoes, ...(record.config?.notificacoes ?? {}) },
          lgpd: { ...REDE_CONFIG_PADRAO.lgpd, ...(record.config?.lgpd ?? {}) },
        },
        ativo: record.ativo,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Rede>): RedeModelData {
    return {
      id: entity.id.toString(),
      nome: entity.nome,
      razao_social: entity.razaoSocial,
      cnpj: entity.cnpj,
      slug: entity.slug,
      email: entity.email,
      telefone: entity.telefone,
      tema: entity.tema.toJSON(),
      logotipo_url: entity.logotipoUrl,
      logotipo_path: entity.logotipoPath,
      config: entity.config,
    };
  }
}

export class UnidadePersistenceMapper extends PersistenceMapper<Unidade, UnidadeModel, UnidadeModelData> {
  public toDomain({ record }: ToDomainParams<UnidadeModel>): Unidade {
    return Unidade.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        nome: record.nome,
        cnes: record.cnes,
        cnpj: record.cnpj,
        telefone: record.telefone,
        email: record.email,
        endereco: Endereco.reconstitute({
          cep: record.cep,
          logradouro: record.logradouro,
          numero: record.numero,
          complemento: record.complemento,
          bairro: record.bairro,
          cidade: record.cidade,
          uf: record.uf,
        }),
        timezone: record.timezone,
        observacoes: record.observacoes,
        ativo: record.ativo,
      },
    });
  }

  public toPersistence({ entity }: ToPersistenceParams<Unidade>): UnidadeModelData {
    const endereco = entity.endereco;
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome,
      cnes: entity.cnes,
      cnpj: entity.cnpj,
      telefone: entity.telefone,
      email: entity.email,
      cep: endereco.cep,
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      complemento: endereco.complemento,
      bairro: endereco.bairro,
      cidade: endereco.cidade,
      uf: endereco.uf,
      timezone: entity.timezone,
      observacoes: entity.observacoes,
      ativo: entity.ativo,
    };
  }
}
