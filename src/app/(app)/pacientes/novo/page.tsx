'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/client/ui/page-header';
import { Card, CardContent } from '@/client/ui/card';
import { Button } from '@/client/ui/button';
import { FormularioPaciente } from '@/client/components/pacientes/formulario-paciente';

export default function NovopacientePage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        titulo="Novo paciente"
        descricao="Campos com * são obrigatórios. Para menores de idade o responsável legal é exigido."
        acoes={
          <Button variant="outline" onClick={() => router.push('/pacientes')}>
            <ArrowLeft aria-hidden />
            Voltar
          </Button>
        }
      />

      <Card>
        <CardContent className="p-5 sm:p-6">
          <FormularioPaciente
            textoBotao="Cadastrar paciente"
            aoCancelar={() => router.push('/pacientes')}
            aoSalvar={(paciente) => router.push(`/pacientes/${paciente.id}`)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
