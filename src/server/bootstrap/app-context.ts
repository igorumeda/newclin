/**
 * Dados carregados no servidor para montar o shell da aplicação
 * (sessão + identidade visual da rede).
 */
import { ApplicationContainer } from '@/server/di/container';
import { getDatabaseClient } from '@/server/infrastructure/database/database.factory';
import { loadAppConfig } from '@/server/config/env.config';
import type { RedeOutputDto } from '@/modules/rede/application/mappers/rede.output.dto';
import type { AuthenticatedUser } from '@/server/api/http.types';
import { lerSessao } from './session';

export type ContextoAplicacao = {
  usuario: AuthenticatedUser | null;
  rede: RedeOutputDto | null;
  appNome: string;
};

export async function carregarContextoAplicacao(): Promise<ContextoAplicacao> {
  const config = loadAppConfig();
  const usuario = await lerSessao();
  if (!usuario) return { usuario: null, rede: null, appNome: config.name };

  const database = getDatabaseClient();
  const rede = await database.withTenant({
    redeId: usuario.redeId,
    callback: async (client) => {
      const container = new ApplicationContainer({ db: client });
      const resultado = await container.obterRede.execute({ redeId: usuario.redeId });
      return resultado.isSuccess ? resultado.value : null;
    },
  });

  return { usuario, rede, appNome: config.name };
}
