import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';

export type AdendoProps = {
  redeId: string;
  atendimentoId: string;
  profissionalId: string;
  usuarioId: string | null;
  conteudo: string;
};

export type AdendoConstructorParams = EntityConstructorParams<AdendoProps>;
export type ReconstituirAdendoParams = AdendoConstructorParams & {
  id: NonNullable<AdendoConstructorParams['id']>;
};
export type CriarAdendoParams = {
  redeId: string;
  atendimentoId: string;
  profissionalId: string;
  usuarioId?: string | null;
  conteudo: string;
};

const CONTEUDO_MINIMO = 5;

export class Adendo extends Entity<AdendoProps> {
  private constructor(params: AdendoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get atendimentoId(): string {
    return this.props.atendimentoId;
  }

  get profissionalId(): string {
    return this.props.profissionalId;
  }

  get usuarioId(): string | null {
    return this.props.usuarioId;
  }

  get conteudo(): string {
    return this.props.conteudo;
  }

  public static create(params: CriarAdendoParams): Result<Adendo> {
    const conteudo = params.conteudo?.trim() ?? '';
    if (conteudo.length < CONTEUDO_MINIMO) {
      return Result.fail(
        new Error(`O adendo deve ter no mínimo ${CONTEUDO_MINIMO} caracteres`),
      );
    }
    return Result.ok(
      new Adendo({
        props: {
          redeId: params.redeId,
          atendimentoId: params.atendimentoId,
          profissionalId: params.profissionalId,
          usuarioId: params.usuarioId ?? null,
          conteudo,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirAdendoParams): Adendo {
    return new Adendo(params);
  }
}
