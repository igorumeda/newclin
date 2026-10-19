import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStorageDriver } from '@/server/infrastructure/storage/supabase-storage.driver';
import {
  MAX_UPLOAD_SIZE_BYTES,
  STORAGE_BUCKET_ATTACHMENTS,
  STORAGE_SIGNED_URL_TTL_SECONDS,
} from '@/shared/constants/upload.constants';
import type {
  AnexoStorageHealth,
  IAnexoStorage,
  UploadAnexoParams,
  UploadAnexoResultado,
} from '../../../domain/services/anexo-storage.interface';

export type AnexoStorageProviderDependencies = {
  supabase: SupabaseClient;
  serviceClient?: SupabaseClient;
};

/** Anexos do prontuário no bucket privado `anexos` (§3.5, §4.3). */
export class AnexoStorageProvider implements IAnexoStorage {
  private readonly driver: SupabaseStorageDriver;

  constructor(dependencies: AnexoStorageProviderDependencies) {
    this.driver = new SupabaseStorageDriver({
      client: dependencies.supabase,
      privilegedClient: dependencies.serviceClient,
    });
  }

  async upload(params: UploadAnexoParams): Promise<UploadAnexoResultado> {
    await this.driver.upload({
      bucket: STORAGE_BUCKET_ATTACHMENTS,
      caminho: params.caminho,
      conteudo: params.conteudo,
      contentType: params.mimeType,
      upsert: params.upsert ?? false,
    });

    return { bucket: STORAGE_BUCKET_ATTACHMENTS, caminho: params.caminho };
  }

  async remover(params: { caminho: string }): Promise<void> {
    await this.driver.remover({ bucket: STORAGE_BUCKET_ATTACHMENTS, caminho: params.caminho });
  }

  async urlAssinada(params: { caminho: string; expiraEmSegundos?: number }): Promise<string | null> {
    return this.driver.urlAssinada({
      bucket: STORAGE_BUCKET_ATTACHMENTS,
      caminho: params.caminho,
      expiraEmSegundos: params.expiraEmSegundos ?? STORAGE_SIGNED_URL_TTL_SECONDS,
    });
  }

  health(): AnexoStorageHealth {
    return {
      bucket: STORAGE_BUCKET_ATTACHMENTS,
      configurado: true,
      motivo: `Bucket privado, limite de ${MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)} MB por arquivo`,
    };
  }
}
