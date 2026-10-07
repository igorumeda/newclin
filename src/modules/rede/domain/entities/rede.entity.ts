import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Cnpj } from '../value-objects/cnpj.vo';
import { Tema } from '../value-objects/tema.vo';
import type { TemaCores } from '../value-objects/tema.vo';

export type RedeConfig = {
  fusoHorario: string;
  lembreteWhatsapp: boolean;
  lembreteEmail: boolean;
  antecedenciaLembreteHoras: number;
  confirmacaoAutomatica: boolean;
};

export const CONFIG_PADRAO: RedeConfig = {
  fusoHorario: 'America/Sao_Paulo',
  lembreteWhatsapp: true,
  lembreteEmail: true,
  antecedenciaLembreteHoras: 24,
  confirmacaoAutomatica: true,
};

export type RedeProps = {
  nome: string;
  slug: string;
  cnpj: Cnpj | null;
  logotipoUrl: string | null;
  tema: Tema;
  config: RedeConfig;
  ativo: boolean;
};

export type RedeConstructorParams = EntityConstructorParams<RedeProps>;
export type ReconstituirRedeParams = RedeConstructorParams & {
  id: NonNullable<RedeConstructorParams['id']>;
};
export type CriarRedeParams = { nome: string; slug: string; cnpj?: string | null };
export type AtualizarRedeParams = {
  nome?: string;
  cnpj?: string | null;
  logotipoUrl?: string | null;
  config?: Partial<RedeConfig>;
};
export type AplicarTemaParams = { cores?: Partial<TemaCores>; preset?: string };

export class Rede extends AggregateRoot<RedeProps> {
  private constructor(params: RedeConstructorParams) {
    super(params);
  }

  get nome(): string {
    return this.props.nome;
  }

  get slug(): string {
    return this.props.slug;
  }

  get cnpj(): Cnpj | null {
    return this.props.cnpj;
  }

  get logotipoUrl(): string | null {
    return this.props.logotipoUrl;
  }

  get tema(): Tema {
    return this.props.tema;
  }

  get config(): RedeConfig {
    return { ...this.props.config };
  }

  get ativo(): boolean {
    return this.props.ativo;
  }

  public static create(params: CriarRedeParams): Result<Rede> {
    if (!params.nome || params.nome.trim().length < 3) {
      return Result.fail(new Error('Nome da rede deve ter no mínimo 3 caracteres'));
    }
    let cnpj: Cnpj | null = null;
    if (params.cnpj) {
      const cnpjResult = Cnpj.create(params.cnpj);
      if (cnpjResult.isFailure) return Result.propagate(cnpjResult);
      cnpj = cnpjResult.value;
    }
    return Result.ok(
      new Rede({
        props: {
          nome: params.nome.trim(),
          slug: params.slug,
          cnpj,
          logotipoUrl: null,
          tema: Tema.padrao(),
          config: { ...CONFIG_PADRAO },
          ativo: true,
        },
      }),
    );
  }

  public static reconstitute(params: ReconstituirRedeParams): Rede {
    return new Rede(params);
  }

  public atualizar(params: AtualizarRedeParams): Result<void> {
    if (params.nome !== undefined) {
      if (params.nome.trim().length < 3) {
        return Result.fail(new Error('Nome da rede deve ter no mínimo 3 caracteres'));
      }
      this.props.nome = params.nome.trim();
    }
    if (params.cnpj !== undefined) {
      if (!params.cnpj) {
        this.props.cnpj = null;
      } else {
        const cnpjResult = Cnpj.create(params.cnpj);
        if (cnpjResult.isFailure) return Result.propagate(cnpjResult);
        this.props.cnpj = cnpjResult.value;
      }
    }
    if (params.logotipoUrl !== undefined) {
      this.props.logotipoUrl = params.logotipoUrl;
    }
    if (params.config) {
      this.props.config = { ...this.props.config, ...params.config };
      if (this.props.config.antecedenciaLembreteHoras < 1) {
        return Result.fail(new Error('Antecedência do lembrete deve ser de ao menos 1 hora'));
      }
    }
    this.touch();
    return Result.ok();
  }

  public aplicarTema(params: AplicarTemaParams): Result<void> {
    const temaResult = Tema.create({
      cores: { ...this.props.tema.cores, ...params.cores },
      preset: params.preset,
    });
    if (temaResult.isFailure) return Result.propagate(temaResult);
    this.props.tema = temaResult.value;
    this.touch();
    return Result.ok();
  }
}
