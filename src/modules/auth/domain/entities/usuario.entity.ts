import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Email } from '../value-objects/email.vo';
import { NomePessoa } from '../value-objects/nome-pessoa.vo';
import { Papel } from '../value-objects/papel.vo';
import type { Permissao } from '../value-objects/papel.vo';
import { UsuarioCriadoEvent } from '../events/usuario-criado.event';

export type UsuarioProps = {
  redeId: string;
  nome: NomePessoa;
  email: Email;
  senhaHash: string;
  papel: Papel;
  unidadesAcesso: string[];
  profissionalId: string | null;
  telefone: string | null;
  avatarUrl: string | null;
  ativo: boolean;
  ultimoAcessoEm: Date | null;
};

export type UsuarioConstructorParams = EntityConstructorParams<UsuarioProps>;
export type ReconstituirUsuarioParams = UsuarioConstructorParams & {
  id: NonNullable<UsuarioConstructorParams['id']>;
};

export type CriarUsuarioParams = {
  redeId: string;
  nome: string;
  email: string;
  senhaHash: string;
  papel: string;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
  telefone?: string | null;
};

export type AtualizarUsuarioParams = {
  nome?: string;
  email?: string;
  papel?: string;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
  telefone?: string | null;
};

export type PodeAcessarUnidadeParams = { unidadeId: string };
export type PodeParams = { permissao: Permissao };

export class Usuario extends AggregateRoot<UsuarioProps> {
  private constructor(params: UsuarioConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get nome(): NomePessoa {
    return this.props.nome;
  }

  get email(): Email {
    return this.props.email;
  }

  get senhaHash(): string {
    return this.props.senhaHash;
  }

  get papel(): Papel {
    return this.props.papel;
  }

  get unidadesAcesso(): string[] {
    return [...this.props.unidadesAcesso];
  }

  get profissionalId(): string | null {
    return this.props.profissionalId;
  }

  get telefone(): string | null {
    return this.props.telefone;
  }

  get avatarUrl(): string | null {
    return this.props.avatarUrl;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  get ultimoAcessoEm(): Date | null {
    return this.props.ultimoAcessoEm;
  }

  public static create(params: CriarUsuarioParams): Result<Usuario> {
    const nomeResult = NomePessoa.create(params.nome);
    if (nomeResult.isFailure) return Result.propagate(nomeResult);

    const emailResult = Email.create(params.email);
    if (emailResult.isFailure) return Result.propagate(emailResult);

    const papelResult = Papel.create(params.papel);
    if (papelResult.isFailure) return Result.propagate(papelResult);

    if (papelResult.value.value === 'profissional' && !params.profissionalId) {
      return Result.fail(
        new Error('Usuário com papel profissional deve estar vinculado a um profissional'),
      );
    }

    const usuario = new Usuario({
      props: {
        redeId: params.redeId,
        nome: nomeResult.value,
        email: emailResult.value,
        senhaHash: params.senhaHash,
        papel: papelResult.value,
        unidadesAcesso: params.unidadesAcesso ?? [],
        profissionalId: params.profissionalId ?? null,
        telefone: params.telefone ?? null,
        avatarUrl: null,
        ativo: true,
        ultimoAcessoEm: null,
      },
    });

    usuario.addDomainEvent(
      new UsuarioCriadoEvent({
        redeId: params.redeId,
        usuarioId: usuario.id.toString(),
        email: usuario.email.value,
      }),
    );

    return Result.ok(usuario);
  }

  public static reconstitute(params: ReconstituirUsuarioParams): Usuario {
    return new Usuario(params);
  }

  public pode({ permissao }: PodeParams): boolean {
    if (!this.props.ativo) return false;
    return this.props.papel.pode({ permissao });
  }

  public podeAcessarUnidade({ unidadeId }: PodeAcessarUnidadeParams): boolean {
    if (this.props.papel.value === 'admin_rede') return true;
    return this.props.unidadesAcesso.includes(unidadeId);
  }

  public atualizar(params: AtualizarUsuarioParams): Result<void> {
    if (params.nome !== undefined) {
      const nomeResult = NomePessoa.create(params.nome);
      if (nomeResult.isFailure) return Result.propagate(nomeResult);
      this.props.nome = nomeResult.value;
    }
    if (params.email !== undefined) {
      const emailResult = Email.create(params.email);
      if (emailResult.isFailure) return Result.propagate(emailResult);
      this.props.email = emailResult.value;
    }
    if (params.papel !== undefined) {
      const papelResult = Papel.create(params.papel);
      if (papelResult.isFailure) return Result.propagate(papelResult);
      this.props.papel = papelResult.value;
    }
    if (params.unidadesAcesso !== undefined) {
      this.props.unidadesAcesso = [...params.unidadesAcesso];
    }
    if (params.profissionalId !== undefined) {
      this.props.profissionalId = params.profissionalId;
    }
    if (params.telefone !== undefined) {
      this.props.telefone = params.telefone;
    }
    if (this.props.papel.value === 'profissional' && !this.props.profissionalId) {
      return Result.fail(
        new Error('Usuário com papel profissional deve estar vinculado a um profissional'),
      );
    }
    this.touch();
    return Result.ok();
  }

  public alterarSenha(senhaHash: string): Result<void> {
    if (!senhaHash) return Result.fail(new Error('Hash de senha inválido'));
    this.props.senhaHash = senhaHash;
    this.touch();
    return Result.ok();
  }

  public registrarAcesso(): Result<void> {
    if (!this.props.ativo) return Result.fail(new Error('Usuário inativo'));
    this.props.ultimoAcessoEm = new Date();
    this.touch();
    return Result.ok();
  }

  public desativar(): Result<void> {
    if (!this.props.ativo) return Result.fail(new Error('Usuário já está inativo'));
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) return Result.fail(new Error('Usuário já está ativo'));
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }
}
