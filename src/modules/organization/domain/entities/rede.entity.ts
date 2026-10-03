import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { Tema } from '../value-objects/tema.vo';

export type RedeConfigAgenda = {
  intervaloEntreConsultasMinutos: number;
  antecedenciaMinimaCancelamentoHoras: number;
  permitirEncaixe: boolean;
};

export type RedeConfigNotificacoes = {
  lembreteHabilitado: boolean;
  lembreteHorasAntes: number;
  confirmacaoAutomatica: boolean;
  fallbackEmail: boolean;
};

export type RedeConfigLgpd = {
  exigirConsentimento: boolean;
};

export type RedeConfig = {
  agenda: RedeConfigAgenda;
  notificacoes: RedeConfigNotificacoes;
  lgpd: RedeConfigLgpd;
};

/** Configuração parcial por bloco: o merge preserva os blocos não enviados. */
export type RedeConfigParcial = {
  agenda?: Partial<RedeConfigAgenda>;
  notificacoes?: Partial<RedeConfigNotificacoes>;
  lgpd?: Partial<RedeConfigLgpd>;
};

export type RedeProps = {
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  slug: string | null;
  email: string | null;
  telefone: string | null;
  tema: Tema;
  logotipoUrl: string | null;
  logotipoPath: string | null;
  config: RedeConfig;
  ativo: boolean;
};

export type RedeConstructorParams = EntityConstructorParams<RedeProps>;

export type AtualizarRedeParams = {
  nome?: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  slug?: string | null;
  email?: string | null;
  telefone?: string | null;
  config?: RedeConfigParcial;
};

export type DefinirLogotipoParams = {
  url: string | null;
  path: string | null;
};

export const REDE_CONFIG_PADRAO: RedeConfig = {
  agenda: {
    intervaloEntreConsultasMinutos: 0,
    antecedenciaMinimaCancelamentoHoras: 2,
    permitirEncaixe: true,
  },
  notificacoes: {
    lembreteHabilitado: true,
    lembreteHorasAntes: 24,
    confirmacaoAutomatica: true,
    fallbackEmail: true,
  },
  lgpd: {
    exigirConsentimento: true,
  },
};

/** Rede = tenant do SaaS. Cada rede possui tema, logotipo e configurações próprias. */
export class Rede extends AggregateRoot<RedeProps> {
  private constructor(params: RedeConstructorParams) {
    super(params);
  }

  get nome(): string {
    return this.props.nome;
  }
  get razaoSocial(): string | null {
    return this.props.razaoSocial;
  }
  get cnpj(): string | null {
    return this.props.cnpj;
  }
  get slug(): string | null {
    return this.props.slug;
  }
  get email(): string | null {
    return this.props.email;
  }
  get telefone(): string | null {
    return this.props.telefone;
  }
  get tema(): Tema {
    return this.props.tema;
  }
  get logotipoUrl(): string | null {
    return this.props.logotipoUrl;
  }
  get logotipoPath(): string | null {
    return this.props.logotipoPath;
  }
  get config(): RedeConfig {
    return this.props.config;
  }
  get ativo(): boolean {
    return this.props.ativo;
  }

  public atualizarDados(params: AtualizarRedeParams): Result<void> {
    if (params.nome !== undefined) {
      const nome = params.nome.trim();
      if (nome.length < 3) {
        return Result.fail(new Error('Nome da rede deve ter no mínimo 3 caracteres'));
      }
      this.props.nome = nome;
    }

    if (params.razaoSocial !== undefined) this.props.razaoSocial = params.razaoSocial;
    if (params.slug !== undefined) this.props.slug = params.slug;
    if (params.telefone !== undefined) this.props.telefone = params.telefone;

    if (params.cnpj !== undefined) {
      const cnpj = params.cnpj ? params.cnpj.replace(/\D/g, '') : null;
      if (cnpj && cnpj.length !== 14) {
        return Result.fail(new Error('CNPJ deve conter 14 dígitos'));
      }
      this.props.cnpj = cnpj;
    }

    if (params.email !== undefined) {
      if (params.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
        return Result.fail(new Error('Formato de e-mail inválido'));
      }
      this.props.email = params.email;
    }

    if (params.config) {
      this.props.config = {
        agenda: { ...this.props.config.agenda, ...(params.config.agenda ?? {}) },
        notificacoes: { ...this.props.config.notificacoes, ...(params.config.notificacoes ?? {}) },
        lgpd: { ...this.props.config.lgpd, ...(params.config.lgpd ?? {}) },
      };
    }

    this.touch();
    return Result.ok();
  }

  /** O tema altera apenas cores — tipografia e layout são do design system. */
  public aplicarTema(tema: Tema): void {
    this.props.tema = tema;
    this.touch();
  }

  public definirLogotipo(params: DefinirLogotipoParams): void {
    this.props.logotipoUrl = params.url;
    this.props.logotipoPath = params.path;
    this.touch();
  }

  public static reconstitute(params: RedeConstructorParams & { id: NonNullable<RedeConstructorParams['id']> }): Rede {
    return new Rede(params);
  }
}
