import type {
  AtualizarRedeMasterInputDto,
  CriarRedeMasterInputDto,
  OrganizacaoDto,
  ResumoMasterIndicadoresDto,
  ResumoMasterRedeItemDto,
  ResumoMasterRedesDto,
} from '@/modules/organization/application/dtos/organizacao.dto';
import { api } from './api-client.service';

export type {
  OrganizacaoDto,
  ResumoMasterIndicadoresDto,
  ResumoMasterRedeItemDto,
  ResumoMasterRedesDto,
};

export type CriarRedeMasterParams = Omit<CriarRedeMasterInputDto, 'isMaster'>;

export type AtualizarRedeMasterDados = Omit<
  AtualizarRedeMasterInputDto,
  'isMaster' | 'redeId'
>;

export type AtualizarRedeMasterParams = {
  redeId: string;
  dados: AtualizarRedeMasterDados;
};

export const masterService = {
  async obterResumoRedes(): Promise<ResumoMasterRedesDto> {
    return api.get<ResumoMasterRedesDto>('/api/master/redes');
  },

  async criarRede(dados: CriarRedeMasterParams): Promise<OrganizacaoDto> {
    return api.post<OrganizacaoDto>('/api/master/redes', { body: dados });
  },

  async atualizarRede({
    redeId,
    dados,
  }: AtualizarRedeMasterParams): Promise<OrganizacaoDto> {
    return api.put<OrganizacaoDto>(`/api/master/redes/${redeId}`, { body: dados });
  },
};
