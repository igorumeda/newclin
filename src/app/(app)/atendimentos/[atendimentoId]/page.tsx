'use client';

import * as React from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Ban, CheckCircle2, FileText, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent } from '@/client/ui/card';
import { Alert, AlertDescription, EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import { ConfirmDialog } from '@/client/ui/overlay';
import {
  FormularioProntuario,
  type CamposFixosValores,
} from '@/client/components/prontuario/formulario-prontuario';
import { prontuarioService } from '@/client/services/prontuario.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import type { DadosPreenchidos, ValorCampo } from '@/modules/medical-record/domain/value-objects/dados-prontuario.vo';

const CAMPOS_VAZIOS: CamposFixosValores = {
  queixaPrincipal: '',
  anamnese: '',
  exameFisico: '',
  hipoteseDiagnostica: '',
  cid: '',
  conduta: '',
};

export default function AtendimentoPage() {
  const parametros = useParams<{ atendimentoId: string }>();
  const atendimentoId = parametros.atendimentoId;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { pode } = usePermissoes();

  const [valoresFixos, setValoresFixos] = React.useState<CamposFixosValores>(CAMPOS_VAZIOS);
  const [valoresDinamicos, setValoresDinamicos] = React.useState<DadosPreenchidos>({});
  const [avisos, setAvisos] = React.useState<string[]>([]);
  const [cancelando, setCancelando] = React.useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = React.useState('');
  const [confirmarFinalizacao, setConfirmarFinalizacao] = React.useState(false);
  const [adendoAberto, setAdendoAberto] = React.useState(false);
  const [textoAdendo, setTextoAdendo] = React.useState('');

  const consulta = useQuery({
    queryKey: ['atendimento', atendimentoId],
    queryFn: () => prontuarioService.obterAtendimento(atendimentoId),
  });

  // Hidrata o formulário com o conteúdo já gravado.
  React.useEffect(() => {
    if (!consulta.data) return;
    const { atendimento } = consulta.data;

    setValoresFixos({
      queixaPrincipal: atendimento.queixaPrincipal ?? '',
      anamnese: atendimento.anamnese ?? '',
      exameFisico: atendimento.exameFisico ?? '',
      hipoteseDiagnostica: atendimento.hipoteseDiagnostica ?? '',
      cid: atendimento.cid ?? '',
      conduta: atendimento.conduta ?? '',
    });
    setValoresDinamicos(atendimento.dadosPreenchidos ?? {});
  }, [consulta.data]);

  const salvar = useMutation({
    mutationFn: () =>
      prontuarioService.salvarRascunho(atendimentoId, {
        camposFixos: valoresFixos,
        dadosPreenchidos: valoresDinamicos,
      }),
    onSuccess: (resultado) => {
      setAvisos(resultado.avisos);
      toast.success(resultado.avisos.length > 0 ? 'Rascunho salvo com pendências' : 'Rascunho salvo');
      queryClient.invalidateQueries({ queryKey: ['atendimento', atendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const finalizar = useMutation({
    mutationFn: async () => {
      await prontuarioService.salvarRascunho(atendimentoId, {
        camposFixos: valoresFixos,
        dadosPreenchidos: valoresDinamicos,
      });
      return prontuarioService.finalizarAtendimento(atendimentoId);
    },
    onSuccess: () => {
      toast.success('Atendimento finalizado — o prontuário agora é imutável');
      setConfirmarFinalizacao(false);
      setAvisos([]);
      queryClient.invalidateQueries({ queryKey: ['atendimento', atendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const cancelar = useMutation({
    mutationFn: () => prontuarioService.cancelarAtendimento(atendimentoId, motivoCancelamento),
    onSuccess: () => {
      toast.success('Atendimento cancelado');
      setCancelando(false);
      queryClient.invalidateQueries({ queryKey: ['atendimento', atendimentoId] });
      queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const adendo = useMutation({
    mutationFn: (entrada: { conteudo: string; tipo: string }) =>
      prontuarioService.adicionarAdendo(atendimentoId, entrada),
    onSuccess: () => {
      toast.success('Adendo registrado');
      setAdendoAberto(false);
      setTextoAdendo('');
      queryClient.invalidateQueries({ queryKey: ['atendimento', atendimentoId] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  if (consulta.isLoading) return <TabelaSkeleton linhas={8} />;

  if (consulta.isError || !consulta.data) {
    return (
      <EstadoVazio
        titulo="Atendimento não encontrado"
        descricao="O prontuário pode ter sido cancelado ou pertencer a outra unidade."
        acao={
          <Button asChild variant="outline">
            <Link href="/atendimentos">Voltar para atendimentos</Link>
          </Button>
        }
      />
    );
  }

  const { atendimento } = consulta.data;
  const somenteLeitura = atendimento.finalizado || atendimento.status === 'cancelado';
  const problemas = (consulta.data as { problemas?: { campoId: string; rotulo: string; motivo: string }[] }).problemas ?? [];

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Prontuário"
        descricao={`Atendimento de ${atendimento.pacienteNome ?? 'paciente'} iniciado em ${atendimento.iniciadoEm.slice(0, 16).replace('T', ' ')}`}
        acoes={
          <>
            <Button variant="outline" onClick={() => router.push('/atendimentos')}>
              <ArrowLeft aria-hidden />
              Voltar
            </Button>
            {pode('documentos:emitir') && atendimento.finalizado ? (
              <Button variant="outline" asChild>
                <Link href={`/documentos?atendimentoId=${atendimentoId}&pacienteId=${atendimento.pacienteId}`}>
                  <FileText aria-hidden />
                  Emitir documento
                </Link>
              </Button>
            ) : null}
            {pode('prontuario:escrever') && !somenteLeitura ? (
              <Button variant="destructive" onClick={() => setCancelando(true)}>
                <Ban aria-hidden />
                Cancelar atendimento
              </Button>
            ) : null}
          </>
        }
      />

      {atendimento.status === 'cancelado' ? (
        <Alert variant="destructive">
          <AlertDescription>
            Este atendimento foi cancelado e não pode mais ser editado. O histórico permanece disponível para
            auditoria.
          </AlertDescription>
        </Alert>
      ) : null}

      <FormularioProntuario
        detalhe={consulta.data}
        valoresFixos={valoresFixos}
        valoresDinamicos={valoresDinamicos}
        aoMudarFixo={(chave, valor) => setValoresFixos((anterior) => ({ ...anterior, [chave]: valor }))}
        aoMudarDinamico={(campoId: string, valor: ValorCampo) =>
          setValoresDinamicos((anterior) => ({ ...anterior, [campoId]: valor }))
        }
        problemas={problemas}
        avisos={avisos}
        salvando={salvar.isPending}
        finalizando={finalizar.isPending}
        bloqueado={somenteLeitura || !pode('prontuario:escrever')}
        aoSalvar={() => salvar.mutate()}
        aoFinalizar={() => setConfirmarFinalizacao(true)}
        aoVerDocumentos={
          pode('documentos:ler')
            ? () => router.push(`/documentos?atendimentoId=${atendimentoId}`)
            : undefined
        }
      />

      {atendimento.finalizado && pode('prontuario:adendo') ? (
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Registrar adendo</p>
              <p className="text-xs text-muted-foreground">
                O conteúdo do prontuário é imutável após a finalização — correções são feitas por adendo
                assinado, conforme boas práticas de registro clínico.
              </p>
            </div>
            <Button onClick={() => setAdendoAberto(true)} carregando={adendo.isPending}>
              <FileText aria-hidden />
              Adicionar adendo
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={adendoAberto} onOpenChange={setAdendoAberto}>
        <DialogContent tamanho="md">
          <DialogHeader>
            <DialogTitle>Registrar adendo</DialogTitle>
            <DialogDescription>
              O adendo é anexado ao prontuário finalizado, com autoria e data/hora, sem alterar o conteúdo
              original.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="texto-adendo">Descrição do adendo *</Label>
            <Textarea
              id="texto-adendo"
              rows={5}
              value={textoAdendo}
              placeholder="Ex.: resultado do exame solicitado, correção de conduta, informação complementar."
              onChange={(evento) => setTextoAdendo(evento.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Mínimo de 10 caracteres ({textoAdendo.trim().length}/10).
            </p>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setAdendoAberto(false)}>
              Voltar
            </Button>
            <Button
              disabled={textoAdendo.trim().length < 10}
              carregando={adendo.isPending}
              onClick={() => adendo.mutate({ conteudo: textoAdendo.trim(), tipo: 'adendo' })}
            >
              <FileText aria-hidden />
              Registrar adendo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelando} onOpenChange={setCancelando}>
        <DialogContent tamanho="sm">
          <DialogHeader>
            <DialogTitle>Cancelar atendimento</DialogTitle>
            <DialogDescription>
              O atendimento sai das listas e o prontuário permanece no histórico com o motivo registrado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="motivo-atendimento">Motivo *</Label>
            <Textarea
              id="motivo-atendimento"
              rows={3}
              value={motivoCancelamento}
              onChange={(evento) => setMotivoCancelamento(evento.target.value)}
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setCancelando(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={motivoCancelamento.trim().length < 3}
              carregando={cancelar.isPending}
              onClick={() => cancelar.mutate()}
            >
              <Ban aria-hidden />
              Cancelar atendimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={confirmarFinalizacao}
        aoMudar={setConfirmarFinalizacao}
        titulo="Finalizar atendimento"
        descricao="Após a finalização o prontuário fica imutável. Confirme que os campos obrigatórios (queixa principal, anamnese e conduta) estão preenchidos."
        textoConfirmar="Finalizar"
        carregando={finalizar.isPending}
        onConfirmar={() => finalizar.mutate()}
      >
        <span className="hidden">
          <Stethoscope aria-hidden />
          <CheckCircle2 aria-hidden />
        </span>
      </ConfirmDialog>
    </div>
  );
}
