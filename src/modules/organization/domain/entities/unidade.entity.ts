import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Endereco } from '../value-objects/endereco.vo';
import type { EnderecoValue } from '../value-objects/endereco.vo';
import { InvalidUnitOperationError } from '../errors/unidade.errors';

export type UnidadeProps = {
  redeId: string;
  nome: string;
  cnes: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: Endereco;
  timezone: string;
  observacoes: string | null;
  ativo: boolean;
};

export type UnidadeConstructorParams = EntityConstructorParams<UnidadeProps>;

export type CreateUnidadeParams = {
  redeId: string;
  nome: string;
  cnes?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: EnderecoValue;
  timezone?: string;
  observacoes?: string | null;
};

export type AtualizarUnidadeParams = {
  nome?: string;
  cnes?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: EnderecoValue;
  timezone?: string;
  observacoes?: string | null;
};

export class Unidade extends AggregateRoot<UnidadeProps> {
  private constructor(params: UnidadeConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get nome(): string {
    return this.props.nome;
  }
  get cnes(): string | null {
    return this.props.cnes;
  }
  get cnpj(): string | null {
    return this.props.cnpj;
  }
  get telefone(): string | null {
    return this.props.telefone;
  }
  get email(): string | null {
    return this.props.email;
  }
  get endereco(): Endereco {
    return this.props.endereco;
  }
  get timezone(): string {
    return this.props.timezone;
  }
  get observacoes(): string | null {
    return this.props.observacoes;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CreateUnidadeParams): Result<Unidade> {
    const nome = params.nome?.trim() ?? '';
    if (nome.length < 3) {
      return Result.fail(new Error('Nome da unidade deve ter no mínimo 3 caracteres'));
    }

    if (params.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
      return Result.fail(new Error('Formato de e-mail inválido'));
    }

    const enderecoResult = Endereco.create(params.endereco ?? {});
    if (enderecoResult.isFailure) return Result.fail(enderecoResult.error);

    return Result.ok(
      new Unidade({
        props: {
          redeId: params.redeId,
          nome,
          cnes: params.cnes ?? null,
          cnpj: params.cnpj ? params.cnpj.replace(/\D/g, '') : null,
          telefone: params.telefone ?? null,
          email: params.email ?? null,
          endereco: enderecoResult.value,
          timezone: params.timezone ?? 'America/Sao_Paulo',
          observacoes: params.observacoes ?? null,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: UnidadeConstructorParams & { id: NonNullable<UnidadeConstructorParams['id']> }): Unidade {
    return new Unidade(params);
  }

  public atualizar(params: AtualizarUnidadeParams): Result<void> {
    if (params.nome !== undefined) {
      const nome = params.nome.trim();
      if (nome.length < 3) {
        return Result.fail(new Error('Nome da unidade deve ter no mínimo 3 caracteres'));
      }
      this.props.nome = nome;
    }

    if (params.email !== undefined) {
      if (params.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
        return Result.fail(new Error('Formato de e-mail inválido'));
      }
      this.props.email = params.email;
    }

    if (params.endereco !== undefined) {
      const enderecoResult = Endereco.create(params.endereco);
      if (enderecoResult.isFailure) return Result.fail(enderecoResult.error);
      this.props.endereco = enderecoResult.value;
    }

    if (params.cnes !== undefined) this.props.cnes = params.cnes;
    if (params.cnpj !== undefined) this.props.cnpj = params.cnpj ? params.cnpj.replace(/\D/g, '') : null;
    if (params.telefone !== undefined) this.props.telefone = params.telefone;
    if (params.timezone !== undefined) this.props.timezone = params.timezone;
    if (params.observacoes !== undefined) this.props.observacoes = params.observacoes;

    this.touch();
    return Result.ok();
  }

  public inativar(): Result<void> {
    if (!this.props.ativo) {
      return Result.fail(new InvalidUnitOperationError({ reason: 'Unidade já está inativa' }));
    }
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) {
      return Result.fail(new InvalidUnitOperationError({ reason: 'Unidade já está ativa' }));
    }
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }
}
