/**
 * Utilitários de data — isomórficos.
 * Regra transversal: persistir em UTC e exibir no fuso da unidade de atendimento.
 */
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import type { Locale } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo';

export type FormatDateParams = {
  date: Date | string | null | undefined;
  pattern?: string;
  timeZone?: string;
  locale?: Locale;
};

export function formatDateInTimeZone(params: FormatDateParams): string {
  const { date, pattern = 'dd/MM/yyyy', timeZone = DEFAULT_TIME_ZONE, locale = ptBR } = params;
  if (!date) return '—';
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return '—';
  return formatInTimeZone(parsed, timeZone, pattern, { locale });
}

export type ToUtcInstantParams = { date: Date | string; timeZone?: string };

/** Converte um instante local (data + hora) do fuso da unidade para UTC. */
export function toUtcInstant(params: ToUtcInstantParams): Date {
  const { date, timeZone = DEFAULT_TIME_ZONE } = params;
  return fromZonedTime(date, timeZone);
}

export type ToUnitTimeParams = { date: Date | string; timeZone?: string };

/** Converte um instante UTC para o horário de parede da unidade. */
export function toUnitTime(params: ToUnitTimeParams): Date {
  const { date, timeZone = DEFAULT_TIME_ZONE } = params;
  const parsed = typeof date === 'string' ? new Date(date) : date;
  return toZonedTime(parsed, timeZone);
}

export type FormatDateTimeParams = {
  date: Date | string | null | undefined;
  timeZone?: string;
};

export function formatDateTime(params: FormatDateTimeParams): string {
  return formatDateInTimeZone({ ...params, pattern: 'dd/MM/yyyy HH:mm' });
}

export function formatTime(params: FormatDateTimeParams): string {
  return formatDateInTimeZone({ ...params, pattern: 'HH:mm' });
}

export type DateRangeParams = { start: Date; end: Date };

export function isWithinRange(params: { date: Date; range: DateRangeParams }): boolean {
  const { date, range } = params;
  return date.getTime() >= range.start.getTime() && date.getTime() <= range.end.getTime();
}

export function addMinutes(params: { date: Date; minutes: number }): Date {
  return new Date(params.date.getTime() + params.minutes * 60_000);
}

export function toDateInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

export function toDateTimeInputValue(date: Date | string | null | undefined): string {
  if (!date) return '';
  const parsed = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 16);
}
