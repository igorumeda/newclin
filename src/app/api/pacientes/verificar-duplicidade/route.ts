import { listarPacientesRoute, obterPacienteRoute, criarPacienteRoute, atualizarPacienteRoute, inativarPacienteRoute, reativarPacienteRoute, verificarDuplicidadePacienteRoute, importarPacientesRoute, exportarDadosPacienteRoute } from '@/modules/patient/server/api/routes/paciente.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  return verificarDuplicidadePacienteRoute(request);
}
