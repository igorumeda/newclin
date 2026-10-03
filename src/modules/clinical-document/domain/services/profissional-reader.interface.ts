export type ProfissionalDocumentoResumo = {
  id: string;
  redeId: string;
  nome: string;
  especialidade: string;
  conselhoClasse: string | null;
  numeroConselho: string | null;
  ufConselho: string | null;
};

/**
 * Leitura pontual do profissional que assina o documento.
 * Não há módulo de profissionais injetado neste contexto (container), então a
 * ACL é resolvida localmente — mesma tabela, mesmas políticas de RLS.
 */
export interface IProfissionalReader {
  findById(profissionalId: string): Promise<ProfissionalDocumentoResumo | null>;
}

export const PROFISSIONAL_READER = Symbol('IProfissionalReader');
