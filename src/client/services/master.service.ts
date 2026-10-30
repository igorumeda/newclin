import type {
  ResumoMasterIndicadoresDto,
  ResumoMasterRedeItemDto,
  ResumoMasterRedesDto,
} from '@/modules/organization/application/dtos/organizacao.dto';
import { api } from './api-client.service';

export type {
  ResumoMasterIndicadoresDto,
  ResumoMasterRedeItemDto,
  ResumoMasterRedesDto,
};

export const masterService = {
  async obterResumoRedes(): Promise<ResumoMasterRedesDto> {
    return api.get<ResumoMasterRedesDto>('/api/master/redes');
  },
};

