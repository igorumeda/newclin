import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type ContatoProps = {
  telefone: string | null;
  email: string | null;
  /** Dados do responsável legal, obrigatórios para menores de 18 anos (§3.3). */
  responsavelNome: string | null;
  responsavelCpf: string | null;
  responsavelTelefone: string | null;
  responsavelParentesco: string | null;
};

export type ContatoValue = Partial<ContatoProps>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Telefone (somente dígitos, com DDD), e-mail normalizado e contato do responsável. */
export class Contato extends ValueObject<ContatoProps> {
  private constructor(props: ContatoProps) {
    super(props);
  }

  get telefone(): string | null {
    return this.props.telefone;
  }
  get email(): string | null {
    return this.props.email;
  }
  get responsavelNome(): string | null {
    return this.props.responsavelNome;
  }
  get responsavelCpf(): string | null {
    return this.props.responsavelCpf;
  }
  get responsavelTelefone(): string | null {
    return this.props.responsavelTelefone;
  }
  get responsavelParentesco(): string | null {
    return this.props.responsavelParentesco;
  }

  /** Telefone no formato E.164 usado pelas notificações (§4.2). */
  public telefoneE164(paisPadrao = '55'): string | null {
    if (!this.props.telefone) return null;
    return this.props.telefone.length >= 12 ? this.props.telefone : `${paisPadrao}${this.props.telefone}`;
  }

  public static create(value: ContatoValue): Result<Contato> {
    const telefone = value.telefone ? value.telefone.replace(/\D/g, '') : null;
    if (telefone && (telefone.length < 10 || telefone.length > 13)) {
      return Result.fail(new Error('Telefone deve conter DDD + número'));
    }

    const email = value.email ? value.email.trim().toLowerCase() : null;
    if (email && !EMAIL_PATTERN.test(email)) {
      return Result.fail(new Error('Formato de e-mail inválido'));
    }

    const responsavelTelefone = value.responsavelTelefone
      ? value.responsavelTelefone.replace(/\D/g, '')
      : null;
    if (responsavelTelefone && responsavelTelefone.length < 10) {
      return Result.fail(new Error('Telefone do responsável deve conter DDD + número'));
    }

    return Result.ok(
      new Contato({
        telefone,
        email,
        responsavelNome: value.responsavelNome?.trim() || null,
        responsavelCpf: value.responsavelCpf ? value.responsavelCpf.replace(/\D/g, '') : null,
        responsavelTelefone,
        responsavelParentesco: value.responsavelParentesco?.trim().toLowerCase() || null,
      }),
    );
  }

  public static reconstitute(props: ContatoValue): Contato {
    return new Contato({
      telefone: props.telefone ?? null,
      email: props.email ?? null,
      responsavelNome: props.responsavelNome ?? null,
      responsavelCpf: props.responsavelCpf ?? null,
      responsavelTelefone: props.responsavelTelefone ?? null,
      responsavelParentesco: props.responsavelParentesco ?? null,
    });
  }
}
