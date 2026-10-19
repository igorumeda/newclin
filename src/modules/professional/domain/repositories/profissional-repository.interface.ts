import type { Profissional } from '../entities/profissional.entity';
import type { HorarioAtendimento } from '../entities/horario-atendimento.entity';
import type { CreateHorarioAtendimentoParams } from '../entities/horario-atendimento.entity';

export type ProfissionalId = string;

export type ListarProfissionaisFiltro = {
  redeId: string;
  busca?: string | null;
  especialidade?: string | null;
  unidadeId?: string | null;
  ativo?: boolean | null;
};

export type SalvarHorariosParams = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  horarios: CreateHorarioAtendimentoParams[];
};

export interface IProfissionalRepository {
  findById(id: ProfissionalId): Promise<Profissional | null>;
  listar(filtro: ListarProfissionaisFiltro): Promise<Profissional[]>;
  save(profissional: Profissional): Promise<void>;
  update(profissional: Profissional): Promise<void>;
  existsByRegistro(params: {
    redeId: string;
    conselhoClasse: string;
    numeroConselho: string;
    ufConselho: string | null;
    ignorarId?: string;
  }): Promise<boolean>;
  listarUnidades(params: { profissionalId: string }): Promise<string[]>;
  definirUnidades(params: { redeId: string; profissionalId: string; unidadeIds: string[] }): Promise<void>;
  listarHorarios(params: { profissionalId: string; unidadeId?: string | null }): Promise<HorarioAtendimento[]>;
  salvarHorarios(params: SalvarHorariosParams): Promise<void>;
  removerHorarios(params: { profissionalId: string; unidadeId: string }): Promise<void>;
}

export const PROFISSIONAL_REPOSITORY = Symbol('IProfissionalRepository');
