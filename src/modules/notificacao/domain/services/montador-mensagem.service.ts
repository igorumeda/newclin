import { DomainService } from '@core/domain/domain-service.base';
import { Result } from '@core/domain/result';
import type { CanalNotificacaoValue } from '../value-objects/canal-notificacao.vo';
import type { TipoNotificacaoValue } from '../value-objects/tipo-notificacao.vo';
import type { VariaveisNotificacao } from '../entities/notificacao.entity';

export type ModeloMensagem = { assunto: string; corpo: string };
export type MontarMensagemParams = {
  canal: CanalNotificacaoValue;
  tipo: TipoNotificacaoValue;
  variaveis: VariaveisNotificacao;
};
export type MensagemMontada = { assunto: string; conteudo: string; variaveisFaltantes: string[] };

/** Templates com variáveis no formato {{nome}} (spec §4.1). */
export const MODELOS_MENSAGEM: Record<
  TipoNotificacaoValue,
  Record<CanalNotificacaoValue, ModeloMensagem>
> = {
  confirmacao_agendamento: {
    email: {
      assunto: 'Consulta agendada em {{unidade}}',
      corpo:
        'Olá, {{paciente}}!\n\nSua consulta com {{profissional}} foi agendada para {{data}} às {{hora}}, na unidade {{unidade}} ({{endereco}}).\n\nEm caso de imprevisto, entre em contato pelo telefone {{telefoneUnidade}}.\n\n{{rede}}',
    },
    whatsapp: {
      assunto: 'Consulta agendada',
      corpo:
        'Olá, {{paciente}}! Sua consulta com {{profissional}} foi agendada para {{data}} às {{hora}} na unidade {{unidade}}. Responda SIM para confirmar ou NAO para cancelar.',
    },
  },
  lembrete_consulta: {
    email: {
      assunto: 'Lembrete: consulta amanhã em {{unidade}}',
      corpo:
        'Olá, {{paciente}}!\n\nLembramos que você tem consulta com {{profissional}} em {{data}} às {{hora}}, na unidade {{unidade}} ({{endereco}}).\n\nChegue com 15 minutos de antecedência e traja documento com foto.\n\n{{rede}}',
    },
    whatsapp: {
      assunto: 'Lembrete de consulta',
      corpo:
        'Olá, {{paciente}}! Lembrete da sua consulta com {{profissional}} em {{data}} às {{hora}} na unidade {{unidade}}. Responda SIM para confirmar ou NAO para cancelar.',
    },
  },
  cancelamento_agendamento: {
    email: {
      assunto: 'Consulta cancelada',
      corpo:
        'Olá, {{paciente}}.\n\nSua consulta com {{profissional}} marcada para {{data}} às {{hora}} foi cancelada. Motivo: {{motivo}}.\n\nPara reagendar, entre em contato pelo telefone {{telefoneUnidade}}.\n\n{{rede}}',
    },
    whatsapp: {
      assunto: 'Consulta cancelada',
      corpo:
        'Olá, {{paciente}}. Sua consulta com {{profissional}} em {{data}} às {{hora}} foi cancelada ({{motivo}}). Entre em contato para reagendar.',
    },
  },
  documento_clinico: {
    email: {
      assunto: '{{documento}} disponível',
      corpo:
        'Olá, {{paciente}}!\n\nO documento "{{documento}}" emitido por {{profissional}} está disponível.\n\n{{rede}}',
    },
    whatsapp: {
      assunto: 'Documento disponível',
      corpo: 'Olá, {{paciente}}! O documento "{{documento}}" já está disponível na recepção.',
    },
  },
};

const PADRAO_VARIAVEL = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export class MontadorMensagemService extends DomainService<MontarMensagemParams, MensagemMontada> {
  public execute(params: MontarMensagemParams): Result<MensagemMontada> {
    const modelo = MODELOS_MENSAGEM[params.tipo]?.[params.canal];
    if (!modelo) {
      return Result.fail(
        new Error(`Não há modelo de mensagem para ${params.tipo} em ${params.canal}`),
      );
    }

    const faltantes = new Set<string>();
    const substituir = (texto: string): string =>
      texto.replace(PADRAO_VARIAVEL, (_, chave: string) => {
        const valor = params.variaveis[chave];
        if (valor === undefined || valor === '') {
          faltantes.add(chave);
          return '';
        }
        return valor;
      });

    return Result.ok({
      assunto: substituir(modelo.assunto).trim(),
      conteudo: substituir(modelo.corpo).replace(/[ \t]+\n/g, '\n').trim(),
      variaveisFaltantes: Array.from(faltantes),
    });
  }
}
