import { AggregateRoot } from '@core/domain/aggregate-root.base';
import type { EntityConstructorParams } from '@core/domain/entity.base';
import { Result } from '@core/domain/result';
import { InvalidRedeDataError } from '../errors/unidade.errors';
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

export type CriarRedeParams = {
  nome: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  slug?: string | null;
  email?: string | null;
  telefone?: string | null;
  presetTema?: string;
  config?: RedeConfigParcial;
  ativo?: boolean;
};

export type AtualizarRedeParams = {
  nome?: string;
  razaoSocial?: string | null;
  cnpj?: string | null;
  slug?: string | null;
  email?: string | null;
  telefone?: string | null;
  config?: RedeConfigParcial;
  ativo?: boolean;
};

export type DefinirLogotipoParams = {
  url: string | null;
  path: string | null;
};

export type NormalizarSlugParams = {
  valor: string;
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

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  public static normalizarSlug({ valor }: NormalizarSlugParams): string {
    return valor
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  public static create(params: CriarRedeParams): Result<Rede> {
    const nome = params.nome?.trim() ?? '';
    if (nome.length < 3) {
      return Result.fail(
        new InvalidRedeDataError({
          reason: 'Nome da rede deve ter no mínimo 3 caracteres',
        }),
      );
    }

    const cnpjLimpo = params.cnpj ? params.cnpj.replace(/\D/g, '') : '';
    const cnpj = cnpjLimpo.length > 0 ? cnpjLimpo : null;
    if (cnpj && cnpj.length !== 14) {
      return Result.fail(
        new InvalidRedeDataError({ reason: 'CNPJ deve conter 14 dígitos' }),
      );
    }

    const slugBruto = params.slug?.trim() ?? '';
    const slug =
      slugBruto.length > 0
        ? Rede.normalizarSlug({ valor: slugBruto })
        : Rede.normalizarSlug({ valor: nome }) || null;

    if (slug && !SLUG_REGEX.test(slug)) {
      return Result.fail(
        new InvalidRedeDataError({
          reason:
            'Slug inválido: use apenas letras minúsculas, números e hífens (ex.: rede-clinica)',
        }),
      );
    }

    const emailLimpo = params.email?.trim().toLowerCase() ?? '';
    const email = emailLimpo.length > 0 ? emailLimpo : null;
    if (email && !EMAIL_REGEX.test(email)) {
      return Result.fail(
        new InvalidRedeDataError({ reason: 'Formato de e-mail inválido' }),
      );
    }

    const temaResult = params.presetTema
      ? Tema.fromPreset(params.presetTema)
      : Result.ok(Tema.defaultPreset());
    if (temaResult.isFailure) {
      return Result.fail(temaResult.error);
    }

    const razaoLimpa = params.razaoSocial?.trim() ?? '';
    const telefoneLimpo = params.telefone?.trim() ?? '';

    const config: RedeConfig = {
      agenda: { ...REDE_CONFIG_PADRAO.agenda, ...(params.config?.agenda ?? {}) },
      notificacoes: {
        ...REDE_CONFIG_PADRAO.notificacoes,
        ...(params.config?.notificacoes ?? {}),
      },
      lgpd: { ...REDE_CONFIG_PADRAO.lgpd, ...(params.config?.lgpd ?? {}) },
    };

    return Result.ok(
      new Rede({
        props: {
          nome,
          razaoSocial: razaoLimpa.length > 0 ? razaoLimpa : null,
          cnpj,
          slug,
          email,
          telefone: telefoneLimpo.length > 0 ? telefoneLimpo : null,
          tema: temaResult.value,
          logotipoUrl: null,
          logotipoPath: null,
          config,
          ativo: params.ativo ?? true,
        },
      }),
    );
  }

  public atualizarDados(params: AtualizarRedeParams): Result<void> {
    if (params.nome !== undefined) {
      const nome = params.nome.trim();
      if (nome.length < 3) {
        return Result.fail(
          new InvalidRedeDataError({
            reason: 'Nome da rede deve ter no mínimo 3 caracteres',
          }),
        );
      }
      this.props.nome = nome;
    }

    if (params.razaoSocial !== undefined) {
      const razao = params.razaoSocial?.trim() ?? '';
      this.props.razaoSocial = razao.length > 0 ? razao : null;
    }

    if (params.slug !== undefined) {
      const slugBruto = params.slug?.trim() ?? '';
      const slug = slugBruto.length > 0 ? Rede.normalizarSlug({ valor: slugBruto }) : null;
      if (slug && !SLUG_REGEX.test(slug)) {
        return Result.fail(
          new InvalidRedeDataError({
            reason:
              'Slug inválido: use apenas letras minúsculas, números e hífens (ex.: rede-clinica)',
          }),
        );
      }
      this.props.slug = slug;
    }

    if (params.telefone !== undefined) {
      const tel = params.telefone?.trim() ?? '';
      this.props.telefone = tel.length > 0 ? tel : null;
    }

    if (params.cnpj !== undefined) {
      const digitos = params.cnpj ? params.cnpj.replace(/\D/g, '') : '';
      const cnpj = digitos.length > 0 ? digitos : null;
      if (cnpj && cnpj.length !== 14) {
        return Result.fail(
          new InvalidRedeDataError({ reason: 'CNPJ deve conter 14 dígitos' }),
        );
      }
      this.props.cnpj = cnpj;
    }

    if (params.email !== undefined) {
      const emailLimpo = params.email?.trim().toLowerCase() ?? '';
      const email = emailLimpo.length > 0 ? emailLimpo : null;
      if (email && !EMAIL_REGEX.test(email)) {
        return Result.fail(
          new InvalidRedeDataError({ reason: 'Formato de e-mail inválido' }),
        );
      }
      this.props.email = email;
    }

    if (params.config) {
      this.props.config = {
        agenda: { ...this.props.config.agenda, ...(params.config.agenda ?? {}) },
        notificacoes: {
          ...this.props.config.notificacoes,
          ...(params.config.notificacoes ?? {}),
        },
        lgpd: { ...this.props.config.lgpd, ...(params.config.lgpd ?? {}) },
      };
    }

    if (params.ativo !== undefined) {
      this.props.ativo = params.ativo;
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

  public static reconstitute(
    params: RedeConstructorParams & { id: NonNullable<RedeConstructorParams['id']> },
  ): Rede {
    return new Rede(params);
  }
}
