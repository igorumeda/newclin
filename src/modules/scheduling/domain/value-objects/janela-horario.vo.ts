import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';

export type JanelaHorarioProps = {
  inicio: Date;
  fim: Date;
};

export type CreateJanelaHorarioParams = {
  inicio: Date | string;
  fim: Date | string;
};

const DURACAO_MAXIMA_MINUTOS = 12 * 60;

/**
 * Janela de horário em UTC. Toda a persistência é UTC; a exibição usa o
 * timezone da unidade (`date-fns-tz`) na borda da aplicação.
 */
export class JanelaHorario extends ValueObject<JanelaHorarioProps> {
  private constructor(props: JanelaHorarioProps) {
    super(props);
  }

  get inicio(): Date {
    return this.props.inicio;
  }

  get fim(): Date {
    return this.props.fim;
  }

  public duracaoMinutos(): number {
    return Math.round((this.props.fim.getTime() - this.props.inicio.getTime()) / 60000);
  }

  public conflitaCom(outra: JanelaHorario): boolean {
    return this.props.inicio < outra.fim && this.props.fim > outra.inicio;
  }

  public contem(data: Date): boolean {
    return data >= this.props.inicio && data < this.props.fim;
  }

  public toISO(): { inicio: string; fim: string } {
    return { inicio: this.props.inicio.toISOString(), fim: this.props.fim.toISOString() };
  }

  public static create(params: CreateJanelaHorarioParams): Result<JanelaHorario> {
    const inicio = params.inicio instanceof Date ? params.inicio : new Date(params.inicio);
    const fim = params.fim instanceof Date ? params.fim : new Date(params.fim);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      return Result.fail(new Error('Data/hora do agendamento inválida'));
    }
    if (fim.getTime() <= inicio.getTime()) {
      return Result.fail(new Error('Horário de término deve ser posterior ao de início'));
    }

    const duracao = Math.round((fim.getTime() - inicio.getTime()) / 60000);
    if (duracao > DURACAO_MAXIMA_MINUTOS) {
      return Result.fail(new Error('Duração do agendamento não pode exceder 12 horas'));
    }

    return Result.ok(new JanelaHorario({ inicio, fim }));
  }

  /** Cria a janela a partir de um início e uma duração em minutos. */
  public static aPartirDe(params: { inicio: Date | string; duracaoMinutos: number }): Result<JanelaHorario> {
    const inicio = params.inicio instanceof Date ? params.inicio : new Date(params.inicio);
    if (Number.isNaN(inicio.getTime())) {
      return Result.fail(new Error('Data/hora do agendamento inválida'));
    }

    return JanelaHorario.create({
      inicio,
      fim: new Date(inicio.getTime() + params.duracaoMinutos * 60000),
    });
  }

  public static reconstitute(props: JanelaHorarioProps): JanelaHorario {
    return new JanelaHorario(props);
  }
}
