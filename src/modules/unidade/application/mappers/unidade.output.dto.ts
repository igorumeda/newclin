import type { EnderecoProps } from '../../domain/value-objects/endereco.vo';

export type UnidadeOutputDto = {
  id: string;
  redeId: string;
  nome: string;
  codigo: string | null;
  telefone: string | null;
  email: string | null;
  endereco: EnderecoProps;
  enderecoCompleto: string;
  fusoHorario: string;
  ativo: boolean;
};
