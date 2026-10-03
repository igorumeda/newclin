import type { SupabaseClient } from '@supabase/supabase-js';
import type { Atendimento } from '../../domain/entities/atendimento.entity';
import type { EnriquecimentoAtendimento } from '../mappers/prontuario.mapper';

export type ProntuarioEnricherDependencies = {
  supabase: SupabaseClient;
};

type NomeRow = { id: string; nome: string | null };

/**
 * Resolve os nomes de paciente, profissional, unidade e template usados nas
 * listas do prontuário. As consultas são feitas em lote (uma por tabela) para
 * evitar N+1 e respeitam as políticas de RLS do usuário autenticado.
 */
export class ProntuarioEnricher {
  private readonly supabase: SupabaseClient;

  constructor(dependencies: ProntuarioEnricherDependencies) {
    this.supabase = dependencies.supabase;
  }

  async enriquecer(params: { atendimentos: Atendimento[] }): Promise<Map<string, EnriquecimentoAtendimento>> {
    const atendimentos = params.atendimentos;
    const resultado = new Map<string, EnriquecimentoAtendimento>();
    if (atendimentos.length === 0) return resultado;

    const [pacientes, profissionais, unidades, templates] = await Promise.all([
      this.carregarNomes({
        tabela: 'pacientes',
        ids: [...new Set(atendimentos.map((item) => item.pacienteId))],
      }),
      this.carregarNomes({
        tabela: 'profissionais',
        ids: [...new Set(atendimentos.map((item) => item.profissionalId))],
      }),
      this.carregarNomes({
        tabela: 'unidades',
        ids: [...new Set(atendimentos.map((item) => item.unidadeId))],
      }),
      this.carregarNomes({
        tabela: 'templates_prontuario',
        ids: [
          ...new Set(
            atendimentos
              .map((item) => item.templateId)
              .filter((valor): valor is string => Boolean(valor)),
          ),
        ],
      }),
    ]);

    for (const atendimento of atendimentos) {
      resultado.set(atendimento.id.toString(), {
        pacienteNome: pacientes.get(atendimento.pacienteId) ?? null,
        profissionalNome: profissionais.get(atendimento.profissionalId) ?? null,
        unidadeNome: unidades.get(atendimento.unidadeId) ?? null,
        templateNome: atendimento.templateId ? (templates.get(atendimento.templateId) ?? null) : null,
      });
    }

    return resultado;
  }

  private async carregarNomes(params: { tabela: string; ids: string[] }): Promise<Map<string, string>> {
    if (params.ids.length === 0) return new Map();

    const { data } = await this.supabase
      .from(params.tabela)
      .select('id, nome')
      .in('id', params.ids)
      .returns<NomeRow[]>();

    return new Map((data ?? []).filter((linha) => linha.nome).map((linha) => [linha.id, linha.nome as string]));
  }
}
