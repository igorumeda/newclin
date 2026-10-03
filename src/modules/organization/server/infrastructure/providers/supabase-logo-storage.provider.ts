import type { SupabaseClient } from '@supabase/supabase-js';
import { LogoStorageProvider } from './logo-storage-provider.base';
import type {
  LogoPublicUrlParams,
  LogoRemoveParams,
  LogoUploadParams,
} from '../../../domain/services/logo-storage.interface';

export type SupabaseLogoStorageProviderDependencies = {
  serviceClient: SupabaseClient;
  bucket: string;
};

/** Logotipos ficam no bucket público `logos`, organizados por `{rede_id}/`. */
export class SupabaseLogoStorageProvider extends LogoStorageProvider {
  private readonly serviceClient: SupabaseClient;
  private readonly bucket: string;

  constructor(dependencies: SupabaseLogoStorageProviderDependencies) {
    super();
    this.serviceClient = dependencies.serviceClient;
    this.bucket = dependencies.bucket;
  }

  async upload(params: LogoUploadParams): Promise<void> {
    const { error } = await this.serviceClient.storage
      .from(this.bucket)
      .upload(params.path, params.conteudo, { contentType: params.mimeType, upsert: true });

    if (error) throw new Error(`Falha ao enviar logotipo: ${error.message}`);
  }

  async remove(params: LogoRemoveParams): Promise<void> {
    const { error } = await this.serviceClient.storage.from(this.bucket).remove([params.path]);
    if (error) throw new Error(`Falha ao remover logotipo: ${error.message}`);
  }

  publicUrl(params: LogoPublicUrlParams): string {
    const { data } = this.serviceClient.storage.from(this.bucket).getPublicUrl(params.path);
    return data.publicUrl;
  }
}
