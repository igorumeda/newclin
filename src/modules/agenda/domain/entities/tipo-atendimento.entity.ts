import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';

export type TipoAtendimentoProps = {
  redeId: string;
  nome: string;
  duracaoMinutos: number;
  cor: string;
  ativo: boolean;
};

export type TipoAtendimentoConstructorParams = EntityConstructorParams<TipoAtendimentoProps>;
export type ReconstituirTipoAtendimentoParams = TipoAtendimentoConstructorParams & {
  id: NonNullable<TipoAtendimentoConstructorParams['id']>;
};
export type CriarTipoAtendimentoParams = {
  redeId: string;
  nome: string;
  duracaoMinutos: number;
  cor?: string;
};
export type AtualizarTipoAtendimentoParams = {
  nome?: string;
  duracaoMinutos?: number;
  cor?: string;
  ativo?: boolean;
};

const COR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export class TipoAtendimento extends Entity<TipoAtendimentoProps> {
  private constructor(params: TipoAtendimentoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get nome(): string {
    return this.props.nome;
  }

  get duracaoMinutos(): number {
    return this.props.duracaoMinutos;
  }

  get cor(): string {
    return this.props.cor;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  private static validarDuracao(duracao: number): Result<void> {
    if (!Number.isFinite(duracao) || duracao < 5 || duracao > 480) {
      return Result.fail(new Error('Duração deve estar entre 5 e 480 minutos'));
    }
    return Result.ok();
  }

  public static create(params: CriarTipoAtendimentoParams): Result<TipoAtendimento> {
    if (!params.nome || params.nome.trim().length < 3) {
      return Result.fail(new Error('Nome do tipo de atendimento deve ter no mínimo 3 caracteres'));
    }
    const duracaoResult = TipoAtendimento.validarDuracao(params.duracaoMinutos);
    if (duracaoResult.isFailure) return Result.propagate(duracaoResult);

    const cor = params.cor ?? '#0ea5e9';
    if (!COR_PATTERN.test(cor)) {
      return Result.fail(new Error('Cor deve estar no formato hexadecimal (#RRGGBB)'));
    }

    return Result.ok(
      new TipoAtendimento({
        props: {
          redeId: params.redeId,
          nome: params.nome.trim(),
          duracaoMinutos: params.duracaoMinutos,
          cor,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirTipoAtendimentoParams): TipoAtendimento {
    return new TipoAtendimento(params);
  }

  public atualizar(params: AtualizarTipoAtendimentoParams): Result<void> {
    if (params.nome !== undefined) {
      if (params.nome.trim().length < 3) {
        return Result.fail(new Error('Nome do tipo de atendimento deve ter no mínimo 3 caracteres'));
      }
      this.props.nome = params.nome.trim();
    }
    if (params.duracaoMinutos !== undefined) {
      const duracaoResult = TipoAtendimento.validarDuracao(params.duracaoMinutos);
      if (duracaoResult.isFailure) return Result.propagate(duracaoResult);
      this.props.duracaoMinutos = params.duracaoMinutos;
    }
    if (params.cor !== undefined) {
      if (!COR_PATTERN.test(params.cor)) {
        return Result.fail(new Error('Cor deve estar no formato hexadecimal (#RRGGBB)'));
      }
      this.props.cor = params.cor;
    }
    if (params.ativo !== undefined) this.props.ativo = params.ativo;
    this.touch();
    return Result.ok();
  }
}
