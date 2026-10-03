export type UploadAnexoParams = {
  caminho: string;
  conteudo: ArrayBuffer | Uint8Array;
  mimeType: string;
  upsert?: boolean;
};

export type UploadAnexoResultado = {
  bucket: string;
  caminho: string;
};

export type AnexoStorageHealth = {
  bucket: string;
  configurado: boolean;
  motivo: string | null;
};

/**
 * Porta de armazenamento de anexos (§4.3).
 * A implementação usa o Supabase Storage com bucket privado e URLs assinadas.
 */
export interface IAnexoStorage {
  upload(params: UploadAnexoParams): Promise<UploadAnexoResultado>;
  remover(params: { caminho: string }): Promise<void>;
  urlAssinada(params: { caminho: string; expiraEmSegundos?: number }): Promise<string | null>;
  health(): AnexoStorageHealth;
}

export const ANEXO_STORAGE = Symbol('IAnexoStorage');
