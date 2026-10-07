export type CriarProfissionalInputDto = {
  redeId: string;
  nome: string;
  cpf?: string | null;
  email?: string | null;
  telefone?: string | null;
  conselho: string;
  numeroConselho: string;
  ufConselho?: string | null;
  especialidade: string;
  corAgenda?: string;
  unidades?: string[];
};
