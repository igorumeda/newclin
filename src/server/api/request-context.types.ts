export type AppRole = 'admin_rede' | 'gestor_unidade' | 'profissional' | 'recepcao';

export const APP_ROLES: AppRole[] = ['admin_rede', 'gestor_unidade', 'profissional', 'recepcao'];

export type RequestContext = {
  userId: string;
  userName: string;
  userEmail: string;
  role: AppRole;
  redeId: string;
  unidadesAcesso: string[];
  profissionalId: string | null;
  ip: string | null;
  userAgent: string | null;
};

export type HttpRequestPayload = {
  body: unknown;
  query: URLSearchParams;
  params: Record<string, string>;
};

export type AuditRequestOptions = {
  action: 'criar' | 'atualizar' | 'excluir' | 'ler' | 'logout' | 'exportar' | 'emitir' | 'cancelar' | 'processar';
  entity: string;
  description?: string;
};
