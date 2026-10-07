'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Download, FileText, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { BreadcrumbNav } from '@/client/ui/navigation/breadcrumb-nav.component';
import { LoadingScreen } from '@/client/ui/feedback/loading-screen.component';
import { ErrorFallback } from '@/client/ui/feedback/error-fallback.component';
import { EmptyState } from '@/client/ui/typography/empty-state.component';
import { InfoCard } from '@/client/ui/data-display/info-card.component';
import { ConfirmDialog } from '@/client/ui/forms/confirm-dialog.component';
import { useAutenticacao } from '@/client/providers/auth-provider';
import { prontuarioApiService } from '@/modules/prontuario/client/services/prontuario-api.service';
import { documentoApiService } from '@/modules/documento/client/services/documento-api.service';
import { PacienteForm } from '../forms/paciente.form';
import { pacienteApiService } from '../../services/paciente-api.service';

export type PacienteDetalhePageProps = { pacienteId: string };

function dataHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function PacienteDetalhePage({ pacienteId }: PacienteDetalhePageProps) {
  const queryClient = useQueryClient();
  const { pode } = useAutenticacao();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const paciente = useQuery({
    queryKey: ['pacientes', pacienteId],
    queryFn: () => pacienteApiService.obter({ id: pacienteId }),
  });

  const atendimentos = useQuery({
    queryKey: ['atendimentos', 'paciente', pacienteId],
    queryFn: () => prontuarioApiService.listarAtendimentos({ pacienteId }),
  });

  const documentos = useQuery({
    queryKey: ['documentos', 'paciente', pacienteId],
    queryFn: () => documentoApiService.listar({ pacienteId }),
  });

  const excluir = useMutation({
    mutationFn: () => pacienteApiService.excluir({ id: pacienteId }),
    onSuccess: () => {
      toast.success('Paciente inativado (exclusão lógica)');
      void queryClient.invalidateQueries({ queryKey: ['pacientes'] });
      setConfirmando(false);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const exportar = useMutation({
    mutationFn: () => pacienteApiService.exportar({ id: pacienteId }),
    onSuccess: (dados) => {
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `paciente-${pacienteId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Dados exportados (LGPD)');
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  if (paciente.isLoading) return <LoadingScreen />;
  if (paciente.isError || !paciente.data) {
    return (
      <PageContainer>
        <ErrorFallback mensagem="Paciente não encontrado" />
      </PageContainer>
    );
  }

  const dados = paciente.data;

  return (
    <PageContainer>
      <BreadcrumbNav
        itens={[{ titulo: 'Pacientes', href: '/pacientes' }, { titulo: dados.nome }]}
      />
      <PageTitle
        titulo={dados.nome}
        descricao={`${dados.cpfFormatado} · ${dados.idade} anos · ${dados.rotuloSexo}`}
        acoes={
          <>
            <Button variant="outline" onClick={() => exportar.mutate()}>
              <Download className="h-4 w-4" aria-hidden />
              Exportar dados
            </Button>
            {pode('paciente:escrever') ? (
              <Button variant="outline" onClick={() => setEditando((atual) => !atual)}>
                <Pencil className="h-4 w-4" aria-hidden />
                {editando ? 'Fechar edição' : 'Editar'}
              </Button>
            ) : null}
            {pode('paciente:excluir') && dados.ativo ? (
              <Button variant="destructive" onClick={() => setConfirmando(true)}>
                <Trash2 className="h-4 w-4" aria-hidden />
                Inativar
              </Button>
            ) : null}
          </>
        }
      />

      {editando ? (
        <PacienteForm paciente={dados} />
      ) : (
        <Tabs defaultValue="dados">
          <TabsList>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="historico">Histórico clínico</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="space-y-4">
            <InfoCard
              titulo="Cadastro"
              itens={[
                { rotulo: 'Telefone', valor: dados.telefoneFormatado ?? '—' },
                { rotulo: 'E-mail', valor: dados.email ?? '—' },
                {
                  rotulo: 'Endereço',
                  valor: [
                    dados.endereco?.logradouro,
                    dados.endereco?.numero,
                    dados.endereco?.bairro,
                    dados.endereco?.cidade,
                    dados.endereco?.uf,
                  ]
                    .filter(Boolean)
                    .join(', '),
                },
                { rotulo: 'Responsável', valor: dados.responsavelNome ?? '—' },
                {
                  rotulo: 'Consentimento LGPD',
                  valor: dados.consentimentoLgpd ? (
                    <Badge variant="success">Concedido</Badge>
                  ) : (
                    <Badge variant="warning">Pendente</Badge>
                  ),
                },
                { rotulo: 'Cadastro em', valor: dataHora(dados.criadoEm) },
              ]}
            />
            <InfoCard
              titulo="Informações clínicas"
              itens={[
                {
                  rotulo: 'Alergias',
                  valor:
                    dados.alergias.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {dados.alergias.map((alergia) => (
                          <Badge key={alergia} variant="destructive">
                            {alergia}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      'Nenhuma registrada'
                    ),
                },
                {
                  rotulo: 'Condições crônicas',
                  valor:
                    dados.condicoesCronicas.length > 0
                      ? dados.condicoesCronicas.join(', ')
                      : 'Nenhuma registrada',
                },
                { rotulo: 'Observações', valor: dados.observacoes ?? '—' },
              ]}
            />
          </TabsContent>

          <TabsContent value="historico">
            <Card>
              <CardHeader>
                <CardTitle>Atendimentos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(atendimentos.data?.length ?? 0) === 0 ? (
                  <EmptyState titulo="Nenhum atendimento registrado" className="m-6" />
                ) : (
                  <ul className="divide-y">
                    {atendimentos.data?.map((atendimento) => (
                      <li
                        key={atendimento.id}
                        className="flex flex-wrap items-center gap-3 px-6 py-3"
                      >
                        <span className="w-32 text-sm tabular-nums">
                          {dataHora(atendimento.iniciadoEm)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">
                          {atendimento.camposFixos.queixaPrincipal ?? 'Sem queixa registrada'}
                        </span>
                        <Badge variant={atendimento.status === 'finalizado' ? 'success' : 'secondary'}>
                          {atendimento.status.replace('_', ' ')}
                        </Badge>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/atendimentos/${atendimento.id}`}>Abrir</Link>
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <CardTitle>Documentos emitidos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {(documentos.data?.length ?? 0) === 0 ? (
                  <EmptyState
                    titulo="Nenhum documento emitido"
                    icone={<FileText className="h-8 w-8" aria-hidden />}
                    className="m-6"
                  />
                ) : (
                  <ul className="divide-y">
                    {documentos.data?.map((documento) => (
                      <li
                        key={documento.id}
                        className="flex flex-wrap items-center gap-3 px-6 py-3"
                      >
                        <span className="w-44 text-sm font-medium">{documento.tipoRotulo}</span>
                        <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                          {documento.emitidoEm ? dataHora(documento.emitidoEm) : 'Rascunho'}
                        </span>
                        <Badge variant={documento.status === 'emitido' ? 'success' : 'secondary'}>
                          {documento.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <ConfirmDialog
        aberto={confirmando}
        titulo="Inativar paciente?"
        descricao="O registro permanece no histórico (exclusão lógica) e deixa de aparecer nas listas ativas."
        textoConfirmar="Inativar"
        aoConfirmar={() => excluir.mutate()}
        aoFechar={() => setConfirmando(false)}
      />
    </PageContainer>
  );
}
