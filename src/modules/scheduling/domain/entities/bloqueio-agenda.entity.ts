import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { JanelaHorario } from '../value-objects/janela-horario.vo';
import { InvalidSchedulingOperationError } from '../errors/agendamento.errors';

export type TipoBloqueio = 'ferias' | 'congresso' | 'almoco' | 'manutencao' | 'outro';

export const TIPOS_BLOQUEIO: TipoBloqueio[] = ['ferias', 'congresso', 'almoco', 'manutencao', 'outro'];

export const TIPO_BLOQUEIO_LABELS: Record<TipoBloqueio, string> = {
  ferias: 'Férias',
  congresso: 'Congresso',
  almoco: 'Almoço',
  manutencao: 'Manutenção',
  outro: 'Outro',
};

export type BloqueioAgendaProps = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  tipo: TipoBloqueio;
  motivo: string | null;
  janela: JanelaHorario;
  diaInteiro: boolean;
  criadoPor: string | null;
  ativo: boolean;
};

export type BloqueioAgendaConstructorParams = EntityConstructorParams<BloqueioAgendaProps>;

export type CreateBloqueioAgendaParams = {
  redeId: string;
  profissionalId: string;
  unidadeId: string;
  tipo?: TipoBloqueio;
  motivo?: string | null;
  inicio: string | Date;
  fim: string | Date;
  diaInteiro?: boolean;
  criadoPor?: string | null;
};

/** Bloqueio de agenda do profissional (férias, almoço, manutenção) — §3.4. */
export class BloqueioAgenda extends AggregateRoot<BloqueioAgendaProps> {
  private constructor(params: BloqueioAgendaConstructorParams) {
    super(params);
  }

  get redeId(): string {
    return this.props.redeId;
  }
  get profissionalId(): string {
    return this.props.profissionalId;
  }
  get unidadeId(): string {
    return this.props.unidadeId;
  }
  get tipo(): TipoBloqueio {
    return this.props.tipo;
  }
  get motivo(): string | null {
    return this.props.motivo;
  }
  get janela(): JanelaHorario {
    return this.props.janela;
  }
  get diaInteiro(): boolean {
    return this.props.diaInteiro;
  }
  get criadoPor(): string | null {
    return this.props.criadoPor;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CreateBloqueioAgendaParams): Result<BloqueioAgenda> {
    const janelaResult = JanelaHorario.create({ inicio: params.inicio, fim: params.fim });
    if (janelaResult.isFailure) return Result.fail(janelaResult.error);

    const tipo = params.tipo ?? 'outro';
    if (!TIPOS_BLOQUEIO.includes(tipo)) {
      return Result.fail(new InvalidSchedulingOperationError({ reason: 'Tipo de bloqueio inválido' }));
    }

    return Result.ok(
      new BloqueioAgenda({
        props: {
          redeId: params.redeId,
          profissionalId: params.profissionalId,
          unidadeId: params.unidadeId,
          tipo,
          motivo: params.motivo ?? null,
          janela: janelaResult.value,
          diaInteiro: params.diaInteiro ?? false,
          criadoPor: params.criadoPor ?? null,
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: BloqueioAgendaConstructorParams): BloqueioAgenda {
    return new BloqueioAgenda(params);
  }

  public remover(): Result<void> {
    if (!this.props.ativo) {
      return Result.fail(new InvalidSchedulingOperationError({ reason: 'Bloqueio já está inativo' }));
    }
    this.props.ativo = false;
    this.touch();
    return Result.ok();
  }

  public conflitaCom(janela: JanelaHorario): boolean {
    if (!this.props.ativo) return false;
    return this.props.janela.conflitaCom(janela);
  }
}
