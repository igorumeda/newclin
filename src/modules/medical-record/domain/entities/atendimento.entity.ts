import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { DadosProntuario } from '../value-objects/dados-prontuario.vo';
import type { DadosPreenchidos, ValorCampo } from '../value-objects/dados-prontuario.vo';
import type { EstruturaTemplate } from '../value-objects/estrutura-template.vo';
import {
  AtendimentoFinalizadoError,
  DadosInvalidosError,
  InvalidProntuarioOperationError,
} from '../errors/prontuario.errors';

export type StatusAtendimento = 'em_andamento' | 'finalizado' | 'cancelado';
export type FontePagadora = 'publico' | 'particular' | 'convenio';

export const FONTE_PAGADORA_LABELS: Record<FontePagadora, string> = {
  publico: 'Público',
  particular: 'Particular',
  convenio: 'Convênio',
};

export type CamposFixos = {
  queixaPrincipal: string | null;
  anamnese: string | null;
  exameFisico: string | null;
  hipoteseDiagnostica: string | null;
  cid: string | null;
  conduta: string | null;
};

export type AtendimentoProps = CamposFixos & {
  redeId: string;
  unidadeId: string;
  agendamentoId: string | null;
  pacienteId: string;
  profissionalId: string;
  templateId: string | null;
  templateVersao: number | null;
  tipoAtendimentoId: string | null;
  dadosPreenchidos: DadosProntuario;
  fontePagadora: FontePagadora;
  status: StatusAtendimento;
  iniciadoEm: Date;
  finalizadoEm: Date | null;
  finalizadoPor: string | null;
  canceladoEm: Date | null;
  motivoCancelamento: string | null;
  createdBy: string | null;
};

export type AtendimentoConstructorParams = EntityConstructorParams<AtendimentoProps>;

export type CreateAtendimentoParams = {
  redeId: string;
  unidadeId: string;
  pacienteId: string;
  profissionalId: string;
  agendamentoId?: string | null;
  tipoAtendimentoId?: string | null;
  templateId?: string | null;
  templateVersao?: number | null;
  fontePagadora?: FontePagadora;
  camposFixos?: Partial<CamposFixos>;
  dadosPreenchidos?: DadosPreenchidos;
  createdBy?: string | null;
};

export type AtualizarRascunhoParams = {
  camposFixos?: Partial<CamposFixos>;
  dadosPreenchidos?: DadosPreenchidos;
  fontePagadora?: FontePagadora;
  templateId?: string | null;
  templateVersao?: number | null;
};

