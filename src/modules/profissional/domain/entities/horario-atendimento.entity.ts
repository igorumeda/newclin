import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';

export const DIAS_SEMANA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
] as const;

export type HorarioAtendimentoProps = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  ativo: boolean;
};

export type HorarioAtendimentoConstructorParams = EntityConstructorParams<HorarioAtendimentoProps>;
export type ReconstituirHorarioParams = HorarioAtendimentoConstructorParams & {
  id: NonNullable<HorarioAtendimentoConstructorParams['id']>;
};
export type CriarHorarioParams = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
};

const HORA_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class HorarioAtendimento extends Entity<HorarioAtendimentoProps> {
  private constructor(params: HorarioAtendimentoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get profissionalId(): string {
    return this.props.profissionalId;
  }

  get unidadeId(): string {
    return this.props.unidadeId;
  }

  get diaSemana(): number {
    return this.props.diaSemana;
  }

  get rotuloDiaSemana(): string {
    return DIAS_SEMANA[this.props.diaSemana];
  }

  get horaInicio(): string {
    return this.props.horaInicio;
  }

  get horaFim(): string {
    return this.props.horaFim;
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CriarHorarioParams): Result<HorarioAtendimento> {
    if (params.diaSemana < 0 || params.diaSemana > 6) {
      return Result.fail(new Error('Dia da semana inválido'));
    }
    const inicio = params.horaInicio.slice(0, 5);
    const fim = params.horaFim.slice(0, 5);
    if (!HORA_PATTERN.test(inicio) || !HORA_PATTERN.test(fim)) {
      return Result.fail(new Error('Horário deve estar no formato HH:MM'));
    }
    if (fim <= inicio) {
      return Result.fail(new Error('Hora final deve ser maior que a hora inicial'));
    }
    return Result.ok(
      new HorarioAtendimento({
        props: {
          redeId: params.redeId,
          profissionalId: params.profissionalId,
          unidadeId: params.unidadeId,
          diaSemana: params.diaSemana,
          horaInicio: inicio,
          horaFim: fim,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirHorarioParams): HorarioAtendimento {
    return new HorarioAtendimento(params);
  }
}
