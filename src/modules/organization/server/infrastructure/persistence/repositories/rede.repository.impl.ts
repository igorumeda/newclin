import type { SupabaseClient } from '@supabase/supabase-js';
import { RedeRepository } from '../../../../domain/repositories/rede-repository.base';
import type {
  RedeId,
  ResumoMasterRedes,
} from '../../../../domain/repositories/rede-repository.interface';
import type { Rede } from '../../../../domain/entities/rede.entity';
import { RedePersistenceMapper } from '../mappers/organizacao-persistence.mapper';
import { REDE_COLUMNS } from '../models/organizacao.models';
import type { RedeModel } from '../models/organizacao.models';

export type RedeRepositoryDependencies = {
  supabase: SupabaseClient;
  serviceClient?: SupabaseClient;
  mapper: RedePersistenceMapper;
};

type ResumoMasterRpcPayload = {
  indicadores?: {
    total_redes?: number;
    redes_ativas?: number;
    total_unidades?: number;
    total_usuarios_rede?: number;
    total_usuarios_master?: number;
    total_profissionais?: number;
    total_pacientes?: number;
    consultas_hoje?: number;
    atendimentos_30d?: number;
    gerado_em?: string;
  };
  redes?: Array<{
    id: string;
    nome: string;
    razao_social: string | null;
    cnpj: string | null;
    slug: string | null;
    email: string | null;
    telefone: string | null;
    logotipo_url: string | null;
    ativo: boolean;
    created_at: string;
    unidades_ativas?: number;
    usuarios_ativos?: number;
    profissionais_ativos?: number;
    pacientes_ativos?: number;
    consultas_hoje?: number;
    atendimentos_30d?: number;
  }>;
};

export class RedeRepositoryImpl extends RedeRepository {
  private readonly supabase: SupabaseClient;
  private readonly serviceClient: SupabaseClient;
  private readonly mapper: RedePersistenceMapper;

  constructor(dependencies: RedeRepositoryDependencies) {
    super();
    this.supabase = dependencies.supabase;
    this.serviceClient = dependencies.serviceClient ?? dependencies.supabase;
    this.mapper = dependencies.mapper;
  }

  async findById(id: RedeId): Promise<Rede | null> {
    const { data } = await this.supabase
      .from('redes')
      .select(REDE_COLUMNS)
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle<RedeModel>();

    return data ? this.mapper.toDomain({ record: data }) : null;
  }

  async update(rede: Rede): Promise<void> {
    const data = this.mapper.toPersistence({ entity: rede });
    const { error } = await this.supabase.from('redes').update(data).eq('id', data.id);
    if (error) throw new Error(error.message);
  }

  async obterResumoMaster(): Promise<ResumoMasterRedes> {
    const { data: rpcData, error: rpcError } =
      await this.supabase.rpc('resumo_master_redes');

    if (!rpcError && rpcData) {
      const payload = rpcData as ResumoMasterRpcPayload;
      const ind = payload.indicadores ?? {};
      const lista = payload.redes ?? [];

      return {
        indicadores: {
          totalRedes: Number(ind.total_redes ?? 0),
          redesAtivas: Number(ind.redes_ativas ?? 0),
          totalUnidades: Number(ind.total_unidades ?? 0),
          totalUsuariosRede: Number(ind.total_usuarios_rede ?? 0),
          totalUsuariosMaster: Number(ind.total_usuarios_master ?? 0),
          totalProfissionais: Number(ind.total_profissionais ?? 0),
          totalPacientes: Number(ind.total_pacientes ?? 0),
          consultasHoje: Number(ind.consultas_hoje ?? 0),
          atendimentos30d: Number(ind.atendimentos_30d ?? 0),
          geradoEm: ind.gerado_em ?? new Date().toISOString(),
        },
        redes: lista.map((item) => ({
          id: item.id,
          nome: item.nome,
          razaoSocial: item.razao_social,
          cnpj: item.cnpj,
          slug: item.slug,
          email: item.email,
          telefone: item.telefone,
          logotipoUrl: item.logotipo_url,
          ativo: item.ativo,
          createdAt: item.created_at,
          unidadesAtivas: Number(item.unidades_ativas ?? 0),
          usuariosAtivos: Number(item.usuarios_ativos ?? 0),
          profissionaisAtivos: Number(item.profissionais_ativos ?? 0),
          pacientesAtivos: Number(item.pacientes_ativos ?? 0),
          consultasHoje: Number(item.consultas_hoje ?? 0),
          atendimentos30d: Number(item.atendimentos_30d ?? 0),
        })),
      };
    }

    return this.obterResumoMasterFallback();
  }