/**
 * Atendimento = entrada do prontuário (§3.5).
 * Campos fixos + dados do template em JSON versionado. Depois de finalizado,
 * torna-se imutável no domínio e no banco — correções apenas por adendo.
 */
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
  get tipoAtendimentoId(): string | null {
    return this.props.tipoAtendimentoId;
  }
  get queixaPrincipal(): string | null {
    return this.props.queixaPrincipal;
  }
  get anamnese(): string | null {
    return this.props.anamnese;
  }
  get exameFisico(): string | null {
    return this.props.exameFisico;
  }
  get hipoteseDiagnostica(): string | null {
    return this.props.hipoteseDiagnostica;
  }
  get cid(): string | null {
    return this.props.cid;
  }
  get conduta(): string | null {
    return this.props.conduta;
  }
  get dadosPreenchidos(): DadosProntuario {
    return this.props.dadosPreenchidos;
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
  get finalizadoPor(): string | null {
    return this.props.finalizadoPor;
  }
  get canceladoEm(): Date | null {
    return this.props.canceladoEm;
  }
  get motivoCancelamento(): string | null {
    return this.props.motivoCancelamento;
  }
  get createdBy(): string | null {
    return this.props.createdBy;
  }

  public estaFinalizado(): boolean {
    return this.props.status === 'finalizado';
  }

  public camposFixos(): CamposFixos {
    return {
      queixaPrincipal: this.props.queixaPrincipal,
      anamnese: this.props.anamnese,
      exameFisico: this.props.exameFisico,
      hipoteseDiagnostica: this.props.hipoteseDiagnostica,
      cid: this.props.cid,
      conduta: this.props.conduta,
    };
  }

  public static create(params: CreateAtendimentoParams): Result<Atendimento> {
    const dadosResult = DadosProntuario.create(params.dadosPreenchidos ?? {});
    if (dadosResult.isFailure) return Result.fail(dadosResult.error);

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
          tipoAtendimentoId: params.tipoAtendimentoId ?? null,
          queixaPrincipal: params.camposFixos?.queixaPrincipal ?? null,
          anamnese: params.camposFixos?.anamnese ?? null,
          exameFisico: params.camposFixos?.exameFisico ?? null,
          hipoteseDiagnostica: params.camposFixos?.hipoteseDiagnostica ?? null,
          cid: params.camposFixos?.cid ?? null,
          conduta: params.camposFixos?.conduta ?? null,
          dadosPreenchidos: dadosResult.value,
          fontePagadora: params.fontePagadora ?? 'publico',
          status: 'em_andamento',
          iniciadoEm: new Date(),
          finalizadoEm: null,
          finalizadoPor: null,
          canceladoEm: null,
          motivoCancelamento: null,
          createdBy: params.createdBy ?? null,
        },
      }),
    );
  }

  public static reconstitute(params: AtendimentoConstructorParams): Atendimento {
    return new Atendimento(params);
  }

  /** Salva o rascunho. Aplicável apenas em atendimentos em andamento. */
  public atualizarRascunho(params: AtualizarRascunhoParams): Result<void> {
    const bloqueio = this.garantirEditavel();
    if (bloqueio.isFailure) return Result.fail(bloqueio.error);

    if (params.dadosPreenchidos !== undefined) {
      const dadosResult = DadosProntuario.create(params.dadosPreenchidos);
      if (dadosResult.isFailure) return Result.fail(dadosResult.error);
      this.props.dadosPreenchidos = dadosResult.value;
    }

    if (params.camposFixos) {
      for (const chave of [
        'queixaPrincipal',
        'anamnese',
        'exameFisico',
        'hipoteseDiagnostica',
        'cid',
        'conduta',
      ] as (keyof CamposFixos)[]) {
        const valor = params.camposFixos[chave];
        if (valor !== undefined) {
          this.props[chave] = (valor as ValorCampo as string) ?? null;
        }
      }
    }

    if (params.fontePagadora !== undefined) this.props.fontePagadora = params.fontePagadora;
    if (params.templateId !== undefined) this.props.templateId = params.templateId;
    if (params.templateVersao !== undefined) this.props.templateVersao = params.templateVersao;

    this.touch();
    return Result.ok();
  }

  /**
   * Finaliza o atendimento validando os campos obrigatórios do template e
   * exigindo os campos fixos essenciais (queixa, avaliação e conduta).
   */
  public finalizar(params: {
    por: string;
    estrutura: EstruturaTemplate | null;
  }): Result<void> {
    const bloqueio = this.garantirEditavel();
    if (bloqueio.isFailure) return Result.fail(bloqueio.error);

    const problemas = params.estrutura
      ? this.props.dadosPreenchidos.validar({ estrutura: params.estrutura, exigirObrigatorios: true })
      : [];

    const camposFixosObrigatorios: { chave: keyof CamposFixos; rotulo: string }[] = [
      { chave: 'queixaPrincipal', rotulo: 'Queixa principal' },
      { chave: 'anamnese', rotulo: 'Anamnese' },
      { chave: 'conduta', rotulo: 'Conduta' },
    ];

    for (const campo of camposFixosObrigatorios) {
      const valor = this.props[campo.chave];
      if (!valor || String(valor).trim().length === 0) {
        problemas.push({
          campoId: campo.chave,
          rotulo: campo.rotulo,
          motivo: 'Campo obrigatório não preenchido',
        });
      }
    }

    if (problemas.length > 0) return Result.fail(new DadosInvalidosError({ problemas }));

    this.props.status = 'finalizado';
    this.props.finalizadoEm = new Date();
    this.props.finalizadoPor = params.por;
    this.touch();

    return Result.ok();
  }

  public cancelar(params: { motivo: string }): Result<void> {
    const bloqueio = this.garantirEditavel();
    if (bloqueio.isFailure) return Result.fail(bloqueio.error);

    const motivo = params.motivo?.trim();
    if (!motivo || motivo.length < 3) {
      return Result.fail(new InvalidProntuarioOperationError({ reason: 'Informe o motivo do cancelamento' }));
    }

    this.props.status = 'cancelado';
    this.props.canceladoEm = new Date();
    this.props.motivoCancelamento = motivo;
    this.touch();

    return Result.ok();
  }

  private garantirEditavel(): Result<void> {
    if (this.estaFinalizado()) {
      return Result.fail(new AtendimentoFinalizadoError({ atendimentoId: this.id.toString() }));
    }
    if (this.props.status === 'cancelado') {
      return Result.fail(
        new InvalidProntuarioOperationError({ reason: 'Atendimento cancelado não pode ser alterado' }),
      );
    }
    return Result.ok();
  }
}
