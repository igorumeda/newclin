import type { StorageClient } from '@/server/infrastructure/storage/storage-client.base';
import { ArmazenamentoProvider } from './armazenamento-provider.base';
import type {
  ArmazenarArquivoParams,
  ArquivoArmazenado,
  UrlAssinadaParams,
} from '../../../domain/services/armazenamento-provider.interface';

export type StorageArmazenamentoProviderDependencies = { storage: StorageClient };

export class StorageArmazenamentoProvider extends ArmazenamentoProvider {
  private readonly storage: StorageClient;

  constructor(dependencies: StorageArmazenamentoProviderDependencies) {
    super();
    this.storage = dependencies.storage;
  }

  async armazenar(params: ArmazenarArquivoParams): Promise<ArquivoArmazenado> {
    return this.storage.armazenar(params);
  }

  async urlAssinada(params: UrlAssinadaParams): Promise<string> {
    return this.storage.urlAssinada(params);
  }
}
