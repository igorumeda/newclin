import { DEFAULT_TIME_ZONE } from '@/shared/utils/date.util';

export type DateInput = string | Date | null | undefined;

function toDate(valor: DateInput): Date | null {
  if (!valor) return null;
  const data = valor instanceof Date ? valor : new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

/** Datas clínicas em ISO (YYYY-MM-DD) são exibidas sem conversão de fuso. */
export function formatarData(valor: DateInput): string {
  const data = toDate(valor);
  if (!data) return '—';

  if (typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  return data.toLocaleDateString('pt-BR', { timeZone: DEFAULT_TIME_ZONE });
}

export function formatarDataHora(valor: DateInput): string {
  const data = toDate(valor);
  if (!data) return '—';

  return `${data.toLocaleDateString('pt-BR', { timeZone: DEFAULT_TIME_ZONE })} ${data.toLocaleTimeString('pt-BR', {
    timeZone: DEFAULT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function formatarHora(valor: DateInput): string {
  const data = toDate(valor);
  if (!data) return '—';

  return data.toLocaleTimeString('pt-BR', {
    timeZone: DEFAULT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Horário exibido no fuso da unidade (§3.10 — armazenamento UTC, exibição local). */
export function formatarHoraFuso(valor: DateInput, timezone: string = DEFAULT_TIME_ZONE): string {
  const data = toDate(valor);
  if (!data) return '—';

  return data.toLocaleTimeString('pt-BR', { timeZone: timezone, hour: '2-digit', minute: '2-digit' });
}

export function formatarDataFuso(valor: DateInput, timezone: string = DEFAULT_TIME_ZONE): string {
  const data = toDate(valor);
  if (!data) return '—';

  return data.toLocaleDateString('pt-BR', { timeZone: timezone });
}

export function formatarDataHoraFuso(valor: DateInput, timezone: string = DEFAULT_TIME_ZONE): string {
  const data = toDate(valor);
  if (!data) return '—';

  return `${formatarDataFuso(valor, timezone)} ${formatarHoraFuso(valor, timezone)}`;
}

export function formatarDataCurta(valor: DateInput): string {
  const data = toDate(valor);
  if (!data) return '—';

  return data.toLocaleDateString('pt-BR', { timeZone: DEFAULT_TIME_ZONE, day: '2-digit', month: 'short' });
}

export function formatarMes(valor: DateInput): string {
  const data = toDate(valor);
  if (!data) return '—';

  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC', month: 'short', year: 'numeric' });
}

export function formatarNumero(valor: number | null | undefined, casas = 0): string {
  if (valor === null || valor === undefined) return '—';
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

export function formatarPercentual(valor: number | null | undefined, casas = 1): string {
  if (valor === null || valor === undefined) return '—';
  return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;
}

export function formatarBytes(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Idade legível: "34 anos", "8 meses", "12 dias". */
export function formatarIdade(idadeAnos: number | null | undefined): string {
  if (idadeAnos === null || idadeAnos === undefined) return '—';
  if (idadeAnos === 0) return 'menos de 1 ano';
  return idadeAnos === 1 ? '1 ano' : `${idadeAnos} anos`;
}

export function iniciais(nome: string | null | undefined): string {
  if (!nome) return '—';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}
