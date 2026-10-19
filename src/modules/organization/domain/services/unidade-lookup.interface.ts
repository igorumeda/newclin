/**
 * Read model de unidade exposto para outros bounded contexts (agenda, prontuário,
 * documentos) via Anti-Corruption Layer — módulos não acessam o domínio alheio.
 */
export type UnidadeResumo = {
  id: string;
  nome: string;
  cnes: string | null;
  telefone: string | null;
  email: string | null;
  enderecoCompleto: string;
  timezone: string;
  ativo: boolean;
};

export interface IUnidadeLookup {
  findById(unidadeId: string): Promise<UnidadeResumo | null>;
  listarAtivas(redeId: string, unidadeIds?: string[]): Promise<UnidadeResumo[]>;
}

export const UNIDADE_LOOKUP = Symbol('IUnidadeLookup');
