export type SlugifyParams = { value: string };
export type OnlyDigitsParams = { value: string };
export type InitialsParams = { value: string; max?: number };

const ACCENTS_FROM = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ';
const ACCENTS_TO = 'aaaaaeeeeiiiiooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN';

export function removeAccents(value: string): string {
  return value
    .split('')
    .map((char) => {
      const index = ACCENTS_FROM.indexOf(char);
      return index >= 0 ? ACCENTS_TO[index] : char;
    })
    .join('');
}

export function slugify({ value }: SlugifyParams): string {
  return removeAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function onlyDigits({ value }: OnlyDigitsParams): string {
  return value.replace(/\D+/g, '');
}

export function initials({ value, max = 2 }: InitialsParams): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, max)
    .toUpperCase();
}

export function capitalizeWords(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => (word.length > 2 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}
