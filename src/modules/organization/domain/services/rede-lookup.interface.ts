/**
 * Read model da rede (tenant) para outros contextos: cabeçalho de documentos,
 * variáveis de mensagens e tema aplicado na interface.
 */
export type RedeResumo = {
  id: string;
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  logotipoUrl: string | null;
  tema: {
    preset: string;
    light: Record<string, string>;
    dark: Record<string, string>;
  };
};

export interface IRedeLookup {
  findById(redeId: string): Promise<RedeResumo | null>;
}

export const REDE_LOOKUP = Symbol('IRedeLookup');
