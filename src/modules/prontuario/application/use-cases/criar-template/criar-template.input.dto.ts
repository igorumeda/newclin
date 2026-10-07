import type { SecaoTemplateEntrada } from '../../../domain/value-objects/estrutura-template.vo';

export type CriarTemplateInputDto = {
  redeId: string;
  nome: string;
  especialidade: string;
  descricao?: string | null;
  padrao?: boolean;
  secoes: SecaoTemplateEntrada[];
};
