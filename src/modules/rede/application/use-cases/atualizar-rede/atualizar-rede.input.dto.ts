import type { RedeConfig } from '../../../domain/entities/rede.entity';

export type AtualizarRedeInputDto = {
  redeId: string;
  nome?: string;
  cnpj?: string | null;
  logotipoUrl?: string | null;
  config?: Partial<RedeConfig>;
};
