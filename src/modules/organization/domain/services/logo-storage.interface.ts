/** Porta de storage para o logotipo da rede (bucket público `logos`). */
export type LogoUploadParams = {
  path: string;
  conteudo: Uint8Array;
  mimeType: string;
};

export type LogoRemoveParams = { path: string };
export type LogoPublicUrlParams = { path: string };

export interface ILogoStorageProvider {
  upload(params: LogoUploadParams): Promise<void>;
  remove(params: LogoRemoveParams): Promise<void>;
  publicUrl(params: LogoPublicUrlParams): string;
}

export const LOGO_STORAGE_PROVIDER = Symbol('ILogoStorageProvider');
