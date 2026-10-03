import { Result } from '@core/domain/result';
import { JanelaHorario } from '../value-objects/janela-horario.vo';

export type SlotDisponivelParams = {
  /** Faixas de atendimento do profissional no dia (já no fuso convertido para UTC). */
  faixasAtendimento: { inicio: Date; fim: Date; duracaoSlotMinutos: number; intervaloMinutos: number }[];
  ocupados: { inicio: Date; fim: Date; encaixe?: boolean }[];
  bloqueios: { inicio: Date; fim: Date }[];
  /** Duração do tipo de atendimento escolhido (min). */
  duracaoMinutos: number;
  /** Instante considerado "agora" — slots passados não são oferecidos por padrão. */
  referencia?: Date;
  incluirPassados?: boolean;
};

export type SlotDisponivel = {
  inicio: string;
  fim: string;
  disponivel: boolean;
  motivoIndisponibilidade: 'ocupado' | 'bloqueado' | 'passado' | null;
};

/**
 * Serviço de domínio que calcula os horários livres da agenda (§3.4).
 * Puro: recebe faixas/ocupações em UTC e devolve os slots com o motivo de cada
 * indisponibilidade — usado tanto no formulário de agendamento quanto na UI.
 */
export class SlotAgendaService {
  public gerar(params: SlotDisponivelParams): Result<SlotDisponivel[]> {
    if (params.duracaoMinutos <= 0) {
      return Result.fail(new Error('Duração do atendimento deve ser maior que zero'));
    }

    const slots: SlotDisponivel[] = [];
    const referencia = params.referencia ?? new Date();

    for (const faixa of params.faixasAtendimento) {
      const passo = faixa.duracaoSlotMinutos + (faixa.intervaloMinutos ?? 0);
      let cursor = new Date(faixa.inicio.getTime());

      while (cursor.getTime() + params.duracaoMinutos * 60000 <= faixa.fim.getTime()) {
        const fim = new Date(cursor.getTime() + params.duracaoMinutos * 60000);
        const janela = JanelaHorario.reconstitute({ inicio: cursor, fim });

        const motivo = this.identificarIndisponibilidade({
          janela,
          ocupados: params.ocupados,
          bloqueios: params.bloqueios,
          referencia,
          incluirPassados: params.incluirPassados ?? false,
        });

        slots.push({
          inicio: janela.inicio.toISOString(),
          fim: janela.fim.toISOString(),
          disponivel: motivo === null,
          motivoIndisponibilidade: motivo,
        });

        cursor = new Date(cursor.getTime() + passo * 60000);
      }
    }

    return Result.ok(this.deduplicar(slots));
  }

  private identificarIndisponibilidade(params: {
    janela: JanelaHorario;
    ocupados: { inicio: Date; fim: Date }[];
    bloqueios: { inicio: Date; fim: Date }[];
    referencia: Date;
    incluirPassados: boolean;
  }): SlotDisponivel['motivoIndisponibilidade'] {
    if (!params.incluirPassados && params.janela.fim.getTime() <= params.referencia.getTime()) {
      return 'passado';
    }

    const bloqueado = params.bloqueios.some(
      (bloqueio) => params.janela.inicio < bloqueio.fim && params.janela.fim > bloqueio.inicio,
    );
    if (bloqueado) return 'bloqueado';

    const ocupado = params.ocupados.some(
      (ocupacao) => params.janela.inicio < ocupacao.fim && params.janela.fim > ocupacao.inicio,
    );
    if (ocupado) return 'ocupado';

    return null;
  }

  private deduplicar(slots: SlotDisponivel[]): SlotDisponivel[] {
    const porInicio = new Map<string, SlotDisponivel>();
    for (const slot of slots) {
      const existente = porInicio.get(slot.inicio);
      if (!existente || (existente.disponivel === false && slot.disponivel)) {
        porInicio.set(slot.inicio, slot);
      }
    }

    return [...porInicio.values()].sort((a, b) => a.inicio.localeCompare(b.inicio));
  }
}
