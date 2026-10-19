import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import type { DadosPreenchidos } from '../value-objects/dados-prontuario.vo';
import { InvalidProntuarioOperationError } from '../errors/prontuario.errors';

export type TipoEvolucao = 'adendo' | 'evolucao' | 'retificacao';

export const TIPO_EVOLUCAO_LABELS: Record<TipoEvolucao, string> = {
  adendo: 'Adendo',
  evolucao: 'Evolução',
  retificacao: 'Retificação',
};

export type EvolucaoProps = {
  redeId: string;
  atendimentoId: string;
  pacienteId: string;
  profissionalId: string;
  tipo: TipoEvolucao;
  conteudo: string;
  dados: DadosPreenchidos;
  assinadoEm: Date;
  createdBy: string | null;
};

export type EvolucaoConstructorParams = EntityConstructorParams<EvolucaoProps>;

export type CreateEvolucaoParams = {
  redeId: string;
  atendimentoId: string;
  pacienteId: string;
  profissionalId: string;
  tipo?: TipoEvolucao;
  conteudo: string;
  dados?: DadosPreenchidos;
  createdBy?: string | null;
};

/**
 * Adendo/evolução (§3.5): entradas complementares do prontuário, somente
 * inserção. É o único caminho para corrigir um atendimento finalizado.
 */
export class Evolucao extends Entity<EvolucaoProps> {
  private constructor(params: EvolucaoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get atendimentoId(): string {
    return this.props.atendimentoId;
  }
  get pacienteId(): string {
    return this.props.pacienteId;
  }
  get profissionalId(): string {
    return this.props.profissionalId;
  }
  get tipo(): TipoEvolucao {
    return this.props.tipo;
  }
  get conteudo(): string {
    return this.props.conteudo;
  }
  get dados(): DadosPreenchidos {
    return this.props.dados;
  }
  get assinadoEm(): Date {
    return this.props.assinadoEm;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }

  public static create(params: CreateEvolucaoParams): Result<Evolucao> {
    const conteudo = (params.conteudo ?? '').trim();

    if (conteudo.length < 5) {
      return Result.fail(
        new InvalidProntuarioOperationError({ reason: 'O adendo deve ter ao menos 5 caracteres' }),
      );
    }

    return Result.ok(
      new Evolucao({
        props: {
          redeId: params.redeId,
          atendimentoId: params.atendimentoId,
          pacienteId: params.pacienteId,
          profissionalId: params.profissionalId,
          tipo: params.tipo ?? 'adendo',
          conteudo,
          dados: params.dados ?? {},
          assinadoEm: new Date(),
          createdBy: params.createdBy ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: EvolucaoConstructorParams): Evolucao {
    return new Evolucao(params);
  }
}
