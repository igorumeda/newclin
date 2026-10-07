import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { ProntuarioImutavelError } from '../errors/prontuario-imutavel.error';
import { AtendimentoFinalizadoEvent } from '../events/atendimento-finalizado.event';

export const FONTES_PAGADORAS = ['publico', 'particular', 'convenio'] as const;
export type FontePagadora = (typeof FONTES_PAGADORAS)[number];

export const STATUS_ATENDIMENTO = ['em_andamento', 'finalizado', 'cancelado'] as const;
export type StatusAtendimento = (typeof STATUS_ATENDIMENTO)[number];

/** Campos clínicos fixos exigidos pela spec §3.5, independentes do template. */
export type CamposFixosAtendimento = {
  queixaPrincipal: string | null;
  anamnese: string | null;
  exameFisico: string | null;
  hipoteseDiagnostica: string | null;
  cid10: string | null;
  conduta: string | null;
};

export type ValorCampo = string | number | boolean | string[] | null;
export type DadosPreenchidos = Record<string, ValorCampo>;

export type AtendimentoProps = {
  redeId: string;
  unidadeId: string;
  agendamentoId: string | null;
  pacienteId: string;
  profissionalId: string;
  templateId: string | null;
  templateVersao: number | null;
  dadosPreenchidos: DadosPreenchidos;
  camposFixos: CamposFixosAtendimento;
  fontePagadora: FontePagadora;
  status: StatusAtendimento;
  iniciadoEm: Date;
  finalizadoEm: Date | null;
};

export type AtendimentoConstructorParams = EntityConstructorParams<AtendimentoProps>;
export type ReconstituirAtendimentoParams = AtendimentoConstructorParams & {
  id: NonNullable<AtendimentoConstructorParams['id']>;
};
export type IniciarAtendimentoParams = {
  redeId: string;
  unidadeId: string;
  agendamentoId?: string | null;
  pacienteId: string;
  profissionalId: string;
  templateId?: string | null;
  templateVersao?: number | null;
  fontePagadora?: FontePagadora;
};
export type RegistrarDadosParams = {
  dadosPreenchidos?: DadosPreenchidos;
  camposFixos?: Partial<CamposFixosAtendimento>;
  fontePagadora?: FontePagadora;
};

export const CAMPOS_FIXOS_VAZIOS: CamposFixosAtendimento = {
  queixaPrincipal: null,
  anamnese: null,
  exameFisico: null,
  hipoteseDiagnostica: null,
  cid10: null,
  conduta: null,
};

export class Atendimento extends AggregateRoot<AtendimentoProps> {
  private constructor(params: AtendimentoConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }

  get unidadeId(): string {
    return this.props.unidadeId;
  }

  get agendamentoId(): string | null {
    return this.props.agendamentoId;
  }

  get pacienteId(): string {
    return this.props.pacienteId;
  }

  get profissionalId(): string {
    return this.props.profissionalId;
  }

  get templateId(): string | null {
    return this.props.templateId;
  }

  get templateVersao(): number | null {
    return this.props.templateVersao;
  }

  get dadosPreenchidos(): DadosPreenchidos {
    return this.props.dadosPreenchidos;
  }

  get camposFixos(): CamposFixosAtendimento {
    return this.props.camposFixos;
  }

  get fontePagadora(): FontePagadora {
    return this.props.fontePagadora;
  }

  get status(): StatusAtendimento {
    return this.props.status;
  }

  get iniciadoEm(): Date {
    return this.props.iniciadoEm;
  }

  get finalizadoEm(): Date | null {
    return this.props.finalizadoEm;
  }

  get isFinalizado(): boolean {
    return this.props.status === 'finalizado';
  }

  public static iniciar(params: IniciarAtendimentoParams): Result<Atendimento> {
    return Result.ok(
      new Atendimento({
        props: {
          redeId: params.redeId,
          unidadeId: params.unidadeId,
          agendamentoId: params.agendamentoId ?? null,
          pacienteId: params.pacienteId,
          profissionalId: params.profissionalId,
          templateId: params.templateId ?? null,
          templateVersao: params.templateVersao ?? null,
          dadosPreenchidos: {},
          camposFixos: { ...CAMPOS_FIXOS_VAZIOS },
          fontePagadora: params.fontePagadora ?? 'publico',
          status: 'em_andamento',
          iniciadoEm: new Date(),
          finalizadoEm: null,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirAtendimentoParams): Atendimento {
    return new Atendimento(params);
  }

  public registrarDados(params: RegistrarDadosParams): Result<void> {
    if (this.isFinalizado) {
      return Result.fail(new ProntuarioImutavelError({ atendimentoId: this.id.toString() }));
    }
    if (params.dadosPreenchidos) {
      this.props.dadosPreenchidos = { ...this.props.dadosPreenchidos, ...params.dadosPreenchidos };
    }
    if (params.camposFixos) {
      this.props.camposFixos = { ...this.props.camposFixos, ...params.camposFixos };
    }
    if (params.fontePagadora) this.props.fontePagadora = params.fontePagadora;
    this.touch();
    return Result.ok();
  }

  public finalizar(): Result<void> {
    if (this.isFinalizado) {
      return Result.fail(new ProntuarioImutavelError({ atendimentoId: this.id.toString() }));
    }
    if (this.props.status === 'cancelado') {
      return Result.fail(new Error('Atendimento cancelado não pode ser finalizado'));
    }
    if (!this.props.camposFixos.queixaPrincipal?.trim()) {
      return Result.fail(new Error('Informe a queixa principal antes de finalizar'));
    }
    if (!this.props.camposFixos.conduta?.trim()) {
      return Result.fail(new Error('Informe a conduta antes de finalizar'));
    }

    this.props.status = 'finalizado';
    this.props.finalizadoEm = new Date();
    this.touch();

    this.addDomainEvent(
      new AtendimentoFinalizadoEvent({
        redeId: this.props.redeId,
        atendimentoId: this.id.toString(),
        pacienteId: this.props.pacienteId,
        agendamentoId: this.props.agendamentoId,
      }),
    );
    return Result.ok();
  }

  public cancelar(): Result<void> {
    if (this.isFinalizado) {
      return Result.fail(new ProntuarioImutavelError({ atendimentoId: this.id.toString() }));
    }
    this.props.status = 'cancelado';
    this.touch();
    return Result.ok();
  }
}
