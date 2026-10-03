import { Result } from '@core/domain/result';
import { Destinatario } from '../../domain/value-objects/destinatario.vo';
import type { CanalNotificacao, RespostaAcao, VariaveisMensagem } from '../../domain/value-objects/tipos.vo';
import type {
  DadosAgendamentoNotificacaoDto,
  DadosDocumentoNotificacaoDto,
  EnfileirarNotificacaoInputDto,
  NotificacaoDto,
} from '../dtos/notificacao.dto';
import type { EnfileirarNotificacaoUseCase } from '../use-cases/enfileirar-notificacao/enfileirar-notificacao.use-case';

export type NotificacaoDispatcherDependencies = {
  enfileirarNotificacao: EnfileirarNotificacaoUseCase;
};

export type EnfileirarResultado = {
  enfileiradas: NotificacaoDto[];
  canalEscolhido: CanalNotificacao | null;
  motivo: string | null;
};

const BOTOES_PADRAO: { acao: RespostaAcao; label: string }[] = [
  { acao: 'confirmar', label: 'Confirmar' },
  { acao: 'cancelar', label: 'Cancelar' },
];

/**
 * Facade de mensagens do sistema (§4.1/§4.2): outros módulos (agenda,
 * documentos) só conhecem este contrato — nunca modelos, canais ou provedores.
 *
 * Regra de canal: WhatsApp quando há telefone (com botões de confirmação),
 * e-mail como alternativa/fallback quando há e-mail cadastrado.
 */
export class NotificacaoDispatcher {
  private readonly enfileirarNotificacao: EnfileirarNotificacaoUseCase;

  constructor(dependencies: NotificacaoDispatcherDependencies) {
    this.enfileirarNotificacao = dependencies.enfileirarNotificacao;
  }

  public async confirmacaoAgendamento(
    dados: DadosAgendamentoNotificacaoDto,
  ): Promise<EnfileirarResultado> {
    return this.enfileirarParaPaciente({
      ...dados,
      tipo: 'confirmacao',
      variaveis: this.variaveisAgendamento(dados),
      botoes: BOTOES_PADRAO,
    });
  }

  public async lembreteAgendamento(dados: DadosAgendamentoNotificacaoDto): Promise<EnfileirarResultado> {
    return this.enfileirarParaPaciente({
      ...dados,
      tipo: 'lembrete',
      variaveis: this.variaveisAgendamento(dados),
      botoes: BOTOES_PADRAO,
    });
  }

  public async cancelamentoAgendamento(
    dados: DadosAgendamentoNotificacaoDto,
    motivo?: string | null,
  ): Promise<EnfileirarResultado> {
    return this.enfileirarParaPaciente({
      ...dados,
      tipo: 'cancelamento',
      variaveis: { ...this.variaveisAgendamento(dados), motivo_cancelamento: motivo ?? '' },
    });
  }

  public async documentoEmitido(dados: DadosDocumentoNotificacaoDto): Promise<EnfileirarResultado> {
    const variaveis: VariaveisMensagem = {
      paciente_nome: dados.paciente.pacienteNome,
      paciente_primeiro_nome: dados.paciente.pacienteNome.split(' ')[0] ?? dados.paciente.pacienteNome,
      profissional_nome: dados.profissionalNome,
      rede_nome: dados.redeNome,
      tipo_documento: dados.tipoDocumento,
      data_emissao: dados.dataEmissao,
      link_documento: dados.linkDocumento ?? '',
    };

    return this.enfileirarParaPaciente({
      redeId: dados.redeId,
      redeNome: dados.redeNome,
      paciente: dados.paciente,
      tipo: 'documento',
      variaveis,
      documentoId: dados.documentoId,
      atendimentoId: dados.atendimentoId ?? null,
      createdBy: dados.createdBy ?? null,
    });
  }

  private async enfileirarParaPaciente(params: {
    redeId: string;
    redeNome: string;
    paciente: { pacienteId: string; pacienteNome: string; telefone?: string | null; email?: string | null };
    tipo: 'confirmacao' | 'lembrete' | 'documento' | 'cancelamento';
    variaveis: VariaveisMensagem;
    botoes?: { acao: RespostaAcao; label: string }[];
    agendamentoId?: string | null;
    atendimentoId?: string | null;
    documentoId?: string | null;
    createdBy?: string | null;
    agendadaPara?: string | null;
  }): Promise<EnfileirarResultado> {
    const canais: { canal: CanalNotificacao; destinatario: Result<Destinatario> }[] = [];

    if (params.paciente.telefone) {
      canais.push({
        canal: 'whatsapp',
        destinatario: Destinatario.paraWhatsapp(params.paciente.telefone),
      });
    }
    if (params.paciente.email) {
      canais.push({ canal: 'email', destinatario: Destinatario.paraEmail(params.paciente.email) });
    }

    if (canais.length === 0) {
      return {
        enfileiradas: [],
        canalEscolhido: null,
        motivo: 'Paciente sem telefone e sem e-mail cadastrados',
      };
    }

    const enfileiradas: NotificacaoDto[] = [];
    let motivo: string | null = null;

    // Estratégia: WhatsApp primário, e-mail em paralelo (fallback já garantido
    // pelo envio assíncrono, que tenta o outro canal quando um falha).
    for (const { canal, destinatario } of canais) {
      if (destinatario.isFailure) {
        motivo = destinatario.error.message;
        continue;
      }

      const input: EnfileirarNotificacaoInputDto = {
        redeId: params.redeId,
        canal,
        tipo: params.tipo,
        destinatario: destinatario.value.valor,
        variaveis: params.variaveis,
        agendamentoId: params.agendamentoId ?? null,
        pacienteId: params.paciente.pacienteId,
        atendimentoId: params.atendimentoId ?? null,
        documentoId: params.documentoId ?? null,
        agendadaPara: params.agendadaPara ?? null,
        createdBy: params.createdBy ?? null,
        botoes: canal === 'whatsapp' ? params.botoes : undefined,
      };

      const resultado = await this.enfileirarNotificacao.execute(input);
      if (resultado.isFailure) {
        motivo = resultado.error.message;
        continue;
      }

      enfileiradas.push(...resultado.value.notificacoes);
    }

    return {
      enfileiradas,
      canalEscolhido: enfileiradas[0]?.canal ?? null,
      motivo: enfileiradas.length > 0 ? null : motivo,
    };
  }

  private variaveisAgendamento(dados: DadosAgendamentoNotificacaoDto): VariaveisMensagem {
    return {
      paciente_nome: dados.paciente.pacienteNome,
      paciente_primeiro_nome: dados.paciente.pacienteNome.split(' ')[0] ?? dados.paciente.pacienteNome,
      data: dados.data,
      hora: dados.hora,
      profissional_nome: dados.profissionalNome,
      profissional_especialidade: dados.profissionalEspecialidade ?? '',
      unidade_nome: dados.unidade.nome,
      unidade_endereco: dados.unidade.enderecoCompleto,
      unidade_telefone: dados.unidade.telefone ?? '',
      rede_nome: dados.redeNome,
    };
  }
}
