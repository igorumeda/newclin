import { PageHeader } from '@/client/ui/page-header';
import { ImportarPacientes } from '@/client/components/pacientes/importar-pacientes';

export const metadata = { title: 'Importar pacientes' };

export default function ImportarPacientesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        titulo="Importar pacientes"
        descricao="Envie a planilha da clínica, confira o mapeamento das colunas e acompanhe o relatório de importação com as linhas importadas, ignoradas e com erro."
      />
      <ImportarPacientes />
    </div>
  );
}
