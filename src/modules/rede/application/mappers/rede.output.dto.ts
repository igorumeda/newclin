import type { TemaCores } from '../../domain/value-objects/tema.vo';
import type { RedeConfig } from '../../domain/entities/rede.entity';

export type RedeOutputDto = {
  id: string;
  nome: string;
  slug: string;
  cnpj: string | null;
  cnpjFormatado: string | null;
  logotipoUrl: string | null;
  tema: { preset: string; cores: TemaCores };
  config: RedeConfig;
  ativo: boolean;
};
