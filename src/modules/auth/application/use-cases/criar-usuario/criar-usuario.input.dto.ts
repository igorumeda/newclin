export type CriarUsuarioInputDto = {
  redeId: string;
  nome: string;
  email: string;
  senha: string;
  role: string;
  unidadesAcesso?: string[];
  profissionalId?: string | null;
  telefone?: string | null;
};
