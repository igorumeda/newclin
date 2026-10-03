import { Entity } from '@core/domain/entity.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { addMinutes } from '@/shared/utils/date.util';

export type HorarioAtendimentoProps = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  duracaoSlotMinutos: number;
  intervaloMinutos: number;
  ativo: boolean;
};

export type HorarioAtendimentoConstructorParams = EntityConstructorParams<HorarioAtendimentoProps>;

export type CreateHorarioAtendimentoParams = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  diaSemana: number;
  horaInicio: string;
  horaFim: string;
  duracaoSlotMinutos?: number;
  intervaloMinutos?: number;
};

export type SlotHorario = { inicio: Date; fim: Date };

const HORA_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

/** Horário de atendimento por profissional + unidade + dia da semana (§3.4). */
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
  get horaInicio(): string {
    return this.props.horaInicio;
  }
  get horaFim(): string {
    return this.props.horaFim;
  }
  get duracaoSlotMinutos(): number {
    return this.props.duracaoSlotMinutos;
  }
  get intervaloMinutos(): number {
    return this.props.intervaloMinutos;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }

  /** Gera os slots de agendamento do dia informado (data + horários → UTC). */
  public gerarSlots(params: { data: string; timeZone: string }): SlotHorario[] {
    const slots: SlotHorario[] = [];
    const [horaInicio, minutoInicio] = this.props.horaInicio.split(':').map(Number);
    const [horaFim, minutoFim] = this.props.horaFim.split(':').map(Number);

    const inicioBase = new Date(
      `${params.data}T${String(horaInicio).padStart(2, '0')}:${String(minutoInicio).padStart(2, '0')}:00`,
    );
    const fimBase = new Date(
      `${params.data}T${String(horaFim).padStart(2, '0')}:${String(minutoFim).padStart(2, '0')}:00`,
    );

    const passo = this.props.duracaoSlotMinutos + this.props.intervaloMinutos;
    let cursor = inicioBase;

    while (addMinutes({ date: cursor, minutes: this.props.duracaoSlotMinutos }) <= fimBase) {
      slots.push({
        inicio: new Date(cursor),
        fim: addMinutes({ date: cursor, minutes: this.props.duracaoSlotMinutos }),
      });
      cursor = addMinutes({ date: cursor, minutes: passo });
    }

    return slots;
  }

  public static create(params: CreateHorarioAtendimentoParams): Result<HorarioAtendimento> {
    if (!Number.isInteger(params.diaSemana) || params.diaSemana < 0 || params.diaSemana > 6) {
      return Result.fail(new Error('Dia da semana inválido'));
    }
    if (!HORA_PATTERN.test(params.horaInicio) || !HORA_PATTERN.test(params.horaFim)) {
      return Result.fail(new Error('Horário inválido: use o formato HH:MM'));
    }
    if (params.horaFim <= params.horaInicio) {
      return Result.fail(new Error('O horário final deve ser maior que o inicial'));
    }

    const duracao = params.duracaoSlotMinutos ?? 30;
    if (duracao < 5 || duracao > 480) {
      return Result.fail(new Error('Duração do slot deve estar entre 5 e 480 minutos'));
    }

    const intervalo = params.intervaloMinutos ?? 0;
    if (intervalo < 0 || intervalo > 120) {
      return Result.fail(new Error('Intervalo entre slots deve estar entre 0 e 120 minutos'));
    }

    return Result.ok(
      new HorarioAtendimento({
        props: {
          redeId: params.redeId,
          profissionalId: params.profissionalId,
          unidadeId: params.unidadeId,
          diaSemana: params.diaSemana,
          horaInicio: params.horaInicio,
          horaFim: params.horaFim,
          duracaoSlotMinutos: duracao,
          intervaloMinutos: intervalo,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(
    params: HorarioAtendimentoConstructorParams & { id: NonNullable<HorarioAtendimentoConstructorParams['id']> },
  ): HorarioAtendimento {
    return new HorarioAtendimento(params);
  }
}
