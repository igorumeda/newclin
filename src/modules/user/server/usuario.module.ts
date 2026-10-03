import type { SupabaseClient } from '@supabase/supabase-js';
import { UsuarioRepositoryImpl } from './infrastructure/persistence/repositories/usuario.repository.impl';
import { UsuarioPersistenceMapper } from './infrastructure/persistence/mappers/usuario-persistence.mapper';
import { SupabaseIdentityProvider } from './infrastructure/providers/supabase-identity.provider';
import { IdentityProvider } from './infrastructure/providers/identity-provider.base';
import { UsuarioMapper } from '../application/mappers/usuario.mapper';
import { ListarUsuariosUseCase } from '../application/use-cases/listar-usuarios/listar-usuarios.use-case';
import { CriarUsuarioUseCase } from '../application/use-cases/criar-usuario/criar-usuario.use-case';
import { AtualizarUsuarioUseCase } from '../application/use-cases/atualizar-usuario/atualizar-usuario.use-case';
import { InativarUsuarioUseCase } from '../application/use-cases/inativar-usuario/inativar-usuario.use-case';
import { ReativarUsuarioUseCase } from '../application/use-cases/reativar-usuario/reativar-usuario.use-case';
import { ObterPerfilAtualUseCase } from '../application/use-cases/obter-perfil-atual/obter-perfil-atual.use-case';
import { UsuarioController } from './api/controllers/usuario.controller';

export type UsuarioModuleDependencies = {
  supabase: SupabaseClient;
  serviceClient: SupabaseClient;
};

/**
 * Composição do módulo (Dependency Injection).
 * Repositórios usam o client com o JWT do usuário (RLS ativa); o provider de
 * identidade usa a service role, restrita ao provisionamento de credenciais.
 */
export function createUsuarioModule(dependencies: UsuarioModuleDependencies) {
  const persistenceMapper = new UsuarioPersistenceMapper();
  const mapper = new UsuarioMapper();

  const usuarioRepository = new UsuarioRepositoryImpl({
    supabase: dependencies.supabase,
    mapper: persistenceMapper,
  });

  const identityProvider: IdentityProvider = new SupabaseIdentityProvider({
    serviceClient: dependencies.serviceClient,
  });

  const listarUsuarios = new ListarUsuariosUseCase({ usuarioRepository, mapper });
  const obterPerfilAtual = new ObterPerfilAtualUseCase({ usuarioRepository, mapper });
  const criarUsuario = new CriarUsuarioUseCase({ usuarioRepository, identityProvider, mapper });
  const atualizarUsuario = new AtualizarUsuarioUseCase({ usuarioRepository, identityProvider, mapper });
  const inativarUsuario = new InativarUsuarioUseCase({ usuarioRepository, mapper });
  const reativarUsuario = new ReativarUsuarioUseCase({ usuarioRepository, mapper });

  const controller = new UsuarioController({
    listarUsuarios,
    criarUsuario,
    atualizarUsuario,
    inativarUsuario,
    reativarUsuario,
    obterPerfilAtual,
  });

  return {
    controller,
    repositories: { usuarioRepository },
    useCases: {
      listarUsuarios,
      obterPerfilAtual,
      criarUsuario,
      atualizarUsuario,
      inativarUsuario,
      reativarUsuario,
    },
  };
}

export type UsuarioModule = ReturnType<typeof createUsuarioModule>;
