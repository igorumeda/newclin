import { PacienteDetalhePage } from '@/modules/paciente/client/ui/pages/paciente-detalhe.page';

export type PageProps = { params: { id: string } };

export default function Page({ params }: PageProps) {
  return <PacienteDetalhePage pacienteId={params.id} />;
}
