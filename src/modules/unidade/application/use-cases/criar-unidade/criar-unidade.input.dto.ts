import type { CriarEnderecoParams } from '../../../domain/value-objects/endereco.vo';

export type CriarUnidadeInputDto = {
  redeId: string;
  nome: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: CriarEnderecoParams;
  fusoHorario?: string;
};
