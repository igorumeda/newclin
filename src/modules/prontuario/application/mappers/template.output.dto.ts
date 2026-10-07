import type { SecaoTemplate } from '../../domain/value-objects/estrutura-template.vo';

export type TemplateOutputDto = {
  id: string;
  redeId: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  versao: number;
  secoes: SecaoTemplate[];
  totalCampos: number;
  padrao: boolean;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
};
