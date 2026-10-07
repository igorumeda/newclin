import { DomainService } from '@core/domain/domain-service.base';
import { Result } from '@core/domain/result';
import { PreenchimentoInvalidoError } from '../errors/preenchimento-invalido.error';
import { ESCALA_MAXIMA, ESCALA_MINIMA } from '../value-objects/tipo-campo.vo';
import type { CampoTemplate, EstruturaTemplate } from '../value-objects/estrutura-template.vo';
import type { DadosPreenchidos, ValorCampo } from '../entities/atendimento.entity';

export type ValidarPreenchimentoParams = {
  estrutura: EstruturaTemplate;
  dados: DadosPreenchidos;
  exigirObrigatorios: boolean;
};

export type PreenchimentoNormalizado = { dados: DadosPreenchidos };
type NormalizarCampoParams = { campo: CampoTemplate; valor: ValorCampo };

/** Motor de validação dos dados dinâmicos contra a estrutura do template. */
export class ValidadorPreenchimentoService extends DomainService<
  ValidarPreenchimentoParams,
  PreenchimentoNormalizado
> {
  public execute(params: ValidarPreenchimentoParams): Result<PreenchimentoNormalizado> {
    const pendencias: string[] = [];
    const normalizados: DadosPreenchidos = {};

    params.estrutura.campos.forEach((campo) => {
      const bruto = params.dados[campo.id] ?? null;
      const vazio = this.isVazio(bruto);

      if (vazio) {
        if (campo.obrigatorio && params.exigirObrigatorios) {
          pendencias.push(`"${campo.rotulo}" é obrigatório`);
        }
        normalizados[campo.id] = null;
        return;
      }

      const normalizado = this.normalizar({ campo, valor: bruto });
      if (normalizado === undefined) {
        pendencias.push(`"${campo.rotulo}" possui valor inválido`);
        return;
      }
      normalizados[campo.id] = normalizado;
    });

    if (pendencias.length > 0) {
      return Result.fail(new PreenchimentoInvalidoError({ pendencias }));
    }
    return Result.ok({ dados: normalizados });
  }

  private isVazio(valor: ValorCampo): boolean {
    if (valor === null || valor === undefined) return true;
    if (typeof valor === 'string') return valor.trim().length === 0;
    if (Array.isArray(valor)) return valor.length === 0;
    return false;
  }

  private normalizar({ campo, valor }: NormalizarCampoParams): ValorCampo | undefined {
    switch (campo.tipo) {
      case 'texto_curto':
        return String(valor).trim().slice(0, 500);
      case 'texto_longo':
        return String(valor).trim().slice(0, 20000);
      case 'numero': {
        const numero = Number(valor);
        return Number.isFinite(numero) ? numero : undefined;
      }
      case 'escala': {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return undefined;
        if (numero < ESCALA_MINIMA || numero > ESCALA_MAXIMA) return undefined;
        return Math.round(numero);
      }
      case 'data': {
        const texto = String(valor).slice(0, 10);
        return Number.isNaN(new Date(`${texto}T00:00:00.000Z`).getTime()) ? undefined : texto;
      }
      case 'sim_nao': {
        if (typeof valor === 'boolean') return valor;
        const texto = String(valor).toLowerCase();
        if (['true', 'sim', '1'].includes(texto)) return true;
        if (['false', 'nao', 'não', '0'].includes(texto)) return false;
        return undefined;
      }
      case 'selecao_unica': {
        const texto = String(valor);
        return campo.opcoes.includes(texto) ? texto : undefined;
      }
      case 'selecao_multipla': {
        const lista = Array.isArray(valor) ? valor.map(String) : [String(valor)];
        return lista.every((item) => campo.opcoes.includes(item)) ? lista : undefined;
      }
      case 'anexo':
        return String(valor).trim();
      default:
        return undefined;
    }
  }
}
