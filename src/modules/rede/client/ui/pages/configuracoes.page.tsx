'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { LoadingScreen } from '@/client/ui/feedback/loading-screen.component';
import { FormField } from '@/client/ui/forms/form-field.component';
import { FormActions } from '@/client/ui/forms/form-actions.component';
import { aplicarTema } from '@/client/config/theme.config';
import { useAutenticacao } from '@/client/providers/auth-provider';
import { PRESETS_TEMA } from '../../../domain/value-objects/tema.vo';
import { redeApiService } from '../../services/rede-api.service';

export function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const { pode } = useAutenticacao();
  const [nome, setNome] = useState<string | null>(null);
  const [logotipoUrl, setLogotipoUrl] = useState<string | null>(null);

  const rede = useQuery({
    queryKey: ['rede'],
    queryFn: () => redeApiService.obter(),
  });

  const salvarDados = useMutation({
    mutationFn: () =>
      redeApiService.atualizar({
        nome: nome ?? rede.data?.nome,
        logotipoUrl: logotipoUrl ?? rede.data?.logotipoUrl ?? null,
      }),
    onSuccess: () => {
      toast.success('Dados da rede atualizados');
      void queryClient.invalidateQueries({ queryKey: ['rede'] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const aplicarPreset = useMutation({
    mutationFn: (preset: string) => redeApiService.atualizarTema({ preset }),
    onSuccess: (atualizada) => {
      aplicarTema({ cores: atualizada.tema.cores });
      toast.success('Tema aplicado em toda a rede');
      void queryClient.invalidateQueries({ queryKey: ['rede'] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const atualizarConfig = useMutation({
    mutationFn: (config: Record<string, boolean | number>) =>
      redeApiService.atualizar({ config }),
    onSuccess: () => {
      toast.success('Preferências salvas');
      void queryClient.invalidateQueries({ queryKey: ['rede'] });
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  if (rede.isLoading || !rede.data) return <LoadingScreen />;

  const dados = rede.data;
  const somenteLeitura = !pode('rede:configurar');

  return (
    <PageContainer>
      <PageTitle
        titulo="Configurações da rede"
        descricao="Identidade visual, dados cadastrais e preferências de notificação."
      />

      <Card>
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
          <CardDescription>Nome e logotipo exibidos nos documentos clínicos.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField rotulo="Nome da rede">
            <Input
              value={nome ?? dados.nome}
              disabled={somenteLeitura}
              onChange={(evento) => setNome(evento.target.value)}
            />
          </FormField>
          <FormField rotulo="CNPJ">
            <Input value={dados.cnpjFormatado ?? '—'} disabled />
          </FormField>
          <FormField rotulo="URL do logotipo" className="sm:col-span-2">
            <Input
              value={logotipoUrl ?? dados.logotipoUrl ?? ''}
              disabled={somenteLeitura}
              placeholder="https://… ou chave do storage (logos/{rede_id}/logo.png)"
              onChange={(evento) => setLogotipoUrl(evento.target.value)}
            />
          </FormField>
        </CardContent>
        {!somenteLeitura ? (
          <CardContent>
            <FormActions>
              <Button onClick={() => salvarDados.mutate()} disabled={salvarDados.isPending}>
                Salvar
              </Button>
            </FormActions>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" aria-hidden />
            Tema da rede
          </CardTitle>
          <CardDescription>
            A troca é aplicada imediatamente para todos os usuários da rede.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS_TEMA.map((preset) => {
            const ativo = dados.tema.preset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                disabled={somenteLeitura || aplicarPreset.isPending}
                onClick={() => aplicarPreset.mutate(preset.id)}
                className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                <span className="flex items-center gap-3">
                  <span
                    className="h-8 w-8 rounded-full border"
                    style={{ backgroundColor: `hsl(${preset.cores.primary})` }}
                    aria-hidden
                  />
                  <span className="text-sm font-medium">{preset.nome}</span>
                </span>
                {ativo ? <Check className="h-4 w-4 text-primary" aria-hidden /> : null}
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
          <CardDescription>
            Define os canais usados nas confirmações e lembretes automáticos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="lembrete-whatsapp">Lembrete por WhatsApp</Label>
            <Switch
              id="lembrete-whatsapp"
              checked={dados.config.lembreteWhatsapp}
              disabled={somenteLeitura}
              onCheckedChange={(valor) => atualizarConfig.mutate({ lembreteWhatsapp: valor })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="lembrete-email">Lembrete por e-mail</Label>
            <Switch
              id="lembrete-email"
              checked={dados.config.lembreteEmail}
              disabled={somenteLeitura}
              onCheckedChange={(valor) => atualizarConfig.mutate({ lembreteEmail: valor })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="confirmacao">Confirmação automática ao agendar</Label>
            <Switch
              id="confirmacao"
              checked={dados.config.confirmacaoAutomatica}
              disabled={somenteLeitura}
              onCheckedChange={(valor) => atualizarConfig.mutate({ confirmacaoAutomatica: valor })}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Antecedência do lembrete</span>
            <Badge variant="secondary">{dados.config.antecedenciaLembreteHoras}h</Badge>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm">Fuso horário padrão</span>
            <Badge variant="secondary">{dados.config.fusoHorario}</Badge>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
