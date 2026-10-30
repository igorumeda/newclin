import type { Rede } from '../entities/rede.entity';

export type RedeId = string;

export type ExistsRedeByCnpjParams = {
  cnpj: string;
  excludeId?: RedeId;
};

export type ExistsRedeBySlugParams = {
  slug: string;
  excludeId?: RedeId;
};

export type ResumoMasterIndicadores = {
  totalRedes: number;
  redesAtivas: number;
  totalUnidades: number;
  totalUsuariosRede: number;
  totalUsuariosMaster: number;
  totalProfissionais: number;
  totalPacientes: number;
  consultasHoje: number;
  atendimentos30d: number;
  geradoEm: string;
};

export type ResumoMasterRedeItem = {
  id: string;
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  slug: string | null;
  email: string | null;
  telefone: string | null;
  logotipoUrl: string | null;
  ativo: boolean;
  createdAt: string;
  unidadesAtivas: number;
  usuariosAtivos: number;
  profissionaisAtivos: number;
  pacientesAtivos: number;
  consultasHoje: number;
  atendimentos30d: number;
};

export type ResumoMasterRedes = {
  indicadores: ResumoMasterIndicadores;
  redes: ResumoMasterRedeItem[];
};

export interface IRedeRepository {
  findById(id: RedeId): Promise<Rede | null>;
  create(rede: Rede): Promise<void>;
  update(rede: Rede): Promise<void>;
  existsByCnpj(params: ExistsRedeByCnpjParams): Promise<boolean>;
  existsBySlug(params: ExistsRedeBySlugParams): Promise<boolean>;
  obterResumoMaster(): Promise<ResumoMasterRedes>;
}

export const REDE_REPOSITORY = Symbol('IRedeRepository');
