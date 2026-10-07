'use client';

import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { BreadcrumbNav } from '@/client/ui/navigation/breadcrumb-nav.component';
import { PacienteForm } from '../forms/paciente.form';

export function NovoPacientePage() {
  return (
    <PageContainer>
      <BreadcrumbNav
        itens={[{ titulo: 'Pacientes', href: '/pacientes' }, { titulo: 'Novo paciente' }]}
      />
      <PageTitle
        titulo="Novo paciente"
        descricao="O CPF é único por rede; duplicidades são bloqueadas automaticamente."
      />
      <PacienteForm />
    </PageContainer>
  );
}