  private async obterResumoMasterFallback(): Promise<ResumoMasterRedes> {
    const agora = new Date();
    const inicioHojeIso = new Date(
      Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()),
    ).toISOString();
    const fimHojeIso = new Date(
      Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate() + 1),
    ).toISOString();
    const trintaDiasAtrasIso = new Date(
      agora.getTime() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      redesRes,
      unidadesRes,
      profilesRes,
      profissionaisRes,
      pacientesRes,
      agendamentos30dRes,
    ] = await Promise.all([
      this.serviceClient
        .from('redes')
        .select('id, nome, razao_social, cnpj, slug, email, telefone, logotipo_url, ativo, created_at')
        .is('deleted_at', null)
        .order('nome', { ascending: true }),
      this.serviceClient
        .from('unidades')
        .select('id, rede_id, ativo')
        .is('deleted_at', null)
        .eq('ativo', true),
      this.serviceClient
        .from('profiles')
        .select('id, rede_id, ativo')
        .is('deleted_at', null)
        .eq('ativo', true),
      this.serviceClient
        .from('profissionais')
        .select('id, rede_id, ativo')
        .is('deleted_at', null)
        .eq('ativo', true),
      this.serviceClient
        .from('pacientes')
        .select('id, rede_id, ativo')
        .is('deleted_at', null)
        .eq('ativo', true),
      this.serviceClient
        .from('agendamentos')
        .select('id, rede_id, status, data_hora_inicio')
        .is('deleted_at', null)
        .gte('data_hora_inicio', trintaDiasAtrasIso),
    ]);

    const redesRows = (redesRes.data ?? []) as Array<{
      id: string;
      nome: string;
      razao_social: string | null;
      cnpj: string | null;
      slug: string | null;
      email: string | null;
      telefone: string | null;
      logotipo_url: string | null;
      ativo: boolean;
      created_at: string;
    }>;
    const unidadesRows = (unidadesRes.data ?? []) as Array<{ rede_id: string }>;
    const profilesRows = (profilesRes.data ?? []) as Array<{ rede_id: string | null }>;
    const profissionaisRows = (profissionaisRes.data ?? []) as Array<{ rede_id: string }>;
    const pacientesRows = (pacientesRes.data ?? []) as Array<{ rede_id: string }>;
    const agendamentosRows = (agendamentos30dRes.data ?? []) as Array<{
      rede_id: string;
      status: string;
      data_hora_inicio: string;
    }>;

    const unidadesPorRede = new Map<string, number>();
    for (const u of unidadesRows) {
      unidadesPorRede.set(u.rede_id, (unidadesPorRede.get(u.rede_id) ?? 0) + 1);
    }

    let totalUsuariosMaster = 0;
    let totalUsuariosRede = 0;
    const usuariosPorRede = new Map<string, number>();
    for (const p of profilesRows) {
      if (p.rede_id === null) {
        totalUsuariosMaster += 1;
      } else {
        totalUsuariosRede += 1;
        usuariosPorRede.set(p.rede_id, (usuariosPorRede.get(p.rede_id) ?? 0) + 1);
      }
    }

    const profissionaisPorRede = new Map<string, number>();
    for (const pr of profissionaisRows) {
      profissionaisPorRede.set(
        pr.rede_id,
        (profissionaisPorRede.get(pr.rede_id) ?? 0) + 1,
      );
    }

    const pacientesPorRede = new Map<string, number>();
    for (const pa of pacientesRows) {
      pacientesPorRede.set(pa.rede_id, (pacientesPorRede.get(pa.rede_id) ?? 0) + 1);
    }

    let totalConsultasHoje = 0;
    let totalAtendimentos30d = 0;
    const consultasHojePorRede = new Map<string, number>();
    const atendimentos30dPorRede = new Map<string, number>();

    for (const ag of agendamentosRows) {
      if (
        ag.data_hora_inicio >= inicioHojeIso &&
        ag.data_hora_inicio < fimHojeIso
      ) {
        totalConsultasHoje += 1;
        consultasHojePorRede.set(
          ag.rede_id,
          (consultasHojePorRede.get(ag.rede_id) ?? 0) + 1,
        );
      }
      if (ag.status === 'finalizado') {
        totalAtendimentos30d += 1;
        atendimentos30dPorRede.set(
          ag.rede_id,
          (atendimentos30dPorRede.get(ag.rede_id) ?? 0) + 1,
        );
      }
    }

    return {
      indicadores: {
        totalRedes: redesRows.length,
        redesAtivas: redesRows.filter((r) => r.ativo).length,
        totalUnidades: unidadesRows.length,
        totalUsuariosRede,
        totalUsuariosMaster,
        totalProfissionais: profissionaisRows.length,
        totalPacientes: pacientesRows.length,
        consultasHoje: totalConsultasHoje,
        atendimentos30d: totalAtendimentos30d,
        geradoEm: agora.toISOString(),
      },
      redes: redesRows.map((item) => ({
        id: item.id,
        nome: item.nome,
        razaoSocial: item.razao_social,
        cnpj: item.cnpj,
        slug: item.slug,
        email: item.email,
        telefone: item.telefone,
        logotipoUrl: item.logotipo_url,
        ativo: item.ativo,
        createdAt: item.created_at,
        unidadesAtivas: unidadesPorRede.get(item.id) ?? 0,
        usuariosAtivos: usuariosPorRede.get(item.id) ?? 0,
        profissionaisAtivos: profissionaisPorRede.get(item.id) ?? 0,
        pacientesAtivos: pacientesPorRede.get(item.id) ?? 0,
        consultasHoje: consultasHojePorRede.get(item.id) ?? 0,
        atendimentos30d: atendimentos30dPorRede.get(item.id) ?? 0,
      })),
    };
  }
}
