import { Result } from './result';

export abstract class Factory<Input, Output> {
  abstract create(params: Input): Result<Output>;
}
