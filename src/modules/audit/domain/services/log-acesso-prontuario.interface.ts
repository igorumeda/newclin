/**
 * Porta do log de leitura de dados clínicos exigido pela LGPD (§5).
 * Implementada por um provider de infraestrutura que grava a entrada na trilha
 * de auditoria (`audit_logs`) com ação `ler`.
 */
export type RegistrarAcessoProntuario = (params: {
  pacienteId: string;
  /** Nulo quando o acesso é ao cadastro do paciente, sem atendimento associado. */
  atendimentoId: string | null;
  unidadeId: string | null;
}) => Promise<void>;

export interface ILogAcessoProntuario {
  registrar: RegistrarAcessoProntuario;
}
