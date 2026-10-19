'use client';

import * as React from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Plus, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Card, CardContent } from '@/client/ui/card';
import { Button } from '@/client/ui/button';
import { Badge } from '@/client/ui/badge';
import { Input } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Alert, AlertDescription, EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import { ConfirmDialog } from '@/client/ui/overlay';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/client/ui/table';
import { EditorDocumento } from '@/client/components/documentos/editor-documento';
import { documentoService } from '@/client/services/documento.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { useAuth } from '@/client/providers/auth-provider';
import { formatarDataHora } from '@/client/lib/format';
import {
  TIPO_DOCUMENTO_LABELS,
  TIPOS_DOCUMENTO,
  TIPOS_DOCUMENTO_RECEPCAO,
  type TipoDocumento,
} from '@/modules/clinical-document/domain/value-objects/tipo-documento.vo';
import type { DocumentoDto } from '@/client/services/documento.service';

function DocumentosPageInterno() {
  const parametros = useSearchParams();
  const queryClient = useQueryClient();
  const { unidadeId } = useUnidadeAtiva();
  const { ehRecepcao, pode } = usePermissoes();
  const { profissionalId } = useAuth();

  const [tipoFiltro, setTipoFiltro] = React.useState('todos');
  const [statusFiltro, setStatusFiltro] = React.useState('todos');
  const [busca, setBusca] = React.useState('');
  const [emitindo, setEmitindo] = React.useState(false);
  const [cancelandoDocumento, setCancelandoDocumento] = React.useState<DocumentoDto | null>(null);
  const [motivo, setMotivo] = React.useState('');

  const atendimentoId = parametros.get('atendimentoId') ?? undefined;
  const pacienteId = parametros.get('pacienteId') ?? undefined;

  const consulta = useQuery({
    queryKey: ['documentos', { tipoFiltro, statusFiltro, pacienteId, atendimentoId }],
    queryFn: () =>
      documentoService.listar({
        pacienteId,
        atendimentoId,
        tipo: tipoFiltro === 'todos' ? undefined : tipoFiltro,
        status: statusFiltro === 'todos' ? undefined : statusFiltro,
        perPage: 50,
      }),
  });

  const tiposPermitidos = React.useMemo<TipoDocumento[]>(() => {
    if (ehRecepcao) return TIPOS_DOCUMENTO_RECEPCAO as TipoDocumento[];
    return TIPOS_DOCUMENTO;
  }, [ehRecepcao]);

  const cancelar = useMutation({
    mutationFn: () => documentoService.cancelar(cancelandoDocumento?.id as string, motivo),
    onSuccess: () => {
      toast.success('Documento cancelado');
      setCancelandoDocumento(null);
      setMotivo('');
      queryClient.invalidateQueries({ queryKey: ['documentos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const abrirPdf = useMutation({
    mutationFn: (documentoId: string) => documentoService.obterLink(documentoId),
    onSuccess: (link) => {
      if (!link.url) {
        toast.error('O PDF ainda não está disponível para este documento.');
        return;
      }
      window.open(link.url, '_blank', 'noopener,noreferrer');
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const itens = (consulta.data?.items ?? []).filter((documento) =>
    busca ? (documento.pacienteNome ?? '').toLowerCase().includes(busca.toLowerCase()) : true,
  );

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Documentos clínicos"
        descricao="Receitas, atestados, solicitações de exames e declarações de comparecimento — editáveis antes da emissão e imutáveis depois."
        acoes={
          pode('documentos:emitir') ? (
            <Button onClick={() => setEmitindo(true)} disabled={!unidadeId || !profissionalId}>
              <Plus aria-hidden />
              Novo documento
            </Button>
          ) : null
        }
      />

      {!profissionalId && pode('documentos:emitir') ? (
        <Alert variant="warning">
          <AlertDescription>
            Seu usuário não está vinculado a um profissional de saúde. Documentos exigem assinatura de um
            profissional cadastrado — peça a vinculação ao administrador da rede.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="documentos-busca" className="text-xs">
              Paciente
            </Label>
            <Input
              id="documentos-busca"
              value={busca}
              onChange={(evento) => setBusca(evento.target.value)}
              placeholder="Filtrar por nome"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                {tiposPermitidos.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {TIPO_DOCUMENTO_LABELS[tipo]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="rascunho">Rascunhos</SelectItem>
                <SelectItem value="emitido">Emitidos</SelectItem>
                <SelectItem value="cancelado">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {consulta.isLoading ? (
        <TabelaSkeleton linhas={6} />
      ) : itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum documento encontrado"
          descricao="Emita uma receita, atestado, solicitação de exames ou declaração a partir de um atendimento."
          icone={FileText}
        />
      ) : (
        <Card>
          <CardContent className="p-0 sm:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((documento) => (
                  <TableRow key={documento.id}>
                    <TableCell className="font-medium tabular-nums">{documento.numeroFormatado}</TableCell>
                    <TableCell>{documento.tipoLabel}</TableCell>
                    <TableCell>
                      <Link
                        href={`/pacientes/${documento.pacienteId}`}
                        className="hover:text-primary hover:underline"
                      >
                        {documento.pacienteNome ?? '—'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{documento.profissionalNome ?? '—'}</TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {documento.emitidoEm ? formatarDataHora(documento.emitidoEm) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          documento.status === 'emitido'
                            ? 'success'
                            : documento.status === 'cancelado'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {documento.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {documento.status === 'emitido' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirPdf.mutate(documento.id)}
                            carregando={abrirPdf.isPending && abrirPdf.variables === documento.id}
                          >
                            <Download aria-hidden />
                            PDF
                          </Button>
                        ) : null}
                        {documento.status !== 'cancelado' && pode('documentos:cancelar') ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelandoDocumento(documento)}
                            aria-label={`Cancelar ${documento.tipoLabel}`}
                          >
                            <XCircle className="text-destructive" aria-hidden />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={emitindo} onOpenChange={setEmitindo}>
        <DialogContent tamanho="xl">
          <DialogHeader>
            <DialogTitle>Novo documento</DialogTitle>
            <DialogDescription>
              O cabeçalho recebe automaticamente o logotipo, o endereço e o telefone da unidade. A numeração é
              sequencial por tipo.
            </DialogDescription>
          </DialogHeader>

          {unidadeId && profissionalId ? (
            <EditorDocumento
              unidadeId={unidadeId}
              profissionalId={profissionalId}
              atendimentoId={atendimentoId ?? null}
              pacienteInicial={null}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(cancelandoDocumento)}
        aoMudar={(aberto) => {
          if (!aberto) {
            setCancelandoDocumento(null);
            setMotivo('');
          }
        }}
        titulo="Cancelar documento"
        descricao={`O documento ${cancelandoDocumento?.numeroFormatado ?? ''} será invalidado. O PDF emitido permanece arquivado para auditoria, marcado como cancelado.`}
        textoConfirmar="Cancelar documento"
        carregando={cancelar.isPending}
        onConfirmar={() => {
          if (motivo.trim().length < 3) {
            toast.error('Informe o motivo do cancelamento');
            return;
          }
          cancelar.mutate();
        }}
        conteudo={
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="motivo-cancelamento-documento" className="text-xs">
              Motivo do cancelamento *
            </Label>
            <Input
              id="motivo-cancelamento-documento"
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              placeholder="Ex.: erro na dosagem"
            />
          </div>
        }
      />
    </div>
  );
}

/** `useSearchParams` exige um limite de Suspense na rota (§App Router). */
export default function DocumentosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
          Carregando documentos…
        </div>
      }
    >
      <DocumentosPageInterno />
    </Suspense>
  );
}
