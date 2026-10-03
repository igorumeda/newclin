'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Mail, MessageCircle, Play, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatCard } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/ui/controls';
import { Alert, AlertDescription, EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import { ConfirmDialog } from '@/client/ui/overlay';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/client/ui/table';
import { notificacaoService, type ModeloMensagemDto, type NotificacaoDto } from '@/client/services/notificacao.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { formatarDataHora } from '@/client/lib/format';

const VARIANTE_POR_STATUS: Record<string, 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  pendente: 'secondary',
  enviado: 'success',
  entregue: 'success',
  lido: 'info',
  respondido: 'info',
  falha: 'destructive',
  cancelado: 'secondary',
};

export default function NotificacoesPage() {
  const queryClient = useQueryClient();
  const { ehAdmin } = usePermissoes();

  const [canal, setCanal] = React.useState('todos');
  const [status, setStatus] = React.useState('todos');
  const [reenviando, setReenviando] = React.useState<NotificacaoDto | null>(null);
  const [modeloEmEdicao, setModeloEmEdicao] = React.useState<ModeloMensagemDto | null>(null);
  const [corpoModelo, setCorpoModelo] = React.useState('');
  const [assuntoModelo, setAssuntoModelo] = React.useState('');

  const consulta = useQuery({
    queryKey: ['notificacoes', { canal, status }],
    queryFn: () =>
      notificacaoService.listar({
        canal: canal === 'todos' ? undefined : canal,
        status: status === 'todos' ? undefined : status,
        perPage: 50,
      }),
    refetchInterval: 60_000,
  });

  const modelos = useQuery({
    queryKey: ['notificacoes', 'modelos'],
    queryFn: () => notificacaoService.listarModelos(),
  });

  const processarFila = useMutation({
    mutationFn: () => notificacaoService.processarFila(),
    onSuccess: (resultado) => {
      toast.success(
        `Fila processada: ${resultado.enviadas} enviada(s), ${resultado.falhas} falha(s) de ${resultado.processadas}.`,
      );
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const enfileirarLembretes = useMutation({
    mutationFn: () => notificacaoService.enfileirarLembretes(),
    onSuccess: (resultado) => {
      toast.success(
        `Lembretes enfileirados: ${resultado.lembretesEnfileirados} de ${resultado.agendamentosAnalisados} agendamento(s) analisado(s).`,
      );
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const reenviar = useMutation({
    mutationFn: () => notificacaoService.reenviar(reenviando?.id as string),
    onSuccess: () => {
      toast.success('Notificação reenfileirada');
      setReenviando(null);
      queryClient.invalidateQueries({ queryKey: ['notificacoes'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const salvarModelo = useMutation({
    mutationFn: () =>
      notificacaoService.salvarModelo({
        id: modeloEmEdicao?.id ?? null,
        canal: modeloEmEdicao?.canal ?? 'email',
        tipo: modeloEmEdicao?.tipo ?? 'confirmacao',
        assunto: assuntoModelo || null,
        corpo: corpoModelo,
        ativo: true,
      }),
    onSuccess: () => {
      toast.success('Modelo salvo');
      setModeloEmEdicao(null);
      queryClient.invalidateQueries({ queryKey: ['notificacoes', 'modelos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const itens = consulta.data?.items ?? [];
  const falhas = itens.filter((item) => item.status === 'falha').length;
  const pendentes = itens.filter((item) => item.status === 'pendente').length;
  const enviadas = itens.filter((item) => ['enviado', 'entregue', 'lido', 'respondido'].includes(item.status))
    .length;

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Notificações"
        descricao="Fila de e-mails e mensagens de WhatsApp para pacientes: confirmações, lembretes de 24 horas e envio de documentos."
        acoes={
          <>
            <Button
              variant="outline"
              onClick={() => enfileirarLembretes.mutate()}
              carregando={enfileirarLembretes.isPending}
            >
              <RefreshCw aria-hidden />
              Enfileirar lembretes
            </Button>
            <Button onClick={() => processarFila.mutate()} carregando={processarFila.isPending}>
              <Play aria-hidden />
              Processar fila agora
            </Button>
          </>
        }
      />

      <Alert variant="info">
        <AlertDescription>
          O envio é assíncrono: as mensagens entram na fila e são processadas pelos jobs
          (<code>/api/jobs/notificacoes/fila</code> e <code>/api/jobs/notificacoes/lembretes</code> — agende-os no
          cron com o segredo <code>CRON_SECRET</code>). Quando o WhatsApp não está configurado, o sistema usa o
          e-mail como fallback.
        </AlertDescription>
      </Alert>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard titulo="Na fila" valor={pendentes} icone={RefreshCw} />
        <StatCard titulo="Enviadas" valor={enviadas} icone={Send} />
        <StatCard titulo="Falhas" valor={falhas} icone={AlertTriangle} />
        <StatCard titulo="Modelos cadastrados" valor={modelos.data?.length ?? 0} icone={Mail} />
      </div>

      <Tabs defaultValue="fila">
        <TabsList>
          <TabsTrigger value="fila">Fila e histórico</TabsTrigger>
          <TabsTrigger value="modelos">Modelos de mensagem</TabsTrigger>
        </TabsList>

        <TabsContent value="fila">
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:p-4 sm:flex-row">
              <Select value={canal} onValueChange={setCanal}>
                <SelectTrigger className="sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os canais</SelectItem>
                  <SelectItem value="email">E-mail</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="pendente">Pendentes</SelectItem>
                  <SelectItem value="enviado">Enviadas</SelectItem>
                  <SelectItem value="entregue">Entregues</SelectItem>
                  <SelectItem value="lido">Lidas</SelectItem>
                  <SelectItem value="respondido">Respondidas</SelectItem>
                  <SelectItem value="falha">Falhas</SelectItem>
                  <SelectItem value="cancelado">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {consulta.isLoading ? (
            <TabelaSkeleton linhas={6} />
          ) : itens.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma notificação na fila"
              descricao="Confirmações de agendamento, lembretes e documentos emitidos aparecem aqui."
              icone={MessageCircle}
            />
          ) : (
            <Card>
              <CardContent className="p-0 sm:p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Agendada</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {itens.map((notificacao) => (
                      <TableRow key={notificacao.id}>
                        <TableCell>
                          <Badge variant={notificacao.canal === 'whatsapp' ? 'success' : 'info'}>
                            {notificacao.canalLabel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{notificacao.tipoLabel}</p>
                          <p className="max-w-xs truncate text-xs text-muted-foreground">
                            {notificacao.assunto ?? notificacao.conteudo}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">{notificacao.destinatario}</TableCell>
                        <TableCell className="text-xs tabular-nums text-muted-foreground">
                          {formatarDataHora(notificacao.agendadaPara)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={VARIANTE_POR_STATUS[notificacao.status] ?? 'secondary'}>
                            {notificacao.statusLabel}
                          </Badge>
                          {notificacao.ultimoErro ? (
                            <p className="mt-1 max-w-[16rem] truncate text-xs text-destructive" title={notificacao.ultimoErro}>
                              {notificacao.ultimoErro}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          {notificacao.status === 'falha' ? (
                            <Button variant="outline" size="sm" onClick={() => setReenviando(notificacao)}>
                              <RefreshCw aria-hidden />
                              Reenviar
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="modelos">
          <Card>
            <CardHeader>
              <CardTitle>Modelos por canal e tipo</CardTitle>
              <p className="text-xs text-muted-foreground">
                Use variáveis entre chaves — elas são substituídas no envio:
                <code className="ml-1">{'{{paciente}}'}</code>,{' '}
                <code>{'{{data}}'}</code>, <code>{'{{hora}}'}</code>, <code>{'{{unidade}}'}</code>,{' '}
                <code>{'{{profissional}}'}</code>.
              </p>
            </CardHeader>
            <CardContent className="p-0 sm:p-0">
              {modelos.isLoading ? (
                <TabelaSkeleton linhas={4} />
              ) : (modelos.data ?? []).length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum modelo personalizado — o sistema usa os modelos padrão do sistema.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Canal</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Variáveis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(modelos.data ?? []).map((modelo) => (
                      <TableRow key={modelo.id}>
                        <TableCell>
                          <Badge variant={modelo.canal === 'whatsapp' ? 'success' : 'info'}>
                            {modelo.canalLabel}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{modelo.tipoLabel}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{modelo.assunto ?? '—'}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {modelo.variaveis.join(', ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={modelo.ativo ? 'success' : 'secondary'}>
                            {modelo.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                          {modelo.isPadrao ? <Badge variant="outline">padrão</Badge> : null}
                        </TableCell>
                        <TableCell className="text-right">
                          {ehAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setModeloEmEdicao(modelo);
                                setCorpoModelo(modelo.corpo);
                                setAssuntoModelo(modelo.assunto ?? '');
                              }}
                            >
                              Editar
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(modeloEmEdicao)} onOpenChange={(aberto) => !aberto && setModeloEmEdicao(null)}>
        <DialogContent tamanho="md">
          <DialogHeader>
            <DialogTitle>Editar modelo — {modeloEmEdicao?.tipoLabel}</DialogTitle>
            <DialogDescription>
              Canal {modeloEmEdicao?.canalLabel}. As variáveis disponíveis são {modeloEmEdicao?.variaveis.join(', ')}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {modeloEmEdicao?.canal === 'email' ? (
              <div className="space-y-1.5">
                <Label htmlFor="modelo-assunto">Assunto</Label>
                <Input
                  id="modelo-assunto"
                  value={assuntoModelo}
                  onChange={(evento) => setAssuntoModelo(evento.target.value)}
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="modelo-corpo">Corpo da mensagem *</Label>
              <Textarea
                id="modelo-corpo"
                rows={8}
                value={corpoModelo}
                onChange={(evento) => setCorpoModelo(evento.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModeloEmEdicao(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => salvarModelo.mutate()}
              carregando={salvarModelo.isPending}
              disabled={corpoModelo.trim().length < 5}
            >
              Salvar modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        aberto={Boolean(reenviando)}
        aoMudar={(aberto) => !aberto && setReenviando(null)}
        titulo="Reenviar notificação"
        descricao={`A mensagem para ${reenviando?.destinatario ?? ''} volta para a fila e será processada no próximo ciclo do job.`}
        textoConfirmar="Reenfileirar"
        carregando={reenviar.isPending}
        onConfirmar={() => reenviar.mutate()}
      />
    </div>
  );
}
