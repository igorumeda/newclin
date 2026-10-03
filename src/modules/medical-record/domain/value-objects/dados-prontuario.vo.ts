import { ValueObject } from '@core/domain/value-object.base';
import { Result } from '@core/domain/result';
import type { EstruturaTemplate } from './estrutura-template.vo';
import type { CampoEstrutura } from './campo-template.vo';

export type ValorCampo = string | number | boolean | string[] | number[] | null;
export type DadosPreenchidos = Record<string, ValorCampo>;
export type DadosProntuarioProps = { valores: DadosPreenchidos };

export type ProblemaValidacaoDados = {
  campoId: string;
  rotulo: string;
  motivo: string;
};

export type ValidarDadosParams = {
  estrutura: EstruturaTemplate;
  /** Exige o preenchimento dos campos marcados como obrigatórios (finalização). */
  exigirObrigatorios?: boolean;
};

/** Dados preenchidos do formulário dinâmico, validados contra a estrutura. */
export class DadosProntuario extends ValueObject<DadosProntuarioProps> {
  private constructor(props: DadosProntuarioProps) {
    super(props);
  }

  get valores(): DadosPreenchidos {
    return this.props.valores;
  }

  public toJSON(): DadosPreenchidos {
    return { ...this.props.valores };
  }

  public static create(valores: DadosPreenchidos): Result<DadosProntuario> {
    if (valores === null || typeof valores !== 'object' || Array.isArray(valores)) {
      return Result.fail(new Error('Dados do prontuário devem ser um objeto de campos'));
    }

    return Result.ok(new DadosProntuario({ valores }));
  }

  /**
   * Valida tipos, faixas, opções e campos obrigatórios.
   * Devolve a lista completa de problemas para a UI destacar todos os campos.
   */
  public validar(params: ValidarDadosParams): ProblemaValidacaoDados[] {
    const problemas: ProblemaValidacaoDados[] = [];

    for (const campo of params.estrutura.campos()) {
      const valor = this.props.valores[campo.id];
      const vazio = this.estaVazio(valor);

      if (vazio) {
        if (params.exigirObrigatorios && campo.obrigatorio) {
          problemas.push({ campoId: campo.id, rotulo: campo.rotulo, motivo: 'Campo obrigatório não preenchido' });
        }
        continue;
      }

      const problema = this.validarCampo({ campo, valor });
      if (problema) problemas.push({ campoId: campo.id, rotulo: campo.rotulo, motivo: problema });
    }

    return problemas;
  }

  private estaVazio(valor: ValorCampo | undefined): boolean {
    if (valor === undefined || valor === null) return true;
    if (typeof valor === 'string') return valor.trim().length === 0;
    if (Array.isArray(valor)) return valor.length === 0;
    return false;
  }

  private validarCampo(params: { campo: CampoEstrutura; valor: ValorCampo }): string | null {
    const { campo, valor } = params;

    switch (campo.tipo) {
      case 'numero': {
        const numero = Number(valor);
        if (Number.isNaN(numero)) return 'Deve ser um número';
        if (campo.min !== undefined && numero < campo.min) return `Valor mínimo: ${campo.min}`;
        if (campo.max !== undefined && numero > campo.max) return `Valor máximo: ${campo.max}`;
        return null;
      }

      case 'escala': {
        const numero = Number(valor);
        const min = campo.min ?? 0;
        const max = campo.max ?? 10;
        if (Number.isNaN(numero) || numero < min || numero > max) {
          return `Escala deve estar entre ${min} e ${max}`;
        }
        return null;
      }

      case 'data': {
        if (Number.isNaN(new Date(String(valor)).getTime())) return 'Data inválida';
        return null;
      }

      case 'sim_nao': {
        if (typeof valor !== 'boolean') return 'Informe Sim ou Não';
        return null;
      }

      case 'selecao_unica': {
        const texto = String(valor);
        if (!(campo.opcoes ?? []).includes(texto)) return `Opção inválida: "${texto}"`;
        return null;
      }

      case 'selecao_multipla': {
        if (!Array.isArray(valor)) return 'Informe ao menos uma opção';
        const invalidas = valor.filter((item) => !(campo.opcoes ?? []).includes(String(item)));
        if (invalidas.length > 0) return `Opções inválidas: ${invalidas.join(', ')}`;
        return null;
      }

      case 'texto_curto': {
        if (typeof valor === 'boolean' || Array.isArray(valor)) return 'Texto inválido';
        if (String(valor).length > 500) return 'Texto muito longo (máx. 500 caracteres)';
        return null;
      }

      case 'texto_longo':
        if (typeof valor === 'boolean' || Array.isArray(valor)) return 'Texto inválido';
        return null;

      case 'anexo':
        if (!Array.isArray(valor)) return 'Anexos devem ser uma lista de identificadores';
        return null;

      default:
        return null;
    }
  }

  public static reconstitute(valores: DadosPreenchidos): DadosProntuario {
    return new DadosProntuario({ valores: valores ?? {} });
  }
}
