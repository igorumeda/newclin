import type { Paciente } from '../entities/paciente.entity';
import type { PacienteDuplicadoDetalhe } from '../errors/paciente.errors';

export type PacienteId = string;

export type BuscarPacientesFiltro = {
  redeId: string;
  /** Nome parcial (case/acento-insensível) ou CPF exato (§3.3). */
  termo?: string | null;
  somenteAtivos?: boolean;
  /** Restringe aos pacientes com agenda/anexo na unidade (perfis de unidade). */
  unidadeId?: string | null;
  page: number;
  perPage: number;
};

export type BuscarPacientesResultado = {
  items: Paciente[];
  total: number;
};

export type VerificarDuplicidadeParams = {
  redeId: string;
  cpf: string;
  nome: string;
  dataNascimento: string;
  ignorarId?: string | null;
};

export interface IPacienteRepository {
  findById(id: PacienteId): Promise<Paciente | null>;
  buscar(filtro: BuscarPacientesFiltro): Promise<BuscarPacientesResultado>;
  buscarPorIds(ids: PacienteId[]): Promise<Paciente[]>;
  save(paciente: Paciente): Promise<void>;
  update(paciente: Paciente): Promise<void>;
  existePorCpf(params: { redeId: string; cpf: string; ignorarId?: string | null }): Promise<boolean>;
  /** Base da detecção de duplicidade (CPF ou nome + data de nascimento). */
  verificarDuplicidade(params: VerificarDuplicidadeParams): Promise<PacienteDuplicadoDetalhe[]>;
  /** Exportação LGPD via função `exportar_dados_paciente` (§5). */
  exportarDados(pacienteId: PacienteId): Promise<Record<string, unknown> | null>;
}

export const PACIENTE_REPOSITORY = Symbol('IPacienteRepository');
