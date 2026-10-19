'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CalendarPlus,
  Download,
  FileText,
  IdCard,
  Pencil,
  RotateCcw,
  Shield,
  Stethoscope,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Button } from '@/client/ui/button';
import { Badge } from '@/client/ui/badge';
import { Alert, AlertDescription, EstadoVazio, Separator, TabelaSkeleton } from '@/client/ui/feedback';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/ui/controls';
import { ConfirmDialog } from '@/client/ui/overlay';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import { FormularioPaciente } from '@/client/components/pacientes/formulario-paciente';
import { AnexosPaciente } from '@/client/components/pacientes/anexos-paciente';
import { pacienteService } from '@/client/services/paciente.service';
import { prontuarioService } from '@/client/services/prontuario.service';
import { documentoService } from '@/client/services/documento.service';
import { auditoriaService } from '@/client/services/usuario.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { formatarData, formatarDataHora, formatarIdade, formatarNumero } from '@/client/lib/format';

function Campo({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rotulo}</p>
      <p className="text-sm">{valor || '—'}</p>
    </div>
  );
}

export default function PacienteDetalhePage() {
  const parametros = useParams<{ pacienteId: string }>();
  const pacienteId = parametros.pacienteId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pode, ehClinico } = usePermissoes();
  const { unidadeId, timezone } = useUnidadeAtiva();

  const [editando, setEditando] = React.useState(false);
  const [confirmandoInativacao, setConfirmandoInativacao] = React.useState(false);

  const consulta = useQuery({
    queryKey: ['paciente', pacienteId],
    queryFn: () => pacienteService.obter(pacienteId),
  });

  const atendimentos = useQuery({
    queryKey: ['atendimentos', { pacienteId }],
    queryFn: () => prontuarioService.listarAtendimentos({ pacienteId, perPage: 20 }),
    enabled: ehClinico,
  });

  const documentos = useQuery({
    queryKey: ['documentos', { pacienteId }],
    queryFn: () => documentoService.listar({ pacienteId, perPage: 20 }),
    enabled: pode('documentos:ler'),
  });

  const acessos = useQuery({
    queryKey: ['auditoria', { registroId: pacienteId }],
    queryFn: () =>
      auditoriaService.listar({ entidade: 'pacientes', registroId: pacienteId, perPage: 20 }),
    enabled: pode('auditoria:ler'),
  });

  const inativar = useMutation({
    mutationFn: () =>
      consulta.data?.ativo ? pacienteService.inativar(pacienteId) : pacienteService.reativar(pacienteId),
    onSuccess: (paciente) => {
      toast.success(paciente.ativo ? 'Paciente reativado' : 'Paciente inativado');
      setConfirmandoInativacao(false);
      queryClient.invalidateQueries({ queryKey: ['paciente', pacienteId] });
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const exportar = useMutation({
    mutationFn: () => pacienteService.exportarDados(pacienteId),
    onSuccess: (dados) => {
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dados-paciente-${dados.cpf ?? pacienteId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Exportação gerada (LGPD)');
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  if (consulta.isLoading) {
    return <TabelaSkeleton linhas={6} />;
  }

  if (consulta.isError || !consulta.data) {
    return (
      <EstadoVazio
        titulo="Paciente não encontrado"
        descricao="O cadastro pode ter sido removido ou pertence a outra rede."
        acao={
          <Button asChild variant="outline">
            <Link href="/pacientes">Voltar para pacientes</Link>
          </Button>
        }
      />
    );
  }

  const paciente = consulta.data;

  return (
    <div className="space-y-5">
      <PageHeader
        titulo={paciente.nome}
        descricao={`${paciente.cpfFormatado} · ${formatarData(paciente.dataNascimento)} (${formatarIdade(paciente.idade)}) · ${paciente.sexoLabel}`}
        acoes={
          <>
            <Button variant="outline" onClick={() => router.push('/pacientes')}>
              <ArrowLeft aria-hidden />
              Voltar
            </Button>
            {pode('pacientes:editar') ? (
              <Button variant="outline" onClick={() => setEditando(true)}>
                <Pencil aria-hidden />
                Editar
              </Button>
            ) : null}
            {pode('agenda:criar') ? (
              <Button variant="outline" asChild>
                <Link href={`/agenda?pacienteId=${pacienteId}`}>
                  <CalendarPlus aria-hidden />
                  Agendar
                </Link>
              </Button>
            ) : null}
            {ehClinico ? (
              <Button asChild>
                <Link href={`/atendimentos?pacienteId=${pacienteId}`}>
                  <Stethoscope aria-hidden />
                  Atendimentos
                </Link>
              </Button>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant={paciente.ativo ? 'success' : 'secondary'}>
            {paciente.ativo ? 'Ativo' : 'Inativo'}
          </Badge>
          {paciente.menorDeIdade ? <Badge variant="warning">Menor de idade</Badge> : null}
          {paciente.alergias ? <Badge variant="destructive">Alergias</Badge> : null}
          {paciente.consentimentoLgpd.concedido ? (
            <Badge variant="info">
              <Shield className="mr-1 size-3" aria-hidden />
              LGPD
            </Badge>
          ) : (
            <Badge variant="outline">Sem consentimento LGPD</Badge>
          )}
        </div>
      </PageHeader>

      {paciente.alergias ? (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Alergias:</strong> {paciente.alergias}
          </AlertDescription>
        </Alert>
      ) : null}

      <Tabs defaultValue="dados">
        <TabsList>
          <TabsTrigger value="dados">Dados cadastrais</TabsTrigger>
          {ehClinico ? <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger> : null}
          {pode('documentos:ler') ? <TabsTrigger value="documentos">Documentos</TabsTrigger> : null}
          {ehClinico ? <TabsTrigger value="anexos">Anexos</TabsTrigger> : null}
          <TabsTrigger value="lgpd">LGPD e auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="dados">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Contato</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Telefone" valor={paciente.telefone} />
                <Campo rotulo="E-mail" valor={paciente.email} />
                <Campo rotulo="Endereço" valor={paciente.enderecoFormatado} />
                <Campo rotulo="CEP" valor={paciente.endereco.cep} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Responsável legal</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Campo rotulo="Nome" valor={paciente.responsavel.nome} />
                <Campo rotulo="Parentesco" valor={paciente.responsavel.parentesco} />
                <Campo rotulo="Telefone" valor={paciente.responsavel.telefone} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informações clínicas</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <Campo rotulo="Alergias" valor={paciente.alergias} />
                <Campo rotulo="Condições crônicas" valor={paciente.condicoesCronicas} />
                <Campo rotulo="Observações" valor={paciente.observacoes} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {ehClinico ? (
          <TabsContent value="atendimentos">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Histórico de atendimentos</CardTitle>
                <Button size="sm" asChild>
                  <Link href={`/atendimentos?pacienteId=${pacienteId}`}>
                    <Stethoscope aria-hidden />
                    Abrir lista
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {atendimentos.isLoading ? (
                  <TabelaSkeleton linhas={3} />
                ) : (atendimentos.data?.items ?? []).length === 0 ? (
                  <EstadoVazio titulo="Nenhum atendimento registrado" icone={Stethoscope} />
                ) : (
                  <ul className="divide-y">
                    {(atendimentos.data?.items ?? []).map((atendimento) => (
                      <li key={atendimento.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <Link
                            href={`/atendimentos/${atendimento.id}`}
                            className="truncate text-sm font-medium hover:text-primary hover:underline"
                          >
                            {formatarDataHora(atendimento.iniciadoEm)}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {atendimento.profissionalNome} · {atendimento.templateNome ?? 'sem template'}
                          </p>
                        </div>
                        <Badge variant={atendimento.finalizado ? 'success' : 'warning'}>
                          {atendimento.statusLabel}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {pode('documentos:ler') ? (
          <TabsContent value="documentos">
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Documentos emitidos</CardTitle>
                {pode('documentos:emitir') ? (
                  <Button size="sm" asChild>
                    <Link href={`/documentos?pacienteId=${pacienteId}`}>
                      <FileText aria-hidden />
                      Emitir documento
                    </Link>
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                {documentos.isLoading ? (
                  <TabelaSkeleton linhas={3} />
                ) : (documentos.data?.items ?? []).length === 0 ? (
                  <EstadoVazio titulo="Nenhum documento emitido" icone={FileText} />
                ) : (
                  <ul className="divide-y">
                    {(documentos.data?.items ?? []).map((documento) => (
                      <li key={documento.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <Link
                            href={`/documentos/${documento.id}`}
                            className="truncate text-sm font-medium hover:text-primary hover:underline"
                          >
                            {documento.tipoLabel} {documento.numeroFormatado}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {formatarDataHora(documento.createdAt)} · {documento.profissionalNome}
                          </p>
                        </div>
                        <Badge variant={documento.status === 'emitido' ? 'success' : 'secondary'}>
                          {documento.statusLabel}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        {ehClinico ? (
          <TabsContent value="anexos">
            <Card>
              <CardHeader>
                <CardTitle>Anexos do paciente</CardTitle>
              </CardHeader>
              <CardContent>
                <AnexosPaciente pacienteId={pacienteId} podeEditar={pode('prontuario:escrever')} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="lgpd">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Consentimento e direitos do titular</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Campo
                  rotulo="Consentimento LGPD"
                  valor={paciente.consentimentoLgpd.concedido ? 'Concedido' : 'Não registrado'}
                />
                <Campo
                  rotulo="Concedido em"
                  valor={paciente.consentimentoLgpd.em ? formatarDataHora(paciente.consentimentoLgpd.em) : '—'}
                />
                <Campo rotulo="Origem do registro" valor={paciente.consentimentoLgpd.origem} />
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {pode('pacientes:exportar') ? (
                    <Button variant="outline" onClick={() => exportar.mutate()} carregando={exportar.isPending}>
                      <Download aria-hidden />
                      Exportar dados do paciente
                    </Button>
                  ) : null}
                  {pode('pacientes:inativar') ? (
                    <Button
                      variant={paciente.ativo ? 'destructive' : 'outline'}
                      onClick={() => setConfirmandoInativacao(true)}
                    >
                      {paciente.ativo ? <Trash2 aria-hidden /> : <RotateCcw aria-hidden />}
                      {paciente.ativo ? 'Inativar cadastro' : 'Reativar cadastro'}
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  A v1.0 não permite exclusão física: o cadastro é inativado e o histórico permanece
                  disponível para auditoria.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registros de acesso</CardTitle>
              </CardHeader>
              <CardContent>
                {!pode('auditoria:ler') ? (
                  <p className="text-sm text-muted-foreground">
                    A trilha de auditoria é visível para administradores da rede.
                  </p>
                ) : (acessos.data?.items ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum acesso registrado.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {(acessos.data?.items ?? []).map((registro) => (
                      <li key={registro.id} className="flex items-start justify-between gap-3 border-b pb-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{registro.descricao ?? registro.acao}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {registro.usuarioNome ?? 'sistema'} · {registro.entidade}
                          </p>
                        </div>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatarDataHora(registro.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent tamanho="lg">
          <DialogHeader>
            <DialogTitle>Editar paciente</DialogTitle>
            <DialogDescription>Todas as alterações são auditadas com valores antes/depois.</DialogDescription>
          </DialogHeader>
          <FormularioPaciente
            paciente={paciente}
            textoBotao="Salvar alterações"
            aoCancelar={() => setEditando(false)}
            aoSalvar={() => {
              setEditando(false);
              queryClient.invalidateQueries({ queryKey: ['paciente', pacienteId] });
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={confirmandoInativacao}
        aoMudar={setConfirmandoInativacao}
        titulo={paciente.ativo ? 'Inativar paciente' : 'Reativar paciente'}
        descricao={
          paciente.ativo
            ? 'O cadastro sai das listas e da agenda, mas o histórico clínico é preservado (exclusão lógica).'
            : 'O paciente voltará a aparecer nas buscas e poderá ser agendado novamente.'
        }
        textoConfirmar={paciente.ativo ? 'Inativar' : 'Reativar'}
        carregando={inativar.isPending}
        onConfirmar={() => inativar.mutate()}
      />

      <p className="text-xs text-muted-foreground">
        <IdCard className="mr-1 inline size-3" aria-hidden />
        Registro criado em {formatarDataHora(paciente.createdAt)} · atualizado em{' '}
        {formatarDataHora(paciente.updatedAt)} · fuso {timezone} ·{' '}
        {formatarNumero(atendimentos.data?.items.length)} atendimento(s) recentes
      </p>
    </div>
  );
}
