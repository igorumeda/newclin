export type FormatDateParams = { value: Date | string; timeZone?: string };
export type FormatDateTimeParams = { value: Date | string; timeZone?: string };
export type AgeParams = { birthDate: Date | string; reference?: Date };
export type AddMinutesParams = { date: Date; minutes: number };
export type IsoDateParams = { value: Date };

export const DEFAULT_TIME_ZONE = 'America/Sao_Paulo';

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate({ value, timeZone = DEFAULT_TIME_ZONE }: FormatDateParams): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone }).format(toDate(value));
}

export function formatDateTime({
  value,
  timeZone = DEFAULT_TIME_ZONE,
}: FormatDateTimeParams): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone,
  }).format(toDate(value));
}

export function formatTime({ value, timeZone = DEFAULT_TIME_ZONE }: FormatDateTimeParams): string {
  return new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short', timeZone }).format(toDate(value));
}

export function calculateAge({ birthDate, reference = new Date() }: AgeParams): number {
  const birth = toDate(birthDate);
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = reference.getUTCMonth() - birth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && reference.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function addMinutes({ date, minutes }: AddMinutesParams): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Retorna o dia em formato ISO (YYYY-MM-DD) sem componente de hora. */
export function toIsoDate({ value }: IsoDateParams): string {
  return value.toISOString().slice(0, 10);
}
