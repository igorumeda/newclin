import { createRouteHandler } from '@/server/bootstrap/route-handler';
import { AtendimentoController } from '@/modules/prontuario/server/api/controllers/atendimento.controller';
import type { ObterAtendimentoOutputDto } from '@/modules/prontuario/application/use-cases/obter-atendimento/obter-atendimento.use-case';
import type { HttpResponsePayload } from '@/server/api/http.types';

type CorpoAtendimento = { data?: ObterAtendimentoOutputDto };

function extrairAcessoProntuario(resposta: HttpResponsePayload) {
  const corpo = resposta.body as CorpoAtendimento | null;
  const atendimento = corpo?.data?.atendimento;
  if (!atendimento) return null;
  return { pacienteId: atendimento.pacienteId, atendimentoId: atendimento.id };
}

const handler = createRouteHandler({
  controller: (container) => new AtendimentoController({
      listarAtendimentos: container.listarAtendimentos,
      obterAtendimento: container.obterAtendimento,
      iniciarAtendimento: container.iniciarAtendimento,
      salvarAtendimento: container.salvarAtendimento,
      finalizarAtendimento: container.finalizarAtendimento,
      adicionarAdendo: container.adicionarAdendo,
    }),
  auditoria: { entidade: 'atendimento' },
  acessoProntuario: extrairAcessoProntuario,
});

export const GET = handler;
export const PATCH = handler;
