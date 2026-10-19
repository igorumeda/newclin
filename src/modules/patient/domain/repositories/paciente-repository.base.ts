import type { Paciente } from '../entities/paciente.entity';
import type { PacienteDuplicadoDetalhe } from '../errors/paciente.errors';
import type {
  BuscarPacientesFiltro,
  BuscarPacientesResultado,
  IPacienteRepository,
  PacienteId,
  VerificarDuplicidadeParams,
} from './paciente-repository.interface';

export abstract class PacienteRepository implements IPacienteRepository {
  abstract findById(id: PacienteId): Promise<Paciente | null>;
  abstract buscar(filtro: BuscarPacientesFiltro): Promise<BuscarPacientesResultado>;
  abstract buscarPorIds(ids: PacienteId[]): Promise<Paciente[]>;
  abstract save(paciente: Paciente): Promise<void>;
  abstract update(paciente: Paciente): Promise<void>;
  abstract existePorCpf(params: {
    redeId: string;
    cpf: string;
    ignorarId?: string | null;
  }): Promise<boolean>;
  abstract verificarDuplicidade(params: VerificarDuplicidadeParams): Promise<PacienteDuplicadoDetalhe[]>;
  abstract exportarDados(pacienteId: PacienteId): Promise<Record<string, unknown> | null>;
}
