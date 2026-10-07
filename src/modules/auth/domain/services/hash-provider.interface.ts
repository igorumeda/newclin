export type HashParams = { plain: string };
export type CompareHashParams = { plain: string; hashed: string };

export interface IHashProvider {
  hash(params: HashParams): Promise<string>;
  compare(params: CompareHashParams): Promise<boolean>;
}

export const HASH_PROVIDER = Symbol('IHashProvider');
