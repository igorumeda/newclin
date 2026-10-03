import { PersistenceMapper } from '@core/application/persistence-mapper.base';
import type { ToDomainParams, ToPersistenceParams } from '@core/application/persistence-mapper.base';
import { Identifier } from '@core/domain/identifier';
import { Usuario } from '../../../../domain/entities/usuario.entity';
import { Email } from '../../../../domain/value-objects/email.vo';
import { UserName } from '../../../../domain/value-objects/user-name.vo';
import { Role } from '../../../../domain/value-objects/role.vo';
import type { AppRole } from '../../../../domain/value-objects/role.vo';
import type { ProfileModel, ProfileModelData } from '../models/profile.model';

export type UsuarioToDomainParams = ToDomainParams<ProfileModel>;
export type UsuarioToPersistenceParams = ToPersistenceParams<Usuario>;

export class UsuarioPersistenceMapper extends PersistenceMapper<Usuario, ProfileModel, ProfileModelData> {
  public toDomain({ record }: UsuarioToDomainParams): Usuario {
    return Usuario.reconstitute({
      id: Identifier.fromExisting(record.id),
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
      props: {
        redeId: record.rede_id,
        nome: UserName.reconstitute(record.nome),
        email: Email.reconstitute(record.email),
        role: Role.reconstitute(record.role as AppRole),
        telefone: record.telefone,
        unidadesAcesso: record.unidades_acesso ?? [],
        profissionalId: record.profissional_id,
        ativo: record.ativo,
        ultimoAcessoEm: record.ultimo_acesso_em ? new Date(record.ultimo_acesso_em) : null,
        authUserId: record.auth_user_id,
      },
    });
  }

  public toPersistence({ entity: usuario }: UsuarioToPersistenceParams): ProfileModelData {
    return {
      id: usuario.id.toString(),
      auth_user_id: usuario.authUserId,
      rede_id: usuario.redeId,
      nome: usuario.nome.value,
      email: usuario.email.value,
      role: usuario.role.value,
      telefone: usuario.telefone,
      unidades_acesso: usuario.unidadesAcesso,
      profissional_id: usuario.profissionalId,
      ativo: usuario.ativo,
      ultimo_acesso_em: usuario.ultimoAcessoEm ? usuario.ultimoAcessoEm.toISOString() : null,
    };
  }
}
