import { listarPacientesRoute, obterPacienteRoute, criarPacienteRoute, atualizarPacienteRoute, inativarPacienteRoute, reativarPacienteRoute, verificarDuplicidadePacienteRoute, importarPacientesRoute, exportarDadosPacienteRoute } from '@/modules/patient/server/api/routes/paciente.routes';

// Rotas dependem de cookies/sessão e do container de DI: nunca são estáticas.
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { pacienteId: string } },
) {
  return obterPacienteRoute(request, { pacienteId: params.pacienteId });
}

export async function PUT(
  request: Request,
  { params }: { params: { pacienteId: string } },
) {
  return atualizarPacienteRoute(request, { pacienteId: params.pacienteId });
}

export async function DELETE(
  request: Request,
  { params }: { params: { pacienteId: string } },
) {
  return inativarPacienteRoute(request, { pacienteId: params.pacienteId });
}
