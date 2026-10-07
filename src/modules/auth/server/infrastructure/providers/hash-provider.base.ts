import type {
  CompareHashParams,
  HashParams,
  IHashProvider,
} from '../../../domain/services/hash-provider.interface';

export abstract class HashProvider implements IHashProvider {
  abstract hash(params: HashParams): Promise<string>;
  abstract compare(params: CompareHashParams): Promise<boolean>;
}
