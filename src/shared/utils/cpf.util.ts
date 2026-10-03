/**
 * Utilitários de CPF — normalização e formatação.
 * A validação dos dígitos verificadores vive no Value Object de domínio (`CPF`),
 * que é reutilizado no client e no server.
 */
export const CPF_LENGTH = 11;

export function stripCpf(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCpf(value: string | null | undefined): string {
  if (!value) return '';
  const digits = stripCpf(value);
  if (digits.length !== CPF_LENGTH) return value;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export function maskCpf(value: string): string {
  const digits = stripCpf(value).slice(0, CPF_LENGTH);
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
