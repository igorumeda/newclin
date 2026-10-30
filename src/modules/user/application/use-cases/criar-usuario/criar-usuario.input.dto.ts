export type CriarUsuarioInputDto = {
  redeId: string | null;
  nome: string;
  email: string;
  role?: string;
  telefone?: string | null;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
  senhaInicial?: string | null;
  appUrl: string;
};
