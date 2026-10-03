import type { RedeConfig } from '../../../../domain/entities/rede.entity';
import type { TemaProps } from '../../../../domain/value-objects/tema.vo';

export type RedeModel = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  slug: string | null;
  email: string | null;
  telefone: string | null;
  tema: TemaProps;
  logotipo_url: string | null;
  logotipo_path: string | null;
  config: RedeConfig;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type RedeModelData = {
  id: string;
  nome: string;
  razao_social: string | null;
  cnpj: string | null;
  slug: string | null;
  email: string | null;
  telefone: string | null;
  tema: TemaProps;
  logotipo_url: string | null;
  logotipo_path: string | null;
  config: RedeConfig;
};

export const REDE_COLUMNS =
  'id, nome, razao_social, cnpj, slug, email, telefone, tema, logotipo_url, logotipo_path, config, ativo, created_at, updated_at';

export type UnidadeModel = {
  id: string;
  rede_id: string;
  nome: string;
  cnes: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  timezone: string;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type UnidadeModelData = {
  id: string;
  rede_id: string;
  nome: string;
  cnes: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  timezone: string;
  observacoes: string | null;
  ativo: boolean;
};

export const UNIDADE_COLUMNS =
  'id, rede_id, nome, cnes, cnpj, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, uf, timezone, observacoes, ativo, created_at, updated_at, deleted_at';
