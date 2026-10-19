import type {
  ILogoStorageProvider,
  LogoPublicUrlParams,
  LogoRemoveParams,
  LogoUploadParams,
} from '../../../domain/services/logo-storage.interface';

export abstract class LogoStorageProvider implements ILogoStorageProvider {
  abstract upload(params: LogoUploadParams): Promise<void>;
  abstract remove(params: LogoRemoveParams): Promise<void>;
  abstract publicUrl(params: LogoPublicUrlParams): string;
}
