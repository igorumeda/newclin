import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { UsuarioController } from '@/modules/auth/server/api/controllers/usuario.controller';

const handler = createRouteHandler({
  controller: (container) => new UsuarioController({
      listarUsuarios: container.listarUsuarios,
      criarUsuario: container.criarUsuario,
      atualizarUsuario: container.atualizarUsuario,
      alternarStatusUsuario: container.alternarStatusUsuario,
      alterarSenha: container.alterarSenha,
    }),
  auditoria: { entidade: 'usuario' },
});

export const PATCH = handler;
export const DELETE = handler;
