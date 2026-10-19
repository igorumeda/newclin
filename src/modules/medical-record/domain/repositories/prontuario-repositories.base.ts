import type { StatusAtendimento } from '../entities/atendimento.entity';
import type { Anexo } from '../entities/anexo.entity';
import type { Atendimento } from '../entities/atendimento.entity';
import type { Evolucao } from '../entities/evolucao.entity';
import type { TemplateProntuario } from '../entities/template-prontuario.entity';
import type {
  AnexoId,
  AtendimentoId,
  IAnexoRepository,
  IAtendimentoRepository,
  IEvolucaoRepository,
  ITemplateProntuarioRepository,
  ListarAnexosFiltro,
  ListarAtendimentosFiltro,
  ListarAtendimentosResultado,
  ListarTemplatesFiltro,
  TemplateId,
} from './prontuario-repositories.interface';

export abstract class TemplateProntuarioRepository implements ITemplateProntuarioRepository {
  abstract findById(id: TemplateId): Promise<TemplateProntuario | null>;
  abstract listar(filtro: ListarTemplatesFiltro): Promise<TemplateProntuario[]>;
  abstract listarEspecialidades(redeId: string): Promise<string[]>;
  abstract save(template: TemplateProntuario): Promise<void>;
  abstract update(template: TemplateProntuario): Promise<void>;
  abstract existsByNome(params: {
    redeId: string;
    nome: string;
    ignorarId?: string | null;
  }): Promise<boolean>;
}

export abstract class AtendimentoRepository implements IAtendimentoRepository {
  abstract findById(id: AtendimentoId): Promise<Atendimento | null>;
  abstract findByAgendamentoId(agendamentoId: string): Promise<Atendimento | null>;
  abstract listar(filtro: ListarAtendimentosFiltro): Promise<ListarAtendimentosResultado>;
  abstract save(atendimento: Atendimento): Promise<void>;
  abstract update(atendimento: Atendimento): Promise<void>;
  abstract listarPorPaciente(params: {
    redeId: string;
    pacienteId: string;
    limite?: number;
  }): Promise<Atendimento[]>;
}

export abstract class EvolucaoRepository implements IEvolucaoRepository {
  abstract listarPorAtendimento(atendimentoId: AtendimentoId): Promise<Evolucao[]>;
  abstract save(evolucao: Evolucao): Promise<void>;
}

export abstract class AnexoRepository implements IAnexoRepository {
  abstract findById(id: AnexoId): Promise<Anexo | null>;
  abstract listar(filtro: ListarAnexosFiltro): Promise<Anexo[]>;
  abstract save(anexo: Anexo): Promise<void>;
  abstract softDelete(id: AnexoId): Promise<void>;
}

/** Tipos reexportados para conveniência dos adaptadores de persistência. */
export type { StatusAtendimento, Anexo, Atendimento, Evolucao, TemplateProntuario };
