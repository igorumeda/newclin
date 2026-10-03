import type { IUnidadeLookup } from '@/modules/organization/domain/services/unidade-lookup.interface';
import type { IProfissionalLookup } from '@/modules/professional/domain/services/profissional-lookup.interface';
import type { IPacienteLookup } from '@/modules/patient/domain/services/paciente-lookup.interface';
import type { Agendamento } from '../../domain/entities/agendamento.entity';
import type { ITipoAtendimentoRepository } from '../../domain/repositories/tipo-atendimento-repository.interface';
import type { AgendaEnriquecimento } from '../mappers/agenda.mapper';

export type AgendaEnricherDependencies = {
  unidadeLookup: IUnidadeLookup;
  profissionalLookup: IProfissionalLookup;
  pacienteLookup: IPacienteLookup;
  tipoAtendimentoRepository: ITipoAtendimentoRepository;
};

/**
 * Enriquece os agendamentos com nomes/cores para a resposta da API sem N+1:
 * as consultas são agrupadas por entidade (unidades, profissionais, pacientes
 * e tipos de atendimento) antes de montar os DTOs.
 */
export class AgendaEnricher {
  private readonly unidadeLookup: IUnidadeLookup;
  private readonly profissionalLookup: IProfissionalLookup;
  private readonly pacienteLookup: IPacienteLookup;
  private readonly tipoAtendimentoRepository: ITipoAtendimentoRepository;

  constructor(dependencies: AgendaEnricherDependencies) {
    this.unidadeLookup = dependencies.unidadeLookup;
    this.profissionalLookup = dependencies.profissionalLookup;
    this.pacienteLookup = dependencies.pacienteLookup;
    this.tipoAtendimentoRepository = dependencies.tipoAtendimentoRepository;
  }

  async enriquecerLote(params: {
    agendamentos: Agendamento[];
    redeId: string;
  }): Promise<Map<string, AgendaEnriquecimento>> {
    const { agendamentos, redeId } = params;
    const resultado = new Map<string, AgendaEnriquecimento>();

    if (agendamentos.length === 0) return resultado;

    const unidades = new Map(
      (await this.unidadeLookup.listarAtivas(redeId)).map((unidade) => [unidade.id, unidade]),
    );
    const tipos = new Map(
      (await this.tipoAtendimentoRepository.listar({ redeId })).map((tipo) => [
        tipo.id.toString(),
        tipo,
      ]),
    );
    const pacientes = new Map(
      (await this.pacienteLookup.listarPorIds([...new Set(agendamentos.map((item) => item.pacienteId))])).map(
        (paciente) => [paciente.id, paciente],
      ),
    );

    const profissionais = new Map<
      string,
      Awaited<ReturnType<IProfissionalLookup['findById']>>
    >();
    for (const profissionalId of [...new Set(agendamentos.map((item) => item.profissionalId))]) {
      profissionais.set(profissionalId, await this.profissionalLookup.findById(profissionalId));
    }

    // Ordem de chegada: quem fez check-in primeiro aparece antes (§3.4).
    const ordemChegada = new Map<string, number>();
    agendamentos
      .filter((item) => item.checkInEm)
      .sort((a, b) => (a.checkInEm as Date).getTime() - (b.checkInEm as Date).getTime())
      .forEach((item, index) => ordemChegada.set(item.id.toString(), index + 1));

    for (const agendamento of agendamentos) {
      const id = agendamento.id.toString();
      const unidade = unidades.get(agendamento.unidadeId);
      const tipo = agendamento.tipoAtendimentoId ? tipos.get(agendamento.tipoAtendimentoId) : undefined;
      const paciente = pacientes.get(agendamento.pacienteId);
      const profissional = profissionais.get(agendamento.profissionalId);

      resultado.set(id, {
        unidadeNome: unidade?.nome ?? null,
        profissionalNome: profissional?.nome ?? null,
        profissionalCorAgenda: profissional?.corAgenda ?? null,
        profissionalEspecialidade: profissional?.especialidade ?? null,
        pacienteNome: paciente?.nome ?? null,
        pacienteTelefone: paciente?.telefone ?? null,
        pacienteEmail: paciente?.email ?? null,
        pacienteCpf: paciente?.cpfFormatado ?? null,
        tipoAtendimentoNome: tipo?.nome ?? null,
        tipoAtendimentoCor: tipo?.cor ?? null,
        ordemChegada: ordemChegada.get(id) ?? null,
      });
    }

    return resultado;
  }

  async enriquecerUm(params: {
    agendamento: Agendamento;
    redeId: string;
  }): Promise<AgendaEnriquecimento> {
    const mapa = await this.enriquecerLote({
      agendamentos: [params.agendamento],
      redeId: params.redeId,
    });

    return (
      mapa.get(params.agendamento.id.toString()) ?? {
        unidadeNome: null,
        profissionalNome: null,
        profissionalCorAgenda: null,
        profissionalEspecialidade: null,
        pacienteNome: null,
        pacienteTelefone: null,
        pacienteEmail: null,
        pacienteCpf: null,
        tipoAtendimentoNome: null,
        tipoAtendimentoCor: null,
        ordemChegada: null,
      }
    );
  }
}
