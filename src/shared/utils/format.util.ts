import { onlyDigits } from './string.util';

export type FormatCpfParams = { value: string };
export type FormatPhoneParams = { value: string };
export type FormatBytesParams = { value: number };

export function formatCpf({ value }: FormatCpfParams): string {
  const digits = onlyDigits({ value });
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function formatPhone({ value }: FormatPhoneParams): string {
  const digits = onlyDigits({ value });
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return value;
}

export function formatBytes({ value }: FormatBytesParams): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}
