export type CriarUsuarioInputDto = {
  redeId: string;
  nome: string;
  email: string;
  role: string;
  telefone?: string | null;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
  appUrl: string;
};
