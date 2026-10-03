'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Image as ImageIcon, Palette, Save, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Alert, AlertDescription, Skeleton } from '@/client/ui/feedback';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/ui/controls';
import { ConfirmDialog } from '@/client/ui/overlay';
import { TabelaTiposAtendimento } from '@/client/components/configuracoes/tabela-tipos-atendimento';
import { organizacaoService } from '@/client/services/organizacao.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useOrganizacao } from '@/client/hooks/use-organizacao';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { TEMA_PRESETS } from '@/modules/organization/domain/value-objects/tema.vo';
import { ALLOWED_LOGO_MIME_TYPES, MAX_UPLOAD_SIZE_MB } from '@/shared/constants/upload.constants';

/** Tokens de cor personalizáveis pelo administrador da rede (§3.7). */
type TokenTema = 'primary' | 'primaryForeground' | 'accent' | 'accentForeground' | 'sidebar';

const TOKENS_EDITAVEIS: { chave: TokenTema; rotulo: string }[] = [
  { chave: 'primary', rotulo: 'Cor primária' },
  { chave: 'primaryForeground', rotulo: 'Texto sobre a primária' },
  { chave: 'accent', rotulo: 'Cor de destaque' },
  { chave: 'accentForeground', rotulo: 'Texto sobre o destaque' },
  { chave: 'sidebar', rotulo: 'Barra lateral' },
];

const MIMES_LOGO = ALLOWED_LOGO_MIME_TYPES as readonly string[];

