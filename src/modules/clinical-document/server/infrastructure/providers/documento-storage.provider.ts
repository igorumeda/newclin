import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageDriver } from '@/server/infrastructure/storage/supabase-storage.driver';
import {
  STORAGE_BUCKET_DOCUMENTS,
  STORAGE_SIGNED_URL_TTL_SECONDS,
} from '@/shared/constants/upload.constants';
import type {
  DocumentoUploadResultado,
  IDocumentoStorage,
} from './documento-storage.provider.types';

export type DocumentoStorageProviderDependencies = {
  supabase: SupabaseClient;
  serviceClient?: SupabaseClient;
};

/** PDFs emitidos no bucket privado `documentos` (§3.6, §4.3). */
export class DocumentoStorageProvider implements IDocumentoStorage {
  private readonly driver: SupabaseStorageDriver;

  constructor(dependencies: DocumentoStorageProviderDependencies) {
    this.driver = new SupabaseStorageDriver({
      client: dependencies.supabase,
      privilegedClient: dependencies.serviceClient,
    });
  }

  async upload(params: {
    caminho: string;
    conteudo: Uint8Array;
    mimeType: string;
  }): Promise<DocumentoUploadResultado> {
    await this.driver.upload({
      bucket: STORAGE_BUCKET_DOCUMENTS,
      caminho: params.caminho,
      conteudo: params.conteudo,
      contentType: params.mimeType,
    });

    return { bucket: STORAGE_BUCKET_DOCUMENTS, caminho: params.caminho };
  }

  async urlAssinada(params: { caminho: string; expiraEmSegundos?: number }): Promise<string | null> {
    return this.driver.urlAssinada({
      bucket: STORAGE_BUCKET_DOCUMENTS,
      caminho: params.caminho,
      expiraEmSegundos: params.expiraEmSegundos ?? STORAGE_SIGNED_URL_TTL_SECONDS,
    });
  }

  async remover(params: { caminho: string }): Promise<void> {
    await this.driver.remover({ bucket: STORAGE_BUCKET_DOCUMENTS, caminho: params.caminho });
  }
}
