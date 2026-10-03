import { addDays, startOfWeek } from 'date-fns';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { DEFAULT_TIME_ZONE } from '@/shared/utils/date.util';

/** `YYYY-MM-DD` de hoje no fuso informado. */
export function hojeNoFuso(timezone: string = DEFAULT_TIME_ZONE): string {
  return formatarDataIso(toZonedTime(new Date(), timezone));
}

/** Converte um `Date`/instante para `YYYY-MM-DD` no fuso informado. */
export function formatarDataIso(data: Date, timezone: string = DEFAULT_TIME_ZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(data);
}

/**
 * Intervalo [00:00, 24:00) do dia informado, no fuso da unidade, em ISO UTC.
 * A agenda sempre trafega instantes UTC (§3.10) e converte na borda.
 */
export function intervaloDoDia(
  dataIso: string,
  timezone: string = DEFAULT_TIME_ZONE,
): { de: string; ate: string } {
  const inicio = fromZonedTime(`${dataIso}T00:00:00`, timezone);
  const fim = fromZonedTime(`${dataIso}T23:59:59.999`, timezone);

  return { de: inicio.toISOString(), ate: fim.toISOString() };
}

/** Intervalo da semana (domingo a sábado) que contém a data informada. */
export function intervaloDaSemana(
  dataIso: string,
  timezone: string = DEFAULT_TIME_ZONE,
): { de: string; ate: string; dias: string[] } {
  const referencia = fromZonedTime(`${dataIso}T12:00:00`, timezone);
  const inicioSemana = startOfWeek(referencia, { weekStartsOn: 0 });

  const dias = Array.from({ length: 7 }, (_, indice) =>
    formatarDataIso(addDays(inicioSemana, indice), timezone),
  );

  return {
    de: fromZonedTime(`${dias[0]}T00:00:00`, timezone).toISOString(),
    ate: fromZonedTime(`${dias[6]}T23:59:59.999`, timezone).toISOString(),
    dias,
  };
}

/** Desloca uma data `YYYY-MM-DD` em N dias (aritmética de calendário, sem fuso). */
export function deslocarDias(dataIso: string, dias: number): string {
  const [ano, mes, dia] = dataIso.split('-').map(Number);
  const base = new Date(Date.UTC(ano, mes - 1, dia));
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

export function deslocarSemanas(dataIso: string, semanas: number): string {
  return deslocarDias(dataIso, semanas * 7);
}

/** Junta data (`YYYY-MM-DD`) e hora (`HH:mm`) em um instante UTC no fuso da unidade. */
export function instanteNoFuso(
  dataIso: string,
  hora: string,
  timezone: string = DEFAULT_TIME_ZONE,
): string {
  return fromZonedTime(`${dataIso}T${hora}:00`, timezone).toISOString();
}

/** Minutos desde a meia-noite local — usado para posicionar blocos na grade. */
export function minutosDoDia(instante: string | Date, timezone: string = DEFAULT_TIME_ZONE): number {
  const data = typeof instante === 'string' ? new Date(instante) : instante;
  if (Number.isNaN(data.getTime())) return 0;

  const local = toZonedTime(data, timezone);
  return local.getHours() * 60 + local.getMinutes();
}

export const HORA_INICIO_GRADE = 7;
export const HORA_FIM_GRADE = 21;
