export function stripPhone(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return '';
  const digits = stripPhone(value);
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return value;
}

export function maskPhone(value: string): string {
  const digits = stripPhone(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{1,4})$/, '$1-$2');
}

/** Formato exigido pelos provedores de WhatsApp (E.164 sem o símbolo "+"). */
export function toWhatsAppNumber(params: { phone: string; countryCode?: string }): string {
  const { phone, countryCode = '55' } = params;
  const digits = stripPhone(phone);
  if (digits.startsWith(countryCode) && digits.length > 11) return digits;
  return `${countryCode}${digits}`;
}
