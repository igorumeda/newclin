import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Usuario } from '../../../../domain/entities/usuario.entity';
import { Email } from '../../../../domain/value-objects/email.vo';
import { NomePessoa } from '../../../../domain/value-objects/nome-pessoa.vo';
import { Papel } from '../../../../domain/value-objects/papel.vo';
import type { PapelValue } from '../../../../domain/value-objects/papel.vo';
import type { UsuarioModel, UsuarioModelData } from '../models/usuario.model';

export type UsuarioToDomainParams = ToDomainParams<UsuarioModel>;
export type UsuarioToPersistenceParams = ToPersistenceParams<Usuario>;

export class UsuarioPersistenceMapper extends PersistenceMapper<
  Usuario,
  UsuarioModel,
  UsuarioModelData
> {
  toDomain({ record }: UsuarioToDomainParams): Usuario {
    return Usuario.reconstitute({
      id: Identifier.fromExisting(record.id),
      timestamps: { createdAt: record.created_at, updatedAt: record.updated_at },
      props: {
        redeId: record.rede_id,
        nome: NomePessoa.reconstitute(record.nome),
        email: Email.reconstitute(record.email),
        senhaHash: record.senha_hash,
        papel: Papel.reconstitute(record.role as PapelValue),
        unidadesAcesso: record.unidades_acesso ?? [],
        profissionalId: record.profissional_id,
        telefone: record.telefone,
        avatarUrl: record.avatar_url,
        ativo: record.ativo,
        ultimoAcessoEm: record.ultimo_acesso_em,
      },
    });
  }

  toPersistence({ entity }: UsuarioToPersistenceParams): UsuarioModelData {
    return {
      id: entity.id.toString(),
      rede_id: entity.redeId,
      nome: entity.nome.value,
      email: entity.email.value,
      senha_hash: entity.senhaHash,
      role: entity.papel.value,
      profissional_id: entity.profissionalId,
      telefone: entity.telefone,
      avatar_url: entity.avatarUrl,
      ativo: entity.ativo,
      ultimo_acesso_em: entity.ultimoAcessoEm,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
    };
  }
}
