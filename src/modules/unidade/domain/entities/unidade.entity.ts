import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Endereco } from '../value-objects/endereco.vo';
import type { CriarEnderecoParams } from '../value-objects/endereco.vo';

export type UnidadeProps = {
  redeId: string;
  nome: string;
  codigo: string | null;
  telefone: string | null;
  email: string | null;
  endereco: Endereco;
  fusoHorario: string;
  ativo: boolean;
};

export type UnidadeConstructorParams = EntityConstructorParams<UnidadeProps>;
export type ReconstituirUnidadeParams = UnidadeConstructorParams & {
  id: NonNullable<UnidadeConstructorParams['id']>;
};
export type CriarUnidadeParams = {
  redeId: string;
  nome: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: CriarEnderecoParams;
  fusoHorario?: string;
};
export type AtualizarUnidadeParams = {
  nome?: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: CriarEnderecoParams;
  fusoHorario?: string;
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

  get codigo(): string | null {
    return this.props.codigo;
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

  get fusoHorario(): string {
    return this.props.fusoHorario;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CriarUnidadeParams): Result<Unidade> {
    if (!params.nome || params.nome.trim().length < 2) {
      return Result.fail(new Error('Nome da unidade deve ter no mínimo 2 caracteres'));
    }
    const enderecoResult = Endereco.create(params.endereco ?? {});
    if (enderecoResult.isFailure) return Result.propagate(enderecoResult);

    return Result.ok(
      new Unidade({
        props: {
          redeId: params.redeId,
          nome: params.nome.trim(),
          codigo: params.codigo?.trim() || null,
          telefone: params.telefone?.trim() || null,
          email: params.email?.trim().toLowerCase() || null,
          endereco: enderecoResult.value,
          fusoHorario: params.fusoHorario ?? 'America/Sao_Paulo',
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirUnidadeParams): Unidade {
    return new Unidade(params);
  }

  public atualizar(params: AtualizarUnidadeParams): Result<void> {
    if (params.nome !== undefined) {
      if (params.nome.trim().length < 2) {
        return Result.fail(new Error('Nome da unidade deve ter no mínimo 2 caracteres'));
      }
      this.props.nome = params.nome.trim();
    }
    if (params.codigo !== undefined) this.props.codigo = params.codigo?.trim() || null;
    if (params.telefone !== undefined) this.props.telefone = params.telefone?.trim() || null;
    if (params.email !== undefined) this.props.email = params.email?.trim().toLowerCase() || null;
    if (params.fusoHorario !== undefined) this.props.fusoHorario = params.fusoHorario;
    if (params.endereco) {
      const enderecoResult = Endereco.create({ ...this.props.endereco.valores, ...params.endereco });
      if (enderecoResult.isFailure) return Result.propagate(enderecoResult);
      this.props.endereco = enderecoResult.value;
    }
    this.touch();
    return Result.ok();
  }

  public desativar(): Result<void> {
    if (!this.props.ativo) return Result.fail(new Error('Unidade já está inativa'));
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) return Result.fail(new Error('Unidade já está ativa'));
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }
}
