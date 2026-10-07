import type { TemaCores } from '../../../domain/value-objects/tema.vo';

export type AtualizarTemaInputDto = {
  redeId: string;
  preset?: string;
  cores?: Partial<TemaCores>;
};
