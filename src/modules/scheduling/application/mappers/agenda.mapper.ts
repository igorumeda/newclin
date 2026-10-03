import { Mapper } from '@core/application/mapper.base';
import { STATUS_LABELS } from '../../domain/value-objects/status-agendamento.vo';
import { TIPO_BLOQUEIO_LABELS } from '../../domain/entities/bloqueio-agenda.entity';
import type { Agendamento } from '../../domain/entities/agendamento.entity';
import type { BloqueioAgenda } from '../../domain/entities/bloqueio-agenda.entity';
import type { TipoAtendimento } from '../../domain/entities/tipo-atendimento.entity';
import type {
  AgendamentoDto,
  BloqueioAgendaDto,
  TipoAtendimentoDto,
} from '../dtos/agenda.dto';

/** Dados externos usados para enriquecer o agendamento na resposta da API. */
export type AgendaEnriquecimento = {
  unidadeNome: string | null;
  profissionalNome: string | null;
  profissionalCorAgenda: string | null;
  profissionalEspecialidade: string | null;
  pacienteNome: string | null;
  pacienteTelefone: string | null;
  pacienteEmail: string | null;
  pacienteCpf: string | null;
  tipoAtendimentoNome: string | null;
  tipoAtendimentoCor: string | null;
  ordemChegada: number | null;
};

export type MapAgendamentoParams = {
  agendamento: Agendamento;
  enriquecimento?: Partial<AgendaEnriquecimento>;
  referencia?: Date;
};

const ENRIQUECIMENTO_VAZIO: AgendaEnriquecimento = {
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
};

export class AgendamentoMapper extends Mapper<MapAgendamentoParams, AgendamentoDto> {
  public map({ agendamento, enriquecimento, referencia }: MapAgendamentoParams): AgendamentoDto {
    const dados = { ...ENRIQUECIMENTO_VAZIO, ...(enriquecimento ?? {}) };
    const momento = referencia ?? new Date();

    return {
      id: agendamento.id.toString(),
      redeId: agendamento.redeId,
      unidadeId: agendamento.unidadeId,
      unidadeNome: dados.unidadeNome,
      profissionalId: agendamento.profissionalId,
      profissionalNome: dados.profissionalNome,
      profissionalCorAgenda: dados.profissionalCorAgenda,
      profissionalEspecialidade: dados.profissionalEspecialidade,
      pacienteId: agendamento.pacienteId,
      pacienteNome: dados.pacienteNome,
      pacienteTelefone: dados.pacienteTelefone,
      pacienteCpf: dados.pacienteCpf,
      tipoAtendimentoId: agendamento.tipoAtendimentoId,
      tipoAtendimentoNome: dados.tipoAtendimentoNome,
      tipoAtendimentoCor: dados.tipoAtendimentoCor,
      inicio: agendamento.janela.inicio.toISOString(),
      fim: agendamento.janela.fim.toISOString(),
      duracaoMinutos: agendamento.janela.duracaoMinutos(),
      status: agendamento.status,
      statusLabel: STATUS_LABELS[agendamento.status],
      encaixe: agendamento.encaixe,
      encaixeJustificativa: agendamento.encaixeJustificativa,
      observacoes: agendamento.observacoes,
      checkInEm: agendamento.checkInEm ? agendamento.checkInEm.toISOString() : null,
      iniciadoEm: agendamento.iniciadoEm ? agendamento.iniciadoEm.toISOString() : null,
      finalizadoEm: agendamento.finalizadoEm ? agendamento.finalizadoEm.toISOString() : null,
      canceladoEm: agendamento.canceladoEm ? agendamento.canceladoEm.toISOString() : null,
      motivoCancelamento: agendamento.motivoCancelamento,
      confirmadoEm: agendamento.confirmadoEm ? agendamento.confirmadoEm.toISOString() : null,
      confirmadoPor: agendamento.confirmadoPor,
      tempoEsperaMinutos: agendamento.tempoDeEsperaMinutos(momento),
      ordemChegada: dados.ordemChegada,
      createdAt: agendamento.createdAt.toISOString(),
    };
  }
}

export type MapTipoAtendimentoParams = { tipo: TipoAtendimento };

export class TipoAtendimentoMapper extends Mapper<MapTipoAtendimentoParams, TipoAtendimentoDto> {
  public map({ tipo }: MapTipoAtendimentoParams): TipoAtendimentoDto {
    return {
      id: tipo.id.toString(),
      redeId: tipo.redeId,
      nome: tipo.nome,
      descricao: tipo.descricao,
      duracaoMinutos: tipo.duracaoMinutos,
      cor: tipo.cor,
      requerConfirmacao: tipo.requerConfirmacao,
      ativo: tipo.ativo,
      createdAt: tipo.createdAt.toISOString(),
    };
  }
}

export type MapBloqueioParams = {
  bloqueio: BloqueioAgenda;
  profissionalNome?: string | null;
  unidadeNome?: string | null;
};

export class BloqueioAgendaMapper extends Mapper<MapBloqueioParams, BloqueioAgendaDto> {
  public map({ bloqueio, profissionalNome = null, unidadeNome = null }: MapBloqueioParams): BloqueioAgendaDto {
    return {
      id: bloqueio.id.toString(),
      redeId: bloqueio.redeId,
      profissionalId: bloqueio.profissionalId,
      profissionalNome,
      unidadeId: bloqueio.unidadeId,
      unidadeNome,
      tipo: bloqueio.tipo,
      tipoLabel: TIPO_BLOQUEIO_LABELS[bloqueio.tipo],
      motivo: bloqueio.motivo,
      inicio: bloqueio.janela.inicio.toISOString(),
      fim: bloqueio.janela.fim.toISOString(),
      diaInteiro: bloqueio.diaInteiro,
      ativo: bloqueio.ativo,
      createdAt: bloqueio.createdAt.toISOString(),
    };
  }
}
