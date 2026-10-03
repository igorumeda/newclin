import { listarPacientesRoute, obterPacienteRoute, criarPacienteRoute, atualizarPacienteRoute, inativarPacienteRoute, reativarPacienteRoute, verificarDuplicidadePacienteRoute, importarPacientesRoute, exportarDadosPacienteRoute } from '@/modules/patient/server/api/routes/paciente.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { pacienteId: string } },
) {
  return exportarDadosPacienteRoute(request, { pacienteId: params.pacienteId });
}
