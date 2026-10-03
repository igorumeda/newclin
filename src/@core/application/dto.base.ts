/**
 * Contrato mínimo de DTO. DTOs de entrada e saída do sistema são types nomeados
 * — esta base existe para padronizar contratos genéricos de transporte.
 */
export abstract class Dto {
  public abstract toPrimitives(): Record<string, unknown>;
}
