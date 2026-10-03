/**
 * DTOs do módulo, agrupados por recurso.
 * Cada caso de uso consome tipos nomeados próprios (`ObterOrganizacaoOutputDto`,
 * `CriarUnidadeInputDto`, ...), declarados neste arquivo para manter a
 * proximidade do contrato sem multiplicar arquivos triviais.
 */
import type { TemaCores, TemaPreset } from '../../domain/value-objects/tema.vo';
import type { RedeConfig, RedeConfigParcial } from '../../domain/entities/rede.entity';
import type { EnderecoProps } from '../../domain/value-objects/endereco.vo';

// ── Organização (rede) ──────────────────────────────────────────────────────
export type ObterOrganizacaoInputDto = { redeId: string };

export type TemaDto = {
  preset: string;
  light: TemaCores;
  dark: TemaCores;
};

export type OrganizacaoDto = {
  id: string;
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  slug: string | null;
  email: string | null;
  telefone: string | null;
  tema: TemaDto;
  logotipoUrl: string | null;
  logotipoPath: string | null;
  config: RedeConfig;
};

export type ObterOrganizacaoOutputDto = OrganizacaoDto;

export type AtualizarOrganizacaoInputDto = {
  redeId: string;
  nome?: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  slug?: string | null;
  email?: string | null;
  telefone?: string | null;
  config?: RedeConfigParcial;
};

export type AtualizarOrganizacaoOutputDto = OrganizacaoDto;

export type AtualizarTemaInputDto = {
  redeId: string;
  preset?: string;
  coresLight?: Partial<TemaCores>;
  coresDark?: Partial<TemaCores>;
};

export type AtualizarTemaOutputDto = { tema: TemaDto; presets: TemaPreset[] };

export type DefinirLogotipoInputDto = {
  redeId: string;
  arquivo: {
    nome: string;
    mimeType: string;
    tamanhoBytes: number;
    conteudo: Uint8Array;
  } | null;
  remover?: boolean;
};

export type DefinirLogotipoOutputDto = { logotipoUrl: string | null; logotipoPath: string | null };

// ── Unidades ────────────────────────────────────────────────────────────────
export type UnidadeDto = {
  id: string;
  redeId: string;
  nome: string;
  cnes: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  endereco: EnderecoProps;
  enderecoFormatado: string;
  timezone: string;
  observacoes: string | null;
  ativo: boolean;
  createdAt: string;
};

export type ListarUnidadesInputDto = {
  redeId: string;
  unidadeIdsRestritas?: string[];
  busca?: string | null;
  ativo?: boolean | null;
};

export type ListarUnidadesOutputDto = { items: UnidadeDto[] };

export type CriarUnidadeInputDto = {
  redeId: string;
  nome: string;
  cnes?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: Partial<EnderecoProps>;
  timezone?: string;
  observacoes?: string | null;
};

export type CriarUnidadeOutputDto = UnidadeDto;

export type AtualizarUnidadeInputDto = {
  unidadeId: string;
  nome?: string;
  cnes?: string | null;
  cnpj?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: Partial<EnderecoProps>;
  timezone?: string;
  observacoes?: string | null;
};

export type AtualizarUnidadeOutputDto = UnidadeDto;

export type InativarUnidadeInputDto = { unidadeId: string; reativar?: boolean };

export type InativarUnidadeOutputDto = UnidadeDto;
