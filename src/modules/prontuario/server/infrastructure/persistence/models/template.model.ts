import type { SecaoTemplate } from '../../../../domain/value-objects/estrutura-template.vo';

export type EstruturaTemplateJson = { secoes: SecaoTemplate[] };

export type TemplateModel = {
  id: string;
  rede_id: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  versao: number;
  estrutura: EstruturaTemplateJson;
  padrao: boolean;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
};

export type TemplateModelData = {
  id: string;
  rede_id: string;
  nome: string;
  especialidade: string;
  descricao: string | null;
  versao: number;
  estrutura: string;
  padrao: boolean;
  ativo: boolean;
};
