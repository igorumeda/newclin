import { PageHeader } from '@/client/ui/page-header';
import { TabelaPacientes } from '@/client/components/pacientes/tabela-pacientes';

export const metadata = { title: 'Pacientes' };

export default function PacientesPage() {
  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Pacientes"
        descricao="Busque por nome parcial ou CPF exato. A duplicidade por CPF (ou nome + data de nascimento) bloqueia novos cadastros."
      />
      <TabelaPacientes />
    </div>
  );
}
