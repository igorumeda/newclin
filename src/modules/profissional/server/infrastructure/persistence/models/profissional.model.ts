export type ProfissionalModel = {
  id: string;
  rede_id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  conselho_classe: string;
  numero_conselho: string;
  uf_conselho: string | null;
  especialidade: string;
  cor_agenda: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
  unidades: string[] | null;
};

export type ProfissionalModelData = {
  id: string;
  rede_id: string;
  nome: string;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  conselho_classe: string;
  numero_conselho: string;
  uf_conselho: string | null;
  especialidade: string;
  cor_agenda: string;
  ativo: boolean;
};

export type HorarioAtendimentoModel = {
  id: string;
  rede_id: string;
  profissional_id: string;
  unidade_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
  created_at: Date;
  updated_at: Date;
};
