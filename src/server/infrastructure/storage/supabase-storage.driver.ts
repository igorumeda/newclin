import type { SupabaseClient } from '@supabase/supabase-js';

export type StorageUploadParams = {
  bucket: string;
  caminho: string;
  conteudo: ArrayBuffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
};

export type SignedUrlParams = {
  bucket: string;
  caminho: string;
  expiraEmSegundos: number;
};

/**
 * Driver único do Supabase Storage (§4.3). Os providers de cada módulo herdam
 * dele e expõem apenas a operação que o seu domínio precisa.
 */
export class SupabaseStorageDriver {
  private readonly client: SupabaseClient;
  /** Cliente `service_role` usado como fallback na emissão de URLs assinadas. */
  private readonly privilegedClient?: SupabaseClient;

  constructor(params: { client: SupabaseClient; privilegedClient?: SupabaseClient }) {
    this.client = params.client;
    this.privilegedClient = params.privilegedClient;
  }

  async upload(params: StorageUploadParams): Promise<void> {
    const { error } = await this.client.storage.from(params.bucket).upload(params.caminho, params.conteudo, {
      contentType: params.contentType,
      upsert: params.upsert ?? false,
    });

    if (error) throw new Error(`Falha ao enviar arquivo: ${error.message}`);
  }

  async remover(params: { bucket: string; caminho: string }): Promise<void> {
    const { error } = await this.client.storage.from(params.bucket).remove([params.caminho]);
    if (error) throw new Error(`Falha ao remover arquivo: ${error.message}`);
  }

  async urlAssinada(params: SignedUrlParams): Promise<string | null> {
    const tentativa = await this.client.storage
      .from(params.bucket)
      .createSignedUrl(params.caminho, params.expiraEmSegundos);

    if (!tentativa.error) return tentativa.data?.signedUrl ?? null;
    if (!this.privilegedClient) return null;

    const alternativa = await this.privilegedClient.storage
      .from(params.bucket)
      .createSignedUrl(params.caminho, params.expiraEmSegundos);

    return alternativa.error ? null : (alternativa.data?.signedUrl ?? null);
  }

  public urlPublica(params: { bucket: string; caminho: string }): string {
    return this.client.storage.from(params.bucket).getPublicUrl(params.caminho).data.publicUrl;
  }
}
