import type { Profissional } from '../entities/profissional.entity';
import type { HorarioAtendimento } from '../entities/horario-atendimento.entity';
import type {
  IProfissionalRepository,
  ListarProfissionaisFiltro,
  ProfissionalId,
  SalvarHorariosParams,
} from './profissional-repository.interface';

export abstract class ProfissionalRepository implements IProfissionalRepository {
  abstract findById(id: ProfissionalId): Promise<Profissional | null>;
  abstract listar(filtro: ListarProfissionaisFiltro): Promise<Profissional[]>;
  abstract save(profissional: Profissional): Promise<void>;
  abstract update(profissional: Profissional): Promise<void>;
  abstract existsByRegistro(params: {
    redeId: string;
    conselhoClasse: string;
    numeroConselho: string;
    ufConselho: string | null;
    ignorarId?: string;
  }): Promise<boolean>;
  abstract listarUnidades(params: { profissionalId: string }): Promise<string[]>;
  abstract definirUnidades(params: {
    redeId: string;
    profissionalId: string;
    unidadeIds: string[];
  }): Promise<void>;
  abstract listarHorarios(params: {
    profissionalId: string;
    unidadeId?: string | null;
  }): Promise<HorarioAtendimento[]>;
  abstract salvarHorarios(params: SalvarHorariosParams): Promise<void>;
  abstract removerHorarios(params: { profissionalId: string; unidadeId: string }): Promise<void>;
}
