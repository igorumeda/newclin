'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FileCheck2, FileSignature, Lock, Save, StickyNote } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { BreadcrumbNav } from '@/client/ui/navigation/breadcrumb-nav.component';
import { LoadingScreen } from '@/client/ui/feedback/loading-screen.component';
import { ErrorFallback } from '@/client/ui/feedback/error-fallback.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { FormActions } from '@/client/ui/forms/form-actions.component';
import type {
  CamposFixosAtendimento,
  DadosPreenchidos,
  FontePagadora,
  ValorCampo,
} from '../../../domain/entities/atendimento.entity';
import { EmitirDocumentoDialog } from '@/modules/documento/client/ui/components/emitir-documento.dialog';
import { CampoDinamico } from '../components/campo-dinamico.component';
import { prontuarioApiService } from '../../services/prontuario-api.service';

export type AtendimentoPageProps = { atendimentoId: string };

const CAMPOS_FIXOS_VAZIOS: CamposFixosAtendimento = {
  queixaPrincipal: '',
  anamnese: '',
  exameFisico: '',
  hipoteseDiagnostica: '',
  cid10: '',
  conduta: '',
};

function dataHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(iso),
  );
}

export function AtendimentoPage({ atendimentoId }: AtendimentoPageProps) {
  const queryClient = useQueryClient();
  const [camposFixos, setCamposFixos] = useState<CamposFixosAtendimento>(CAMPOS_FIXOS_VAZIOS);
  const [dadosPreenchidos, setDadosPreenchidos] = useState<DadosPreenchidos>({});
  const [fontePagadora, setFontePagadora] = useState<FontePagadora>('publico');
  const [novoAdendo, setNovoAdendo] = useState('');
  const [documentosAberto, setDocumentosAberto] = useState(false);

  const atendimento = useQuery({
    queryKey: ['atendimentos', atendimentoId],
    queryFn: () => prontuarioApiService.obterAtendimento({ id: atendimentoId }),
  });

  useEffect(() => {
    if (!atendimento.data) return;
    setCamposFixos({ ...CAMPOS_FIXOS_VAZIOS, ...atendimento.data.atendimento.camposFixos });
    setDadosPreenchidos(atendimento.data.atendimento.dadosPreenchidos);
    setFontePagadora(atendimento.data.atendimento.fontePagadora);
  }, [atendimento.data]);

  const salvar = useMutation({
    mutationFn: () =>
      prontuarioApiService.salvarAtendimento({
        id: atendimentoId,
        camposFixos,
        dadosPreenchidos,
        fontePagadora,
      }),
    onSuccess: () => {
      toast.success('Rascunho salvo');
      void queryClient.invalidateQueries({ queryKey: ['atendimentos', atendimentoId] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const finalizar = useMutation({
    mutationFn: () =>
      prontuarioApiService.finalizarAtendimento({
        id: atendimentoId,
        camposFixos,
        dadosPreenchidos,
        fontePagadora,
      }),
    onSuccess: () => {
      toast.success('Atendimento finalizado. O prontuário agora é imutável.');
      void queryClient.invalidateQueries({ queryKey: ['atendimentos'] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const adicionarAdendo = useMutation({
    mutationFn: () =>
      prontuarioApiService.adicionarAdendo({ id: atendimentoId, conteudo: novoAdendo }),
    onSuccess: () => {
      toast.success('Adendo registrado');
      setNovoAdendo('');
      void queryClient.invalidateQueries({ queryKey: ['atendimentos', atendimentoId] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  if (atendimento.isLoading) return <LoadingScreen mensagem="Carregando prontuário…" />;
  if (atendimento.isError || !atendimento.data) {
    return (
      <PageContainer>
        <ErrorFallback mensagem="Atendimento não encontrado" />
      </PageContainer>
    );
  }

  const { atendimento: dados, template, adendos, anexos } = atendimento.data;
  const finalizado = dados.status === 'finalizado';

  function alterarCampoFixo(campo: keyof CamposFixosAtendimento, valor: string): void {
    setCamposFixos((atual) => ({ ...atual, [campo]: valor }));
  }

  function alterarCampoDinamico(campoId: string, valor: ValorCampo): void {
    setDadosPreenchidos((atual) => ({ ...atual, [campoId]: valor }));
  }

  return (
    <PageContainer>
      <BreadcrumbNav
        itens={[
          { titulo: 'Pacientes', href: '/pacientes' },
          { titulo: 'Prontuário', href: `/pacientes/${dados.pacienteId}` },
          { titulo: 'Atendimento' },
        ]}
      />

      <PageTitle
        titulo="Prontuário do atendimento"
        descricao={`Iniciado em ${dataHora(dados.iniciadoEm)}${
          template ? ` · ${template.nome} (v${dados.templateVersao ?? template.versao})` : ''
        }`}
        acoes={
          <>
            <Badge variant={finalizado ? 'success' : 'warning'}>
              {finalizado ? 'Finalizado' : 'Em andamento'}
            </Badge>
            <Button variant="outline" onClick={() => setDocumentosAberto(true)}>
              <FileSignature className="h-4 w-4" aria-hidden />
              Documentos
            </Button>
            {!finalizado ? (
              <>
                <Button variant="outline" onClick={() => salvar.mutate()} disabled={salvar.isPending}>
                  <Save className="h-4 w-4" aria-hidden />
                  Salvar rascunho
                </Button>
                <Button onClick={() => finalizar.mutate()} disabled={finalizar.isPending}>
                  <FileCheck2 className="h-4 w-4" aria-hidden />
                  Finalizar
                </Button>
              </>
            ) : null}
          </>
        }
      />

      {finalizado ? (
        <Alert variant="info">
          <Lock className="h-4 w-4" aria-hidden />
          <AlertTitle>Prontuário imutável</AlertTitle>
          <AlertDescription>
            Atendimentos finalizados não podem ser editados. Use um adendo para complementar as
            informações.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Registro clínico</CardTitle>
          <CardDescription>Campos obrigatórios em qualquer especialidade.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField rotulo="Queixa principal" obrigatorio className="sm:col-span-2">
            <Textarea
              value={camposFixos.queixaPrincipal ?? ''}
              disabled={finalizado}
              onChange={(evento) => alterarCampoFixo('queixaPrincipal', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Anamnese" className="sm:col-span-2">
            <Textarea
              value={camposFixos.anamnese ?? ''}
              disabled={finalizado}
              onChange={(evento) => alterarCampoFixo('anamnese', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Exame físico" className="sm:col-span-2">
            <Textarea
              value={camposFixos.exameFisico ?? ''}
              disabled={finalizado}
              onChange={(evento) => alterarCampoFixo('exameFisico', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Hipótese diagnóstica">
            <Input
              value={camposFixos.hipoteseDiagnostica ?? ''}
              disabled={finalizado}
              onChange={(evento) => alterarCampoFixo('hipoteseDiagnostica', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="CID-10">
            <Input
              value={camposFixos.cid10 ?? ''}
              disabled={finalizado}
              placeholder="Ex.: J00"
              onChange={(evento) => alterarCampoFixo('cid10', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Conduta" obrigatorio className="sm:col-span-2">
            <Textarea
              value={camposFixos.conduta ?? ''}
              disabled={finalizado}
              onChange={(evento) => alterarCampoFixo('conduta', evento.target.value)}
            />
          </FormField>
          <FormField rotulo="Fonte pagadora">
            <Select
              value={fontePagadora}
              disabled={finalizado}
              onValueChange={(valor) => setFontePagadora(valor as FontePagadora)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="publico">Público</SelectItem>
                <SelectItem value="particular">Particular</SelectItem>
                <SelectItem value="convenio">Convênio</SelectItem>
              </SelectContent>
            </Select>
          </FormField>
        </CardContent>
      </Card>

      {template?.secoes.map((secao) => (
        <Card key={secao.id}>
          <CardHeader>
            <CardTitle>{secao.titulo}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {secao.campos.map((campo) => (
              <CampoDinamico
                key={campo.id}
                campo={campo}
                valor={dadosPreenchidos[campo.id] ?? null}
                somenteLeitura={finalizado}
                aoAlterar={(valor) => alterarCampoDinamico(campo.id, valor)}
              />
            ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" aria-hidden />
            Adendos
          </CardTitle>
          <CardDescription>
            Complementos registrados após a finalização, sem alterar o conteúdo original.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adendos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum adendo registrado.</p>
          ) : (
            <ul className="space-y-3">
              {adendos.map((adendo) => (
                <li key={adendo.id} className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">{dataHora(adendo.criadoEm)}</p>
                  <p className="mt-1 text-sm">{adendo.conteudo}</p>
                </li>
              ))}
            </ul>
          )}

          {finalizado ? (
            <div className="space-y-3">
              <FormField rotulo="Novo adendo">
                <Textarea
                  value={novoAdendo}
                  onChange={(evento) => setNovoAdendo(evento.target.value)}
                  placeholder="Descreva a complementação do registro clínico"
                />
              </FormField>
              <FormActions>
                <Button
                  onClick={() => adicionarAdendo.mutate()}
                  disabled={novoAdendo.trim().length < 5 || adicionarAdendo.isPending}
                >
                  Registrar adendo
                </Button>
              </FormActions>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <EmitirDocumentoDialog
        aberto={documentosAberto}
        unidadeId={dados.unidadeId}
        pacienteId={dados.pacienteId}
        atendimentoId={dados.id}
        profissionalId={dados.profissionalId}
        aoFechar={() => setDocumentosAberto(false)}
      />

      {anexos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Anexos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y text-sm">
              {anexos.map((anexo) => (
                <li key={anexo.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="truncate">{anexo.nomeArquivo}</span>
                  <span className="text-muted-foreground">
                    {(anexo.tamanhoBytes / 1024 / 1024).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
