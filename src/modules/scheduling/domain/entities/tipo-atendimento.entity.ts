import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { InvalidSchedulingOperationError } from '../errors/agendamento.errors';

export type TipoAtendimentoProps = {
  redeId: string;
  nome: string;
  descricao: string | null;
  duracaoMinutos: number;
  cor: string;
  requerConfirmacao: boolean;
  ativo: boolean;
};

export type TipoAtendimentoConstructorParams = EntityConstructorParams<TipoAtendimentoProps>;

export type CreateTipoAtendimentoParams = {
  redeId: string;
  nome: string;
  descricao?: string | null;
  duracaoMinutos?: number;
  cor?: string;
  requerConfirmacao?: boolean;
};

export type AtualizarTipoAtendimentoParams = {
  nome?: string;
  descricao?: string | null;
  duracaoMinutos?: number;
  cor?: string;
  requerConfirmacao?: boolean;
};

const COR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const DURACAO_MINIMA = 5;
const DURACAO_MAXIMA = 480;

/** Tipo de atendimento por rede: define a duração padrão e a cor na agenda (§3.4). */
export class TipoAtendimento extends AggregateRoot<TipoAtendimentoProps> {
  private constructor(params: TipoAtendimentoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get nome(): string {
    return this.props.nome;
  }
  get descricao(): string | null {
    return this.props.descricao;
  }
  get duracaoMinutos(): number {
    return this.props.duracaoMinutos;
  }
  get cor(): string {
    return this.props.cor;
  }
  get requerConfirmacao(): boolean {
    return this.props.requerConfirmacao;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CreateTipoAtendimentoParams): Result<TipoAtendimento> {
    const nome = (params.nome ?? '').trim();
    if (nome.length < 2) {
      return Result.fail(new InvalidSchedulingOperationError({ reason: 'Nome do tipo de atendimento é obrigatório' }));
    }

    const duracaoMinutos = params.duracaoMinutos ?? 30;
    if (duracaoMinutos < DURACAO_MINIMA || duracaoMinutos > DURACAO_MAXIMA) {
      return Result.fail(
        new InvalidSchedulingOperationError({
          reason: `Duração deve estar entre ${DURACAO_MINIMA} e ${DURACAO_MAXIMA} minutos`,
        }),
      );
    }

    const cor = params.cor ?? '#0ea5e9';
    if (!COR_PATTERN.test(cor)) {
      return Result.fail(new InvalidSchedulingOperationError({ reason: 'Cor deve estar no formato #RRGGBB' }));
    }

    return Result.ok(
      new TipoAtendimento({
        props: {
          redeId: params.redeId,
          nome,
          descricao: params.descricao ?? null,
          duracaoMinutos,
          cor,
          requerConfirmacao: params.requerConfirmacao ?? true,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: TipoAtendimentoConstructorParams): TipoAtendimento {
    return new TipoAtendimento(params);
  }

  public atualizar(params: AtualizarTipoAtendimentoParams): Result<void> {
    if (params.nome !== undefined) {
      const nome = params.nome.trim();
      if (nome.length < 2) {
        return Result.fail(new InvalidSchedulingOperationError({ reason: 'Nome do tipo de atendimento é obrigatório' }));
      }
      this.props.nome = nome;
    }

    if (params.duracaoMinutos !== undefined) {
      if (params.duracaoMinutos < DURACAO_MINIMA || params.duracaoMinutos > DURACAO_MAXIMA) {
        return Result.fail(
          new InvalidSchedulingOperationError({
            reason: `Duração deve estar entre ${DURACAO_MINIMA} e ${DURACAO_MAXIMA} minutos`,
          }),
        );
      }
      this.props.duracaoMinutos = params.duracaoMinutos;
    }

    if (params.cor !== undefined) {
      if (!COR_PATTERN.test(params.cor)) {
        return Result.fail(new InvalidSchedulingOperationError({ reason: 'Cor deve estar no formato #RRGGBB' }));
      }
      this.props.cor = params.cor;
    }

    if (params.descricao !== undefined) this.props.descricao = params.descricao;
    if (params.requerConfirmacao !== undefined) this.props.requerConfirmacao = params.requerConfirmacao;

    this.touch();
    return Result.ok();
  }

  public inativar(): Result<void> {
    if (!this.props.ativo) {
      return Result.fail(new InvalidSchedulingOperationError({ reason: 'Tipo de atendimento já está inativo' }));
    }
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public reativar(): Result<void> {
    if (this.props.ativo) {
      return Result.fail(new InvalidSchedulingOperationError({ reason: 'Tipo de atendimento já está ativo' }));
    }
    this.props.ativo = true;
    this.touch();
    return Result.ok();
  }
}
