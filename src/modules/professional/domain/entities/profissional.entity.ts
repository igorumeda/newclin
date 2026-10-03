import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { RegistroConselho } from '../value-objects/registro-conselho.vo';
import type { RegistroConselhoValue } from '../value-objects/registro-conselho.vo';
import { InvalidProfessionalOperationError } from '../errors/profissional.errors';

export type ProfissionalProps = {
  redeId: string;
  nome: string;
  registro: RegistroConselho;
  cpf: string | null;
  especialidade: string | null;
  registroEspecialista: string | null;
  telefone: string | null;
  email: string | null;
  corAgenda: string;
  observacoes: string | null;
  ativo: boolean;
};

export type ProfissionalConstructorParams = EntityConstructorParams<ProfissionalProps>;

export type CreateProfissionalParams = {
  redeId: string;
  nome: string;
  conselhoClasse: string;
  numeroConselho: string;
  ufConselho?: string | null;
  cpf?: string | null;
  especialidade?: string | null;
  registroEspecialista?: string | null;
  telefone?: string | null;
  email?: string | null;
  corAgenda?: string;
  observacoes?: string | null;
};

export type AtualizarProfissionalParams = {
  nome?: string;
  conselhoClasse?: string;
  numeroConselho?: string;
  ufConselho?: string | null;
  cpf?: string | null;
  especialidade?: string | null;
  registroEspecialista?: string | null;
  telefone?: string | null;
  email?: string | null;
  corAgenda?: string;
  observacoes?: string | null;
};

const COR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Profissional de saúde vinculado à rede e habilitado em uma ou mais unidades. */
export class Profissional extends AggregateRoot<ProfissionalProps> {
  private constructor(params: ProfissionalConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get nome(): string {
    return this.props.nome;
  }
  get registro(): RegistroConselho {
    return this.props.registro;
  }
  get cpf(): string | null {
    return this.props.cpf;
  }
  get especialidade(): string | null {
    return this.props.especialidade;
  }
  get registroEspecialista(): string | null {
    return this.props.registroEspecialista;
  }
  get telefone(): string | null {
    return this.props.telefone;
  }
  get email(): string | null {
    return this.props.email;
  }
  get corAgenda(): string {
    return this.props.corAgenda;
  }
  get observacoes(): string | null {
    return this.props.observacoes;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CreateProfissionalParams): Result<Profissional> {
    const nome = params.nome?.trim() ?? '';
    if (nome.length < 3 || nome.length > 120) {
      return Result.fail(new Error('Nome do profissional deve ter entre 3 e 120 caracteres'));
    }

    const registroResult = RegistroConselho.create({
      conselhoClasse: params.conselhoClasse,
      numero: params.numeroConselho,
      uf: params.ufConselho ?? null,
    });
    if (registroResult.isFailure) return Result.fail(registroResult.error);

    if (params.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
      return Result.fail(new Error('Formato de e-mail inválido'));
    }

    const corAgenda = params.corAgenda ?? '#0ea5e9';
    if (!COR_PATTERN.test(corAgenda)) {
      return Result.fail(new Error('Cor da agenda deve estar no formato hexadecimal (#RRGGBB)'));
    }

    return Result.ok(
      new Profissional({
        props: {
          redeId: params.redeId,
          nome,
          registro: registroResult.value,
          cpf: params.cpf ? params.cpf.replace(/\D/g, '') : null,
          especialidade: params.especialidade ?? null,
          registroEspecialista: params.registroEspecialista ?? null,
          telefone: params.telefone ?? null,
          email: params.email ?? null,
          corAgenda,
          observacoes: params.observacoes ?? null,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(
    params: ProfissionalConstructorParams & { id: NonNullable<ProfissionalConstructorParams['id']> },
  ): Profissional {
    return new Profissional(params);
  }

  public atualizar(params: AtualizarProfissionalParams): Result<void> {
    if (params.nome !== undefined) {
      const nome = params.nome.trim();
      if (nome.length < 3 || nome.length > 120) {
        return Result.fail(new Error('Nome do profissional deve ter entre 3 e 120 caracteres'));
      }
      this.props.nome = nome;
    }

    if (params.conselhoClasse !== undefined || params.numeroConselho !== undefined || params.ufConselho !== undefined) {
      const registroResult = RegistroConselho.create({
        conselhoClasse: params.conselhoClasse ?? this.props.registro.conselhoClasse,
        numero: params.numeroConselho ?? this.props.registro.numero,
        uf: params.ufConselho ?? this.props.registro.uf,
      } as RegistroConselhoValue);
      if (registroResult.isFailure) return Result.fail(registroResult.error);
      this.props.registro = registroResult.value;
    }

    if (params.cpf !== undefined) {
      this.props.cpf = params.cpf ? params.cpf.replace(/\D/g, '') : null;
    }
    if (params.corAgenda !== undefined) {
      if (!COR_PATTERN.test(params.corAgenda)) {
        return Result.fail(new Error('Cor da agenda deve estar no formato hexadecimal (#RRGGBB)'));
      }
      this.props.corAgenda = params.corAgenda;
    }
    if (params.email !== undefined) {
      if (params.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
        return Result.fail(new Error('Formato de e-mail inválido'));
      }
      this.props.email = params.email;
    }

    if (params.especialidade !== undefined) this.props.especialidade = params.especialidade;
    if (params.registroEspecialista !== undefined) this.props.registroEspecialista = params.registroEspecialista;
    if (params.telefone !== undefined) this.props.telefone = params.telefone;
    if (params.observacoes !== undefined) this.props.observacoes = params.observacoes;

    this.touch();
    return Result.ok();
  }

  public inativar(): Result<void> {
    if (!this.props.ativo) {
      return Result.fail(new InvalidProfessionalOperationError({ reason: 'Profissional já está inativo' }));
    }
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) {
      return Result.fail(new InvalidProfessionalOperationError({ reason: 'Profissional já está ativo' }));
    }
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }
}
