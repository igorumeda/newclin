import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Email } from '../value-objects/email.vo';
import { UserName } from '../value-objects/user-name.vo';
import { Role } from '../value-objects/role.vo';
import type { AppRole, Permission } from '../value-objects/role.vo';
import { InvalidUserOperationError } from '../errors/user-conflict.error';
import { UsuarioCriadoEvent } from '../events/usuario-criado.event';

export type UsuarioProps = {
  redeId: string;
  nome: UserName;
  email: Email;
  role: Role;
  telefone: string | null;
  unidadesAcesso: string[];
  profissionalId: string | null;
  ativo: boolean;
  ultimoAcessoEm: Date | null;
  /** Identidade de autenticação (Supabase Auth) vinculada após o provisionamento. */
  authUserId: string | null;
};

export type UsuarioConstructorParams = EntityConstructorParams<UsuarioProps>;

export type CreateUsuarioParams = {
  redeId: string;
  nome: string;
  email: string;
  role: AppRole;
  telefone?: string | null;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
};

export type ReconstituteUsuarioParams = UsuarioConstructorParams & {
  id: NonNullable<UsuarioConstructorParams['id']>;
};

export type AlterarRoleParams = { role: string };

export type DefinirUnidadesParams = { unidadesAcesso: string[] };

export type AlterarDadosParams = {
  nome?: string;
  telefone?: string | null;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
};

export type VincularCredenciaisParams = { authUserId: string };

export class Usuario extends AggregateRoot<UsuarioProps> {
  private constructor(params: UsuarioConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get nome(): UserName {
    return this.props.nome;
  }

  get email(): Email {
    return this.props.email;
  }

  get role(): Role {
    return this.props.role;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get unidadesAcesso(): string[] {
    return [...this.props.unidadesAcesso];
  }

  get profissionalId(): string | null {
    return this.props.profissionalId;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get ultimoAcessoEm(): Date | null {
    return this.props.ultimoAcessoEm;
  }

  get authUserId(): string | null {
    return this.props.authUserId;
  }

  public can(permission: Permission): boolean {
    return this.props.role.can(permission);
  }

  public static create(params: CreateUsuarioParams): Result<Usuario> {
    const nomeResult = UserName.create(params.nome);
    if (nomeResult.isFailure) return Result.fail(nomeResult.error);

    const emailResult = Email.create(params.email);
    if (emailResult.isFailure) return Result.fail(emailResult.error);

    const roleResult = Role.create(params.role);
    if (roleResult.isFailure) return Result.fail(roleResult.error);

    const role = roleResult.value;

    if (role.isProfessional() && !params.profissionalId) {
      return Result.fail(
        new InvalidUserOperationError({
          reason:
            'Usuário com papel de profissional precisa estar vinculado a um cadastro de profissional',
        }),
      );
    }

    const usuario = new Usuario({
      props: {
        redeId: params.redeId,
        nome: nomeResult.value,
        email: emailResult.value,
        role,
        telefone: params.telefone ?? null,
        unidadesAcesso: params.unidadesAcesso ?? [],
        profissionalId: params.profissionalId ?? null,
        ativo: true,
        ultimoAcessoEm: null,
        authUserId: null,
      },
    });

    usuario.addDomainEvent(
      new UsuarioCriadoEvent({
        usuarioId: usuario.id.toString(),
        email: usuario.email.value,
        role: role.value,
      }),
    );

    return Result.ok(usuario);
  }

  public static reconstitute(params: ReconstituteUsuarioParams): Usuario {
    return new Usuario(params);
  }

  public vincularCredenciais(params: VincularCredenciaisParams): Result<void> {
    if (this.props.authUserId && this.props.authUserId !== params.authUserId) {
      return Result.fail(
        new InvalidUserOperationError({ reason: 'Usuário já possui credenciais vinculadas' }),
      );
    }
    this.props.authUserId = params.authUserId;
    this.touch();
    return Result.ok();
  }

  public alterarRole(params: AlterarRoleParams): Result<void> {
    const roleResult = Role.create(params.role);
    if (roleResult.isFailure) return Result.fail(roleResult.error);

    if (roleResult.value.isProfessional() && !this.props.profissionalId) {
      return Result.fail(
        new InvalidUserOperationError({
          reason: 'Vincule um profissional antes de atribuir o papel de Médico/Profissional',
        }),
      );
    }

    this.props.role = roleResult.value;
    if (roleResult.value.isAdmin()) {
      this.props.unidadesAcesso = [];
    }
    this.touch();
    return Result.ok();
  }

  public definirUnidades(params: DefinirUnidadesParams): Result<void> {
    if (this.props.role.isAdmin()) {
      this.props.unidadesAcesso = [];
      this.touch();
      return Result.ok();
    }

    this.props.unidadesAcesso = [...new Set(params.unidadesAcesso)];
    this.touch();
    return Result.ok();
  }

  public alterarDados(params: AlterarDadosParams): Result<void> {
    if (params.nome !== undefined) {
      const nomeResult = UserName.create(params.nome);
      if (nomeResult.isFailure) return Result.fail(nomeResult.error);
      this.props.nome = nomeResult.value;
    }

    if (params.telefone !== undefined) {
      this.props.telefone = params.telefone;
    }

    if (params.profissionalId !== undefined) {
      this.props.profissionalId = params.profissionalId;
    }

    if (params.unidadesAcesso !== undefined) {
      const unidadesResult = this.definirUnidades({ unidadesAcesso: params.unidadesAcesso });
      if (unidadesResult.isFailure) return Result.fail(unidadesResult.error);
    }

    this.touch();
    return Result.ok();
  }

  public inativar(): Result<void> {
    if (!this.props.ativo) {
      return Result.fail(new InvalidUserOperationError({ reason: 'Usuário já está inativo' }));
    }
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) {
      return Result.fail(new InvalidUserOperationError({ reason: 'Usuário já está ativo' }));
    }
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }

  public registrarAcesso(quando: Date): void {
    this.props.ultimoAcessoEm = quando;
    this.touch();
  }
}
