import type { SecaoTemplateEntrada } from '../../../domain/value-objects/estrutura-template.vo';

export type AtualizarTemplateInputDto = {
  redeId: string;
  id: string;
  nome?: string;
  especialidade?: string;
  descricao?: string | null;
  padrao?: boolean;
  ativo?: boolean;
  secoes?: SecaoTemplateEntrada[];
};
