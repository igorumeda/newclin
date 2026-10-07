import { AtendimentoPage } from '@/modules/prontuario/client/ui/pages/atendimento.page';

export type PageProps = { params: { id: string } };

export default function Page({ params }: PageProps) {
  return <AtendimentoPage atendimentoId={params.id} />;
}