export default function ConfiguracoesPage() {
  const queryClient = useQueryClient();
  const { pode, ehAdmin } = usePermissoes();
  const { organizacao, carregando } = useOrganizacao();

  const [nome, setNome] = React.useState('');
  const [razaoSocial, setRazaoSocial] = React.useState('');
  const [cnpj, setCnpj] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [telefone, setTelefone] = React.useState('');
  const [preset, setPreset] = React.useState('azul-saude');
  const [coresLight, setCoresLight] = React.useState<Partial<Record<TokenTema, string>>>({});
  const [coresDark, setCoresDark] = React.useState<Partial<Record<TokenTema, string>>>({});
  const [removendoLogo, setRemovendoLogo] = React.useState(false);
  const logoRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!organizacao) return;
    setNome(organizacao.nome);
    setRazaoSocial(organizacao.razaoSocial ?? '');
    setCnpj(organizacao.cnpj ?? '');
    setEmail(organizacao.email ?? '');
    setTelefone(organizacao.telefone ?? '');
    setPreset(organizacao.tema.preset);
    setCoresLight({});
    setCoresDark({});
  }, [organizacao]);

  const salvarOrganizacao = useMutation({
    mutationFn: () =>
      organizacaoService.atualizar({
        nome,
        razaoSocial: razaoSocial || null,
        cnpj: cnpj || null,
        email: email || null,
        telefone: telefone || null,
      }),
    onSuccess: () => {
      toast.success('Dados da rede atualizados');
      queryClient.invalidateQueries({ queryKey: ['organizacao'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const salvarTema = useMutation({
    mutationFn: () =>
      organizacaoService.atualizarTema({ preset, coresLight, coresDark }),
    onSuccess: () => {
      toast.success('Tema aplicado — a mudança vale para toda a rede, sem recarregar a página');
      queryClient.invalidateQueries({ queryKey: ['organizacao'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const enviarLogo = useMutation({
    mutationFn: async (arquivo: File) => {
      if (!MIMES_LOGO.includes(arquivo.type)) {
        throw new Error('Use JPG, PNG ou SVG para o logotipo.');
      }
      if (arquivo.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        throw new Error(`O logotipo deve ter no máximo ${MAX_UPLOAD_SIZE_MB} MB.`);
      }

      return organizacaoService.definirLogotipo({ arquivo });
    },
    onSuccess: () => {
      toast.success('Logotipo atualizado');
      queryClient.invalidateQueries({ queryKey: ['organizacao'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const removerLogo = useMutation({
    mutationFn: () => organizacaoService.definirLogotipo({ remover: true }),
    onSuccess: () => {
      toast.success('Logotipo removido');
      setRemovendoLogo(false);
      queryClient.invalidateQueries({ queryKey: ['organizacao'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  if (carregando) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const presetAtual = TEMA_PRESETS.find((item) => item.id === preset) ?? TEMA_PRESETS[0];
  const light = { ...presetAtual.light, ...coresLight };
  const dark = { ...presetAtual.dark, ...coresDark };

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Configurações da rede"
        descricao="Dados cadastrais, identidade visual e tipos de atendimento. Somente o administrador da rede altera o tema e o logotipo."
      />

      <Tabs defaultValue="rede">
        <TabsList>
          <TabsTrigger value="rede">Dados da rede</TabsTrigger>
          <TabsTrigger value="tema">Identidade visual</TabsTrigger>
          <TabsTrigger value="tipos">Tipos de atendimento</TabsTrigger>
        </TabsList>

        <TabsContent value="rede">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground" aria-hidden />
                Dados cadastrais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="rede-nome">Nome da rede *</Label>
                <Input id="rede-nome" value={nome} onChange={(evento) => setNome(evento.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rede-razao">Razão social</Label>
                <Input
                  id="rede-razao"
                  value={razaoSocial}
                  onChange={(evento) => setRazaoSocial(evento.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rede-cnpj">CNPJ</Label>
                <Input id="rede-cnpj" value={cnpj} onChange={(evento) => setCnpj(evento.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rede-email">E-mail</Label>
                <Input
                  id="rede-email"
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rede-telefone">Telefone</Label>
                <Input
                  id="rede-telefone"
                  value={telefone}
                  onChange={(evento) => setTelefone(evento.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Badge variant="outline">Identificador da rede: {organizacao?.slug ?? organizacao?.id}</Badge>
              </div>
              <div className="flex justify-end sm:col-span-2">
                <Button
                  onClick={() => salvarOrganizacao.mutate()}
                  carregando={salvarOrganizacao.isPending}
                  disabled={!pode('organizacao:editar') || nome.trim().length < 2}
                >
                  <Save aria-hidden />
                  Salvar dados
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tema">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="size-4 text-muted-foreground" aria-hidden />
                  Presets de cores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!ehAdmin ? (
                  <Alert variant="warning">
                    <AlertDescription>
                      O tema é exclusivo do administrador da rede. Você pode visualizar os presets, mas não
                      salvar alterações.
                    </AlertDescription>
                  </Alert>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  {TEMA_PRESETS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setPreset(item.id);
                        setCoresLight({});
                        setCoresDark({});
                      }}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        preset === item.id ? 'border-primary ring-1 ring-primary' : 'hover:bg-accent'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex gap-1">
                          {[item.light.primary, item.light.accent, item.light.sidebar].map((cor) => (
                            <span
                              key={cor}
                              aria-hidden
                              className="size-5 rounded-full border"
                              style={{ backgroundColor: `hsl(${cor})` }}
                            />
                          ))}
                        </span>
                        <span className="text-sm font-medium">{item.nome}</span>
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">{item.descricao}</span>
                    </button>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  O tema altera apenas as cores: tipografia, espaçamento e layout permanecem os do design system
                  (§3.7).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ajuste fino das cores</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {TOKENS_EDITAVEIS.map((token) => (
                  <div key={token.chave} className="grid gap-3 sm:grid-cols-[10rem_1fr] sm:items-center">
                    <Label className="text-xs">{token.rotulo}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { modo: 'light' as const, valor: light[token.chave], setter: setCoresLight },
                          { modo: 'dark' as const, valor: dark[token.chave], setter: setCoresDark },
                        ]
                      ).map((coluna) => (
                        <div key={coluna.modo} className="space-y-1">
                          <Input
                            value={coluna.valor}
                            onChange={(evento) =>
                              coluna.setter((anterior) => ({ ...anterior, [token.chave]: evento.target.value }))
                            }
                            disabled={!ehAdmin}
                            aria-label={`${token.rotulo} (${coluna.modo === 'light' ? 'claro' : 'escuro'})`}
                          />
                          <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span
                              aria-hidden
                              className="inline-block size-4 rounded border"
                              style={{ backgroundColor: `hsl(${coluna.valor})` }}
                            />
                            {coluna.modo === 'light' ? 'claro' : 'escuro'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <Alert variant="info">
                  <AlertDescription>
                    Os valores usam o formato HSL do design system: <code>matiz saturação% luminosidade%</code>{' '}
                    (ex.: <code>199 89% 48%</code>). Nunca informe códigos hexadecimais aqui.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button
                    onClick={() => salvarTema.mutate()}
                    carregando={salvarTema.isPending}
                    disabled={!ehAdmin || !pode('tema:editar')}
                  >
                    <Save aria-hidden />
                    Aplicar tema
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="size-4 text-muted-foreground" aria-hidden />
                  Logotipo da rede
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex size-24 items-center justify-center rounded-lg border bg-muted/40">
                  {organizacao?.logotipoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={organizacao.logotipoUrl}
                      alt={`Logotipo de ${organizacao.nome}`}
                      className="max-h-20 max-w-20 object-contain"
                    />
                  ) : (
                    <ImageIcon className="size-6 text-muted-foreground" aria-hidden />
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    JPG, PNG ou SVG até 5 MB. O logotipo aparece no cabeçalho dos documentos clínicos emitidos por
                    todas as unidades da rede.
                  </p>

                  <input
                    ref={logoRef}
                    type="file"
                    accept={MIMES_LOGO.join(',')}
                    className="hidden"
                    onChange={(evento) => {
                      const arquivo = evento.target.files?.[0];
                      if (arquivo) enviarLogo.mutate(arquivo);
                    }}
                  />

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => logoRef.current?.click()}
                      carregando={enviarLogo.isPending}
                      disabled={!ehAdmin}
                    >
                      <Upload aria-hidden />
                      {organizacao?.logotipoUrl ? 'Substituir logotipo' : 'Enviar logotipo'}
                    </Button>
                    {organizacao?.logotipoUrl && ehAdmin ? (
                      <Button variant="ghost" onClick={() => setRemovendoLogo(true)}>
                        <Trash2 className="text-destructive" aria-hidden />
                        Remover
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tipos">
          <TabelaTiposAtendimento />
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sobre a configuração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <Textarea
            readOnly
            rows={3}
            value={
              'As configurações de rede são aplicadas a todas as unidades. Preferências de agenda, duração padrão de atendimento e fontes pagadoras são ajustadas nos tipos de atendimento e no cadastro de cada unidade.'
            }
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        aberto={removendoLogo}
        aoMudar={setRemovendoLogo}
        titulo="Remover logotipo"
        descricao="Os documentos emitidos anteriormente mantêm o logotipo já gravado no PDF. Novos documentos saem sem imagem."
        textoConfirmar="Remover"
        carregando={removerLogo.isPending}
        onConfirmar={() => removerLogo.mutate()}
      />
    </div>
  );
}
