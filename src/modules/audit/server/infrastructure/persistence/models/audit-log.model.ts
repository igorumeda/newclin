export type AuditLogModel = {
  id: string;
  rede_id: string;
  user_id: string | null;
  user_nome: string | null;
  user_email: string | null;
  user_role: string | null;
  unidade_id: string | null;
  acao: string;
  entidade: string;
  registro_id: string | null;
  descricao: string | null;
  dados_antes: Record<string, unknown> | null;
  dados_depois: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  origem: string;
  created_at: string;
};

export type AuditLogModelData = Omit<AuditLogModel, 'created_at'>;

export const AUDIT_LOG_COLUMNS =
  'id, rede_id, user_id, user_nome, user_email, user_role, unidade_id, acao, entidade, registro_id, descricao, dados_antes, dados_depois, ip, user_agent, origem, created_at';
