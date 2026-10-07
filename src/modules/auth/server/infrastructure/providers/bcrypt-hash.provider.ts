import bcrypt from 'bcryptjs';
import { HashProvider } from './hash-provider.base';
import type {
  CompareHashParams,
  HashParams,
} from '../../../domain/services/hash-provider.interface';

export type BcryptHashProviderDependencies = { saltRounds?: number };

export class BcryptHashProvider extends HashProvider {
  private readonly saltRounds: number;

  constructor(dependencies: BcryptHashProviderDependencies = {}) {
    super();
    this.saltRounds = dependencies.saltRounds ?? 10;
  }

  async hash({ plain }: HashParams): Promise<string> {
    return bcrypt.hash(plain, this.saltRounds);
  }

  async compare({ plain, hashed }: CompareHashParams): Promise<boolean> {
    if (!plain || !hashed) return false;
    return bcrypt.compare(plain, hashed);
  }
}
