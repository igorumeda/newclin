import type { CriarEnderecoParams } from '../../../domain/value-objects/endereco.vo';

export type AtualizarUnidadeInputDto = {
  redeId: string;
  id: string;
  nome?: string;
  codigo?: string | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: CriarEnderecoParams;
  fusoHorario?: string;
};
