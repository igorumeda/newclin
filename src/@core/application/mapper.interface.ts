export interface IMapper<Input, Output> {
  map(input: Input): Output;
}
