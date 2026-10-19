'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Copy,
  Image as ImageIcon,
  Palette,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Alert, AlertDescription, Skeleton } from '@/client/ui/feedback';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { ColorPicker } from '@/client/ui/color-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/client/ui/dialog';
import { NovoPresetForm } from '@/client/components/configuracoes/novo-preset-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/ui/controls';
import { ConfirmDialog } from '@/client/ui/overlay';
import { TabelaTiposAtendimento } from '@/client/components/configuracoes/tabela-tipos-atendimento';
import { organizacaoService } from '@/client/services/organizacao.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { useOrganizacao } from '@/client/hooks/use-organizacao';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { Tema, TEMA_PRESETS } from '@/modules/organization/domain/value-objects/tema.vo';
import type {
  TemaProps,
  TemaCores,
  NovoTemaPreset,
  TemaPreset,
} from '@/modules/organization/domain/value-objects/tema.vo';
import {
  ALLOWED_LOGO_MIME_TYPES,
  MAX_UPLOAD_SIZE_MB,
} from '@/shared/constants/upload.constants';

/** Tokens de cor personalizáveis pelo administrador da rede (§3.7). */
type TokenTema = keyof TemaCores;
type SalvarTemaParams = {
  novoPreset?: NovoTemaPreset;
  tema?: TemaProps;
  editarPreset?: string;
  excluirPreset?: string;
};
type DuplicacaoPreset = { tema: TemaProps; valoresIniciais: NovoTemaPreset };
type DuplicarPresetHandler = (item: TemaPreset) => void;
type SalvarTemaHandler = (params: SalvarTemaParams) => void;

const TOKENS_EDITAVEIS: { chave: TokenTema; rotulo: string }[] = [
  { chave: 'primary', rotulo: 'Cor primária' },
  { chave: 'primaryForeground', rotulo: 'Texto sobre a primária' },
  { chave: 'secondary', rotulo: 'Cor secundária' },
  { chave: 'secondaryForeground', rotulo: 'Texto sobre a secundária' },
  { chave: 'accent', rotulo: 'Cor de destaque' },
  { chave: 'accentForeground', rotulo: 'Texto sobre o destaque' },
  { chave: 'background', rotulo: 'Fundo' },
  { chave: 'foreground', rotulo: 'Texto principal' },
  { chave: 'border', rotulo: 'Bordas' },
  { chave: 'sidebar', rotulo: 'Barra lateral' },
  { chave: 'sidebarForeground', rotulo: 'Texto da barra lateral' },
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
  const [preset, setPreset] = React.useState(TEMA_PRESETS[0].id);
  const [coresLight, setCoresLight] = React.useState<Partial<Record<TokenTema, string>>>(
    {},
  );
  const [coresDark, setCoresDark] = React.useState<Partial<Record<TokenTema, string>>>(
    {},
  );
  const [novoPresetAberto, setNovoPresetAberto] = React.useState(false);
  const [presetEmEdicao, setPresetEmEdicao] = React.useState<string | null>(null);
  const [presetParaExcluir, setPresetParaExcluir] = React.useState<TemaPreset | null>(
    null,
  );
  const [duplicacaoPreset, setDuplicacaoPreset] = React.useState<DuplicacaoPreset | null>(
    null,
  );
  const [removendoLogo, setRemovendoLogo] = React.useState(false);
  const logoRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!organizacao) return;
    setNome(organizacao.nome);
    setRazaoSocial(organizacao.razaoSocial ?? '');
    setCnpj(organizacao.cnpj ?? '');
    setEmail(organizacao.email ?? '');
    setTelefone(organizacao.telefone ?? '');
    const tema = Tema.reconstitute(organizacao.tema);
    setPreset(tema.preset);
    setCoresLight(tema.light);
    setCoresDark(tema.dark);
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
    mutationFn: (params: SalvarTemaParams) => {
      if (params.excluirPreset)
        return organizacaoService.atualizarTema({ excluirPreset: params.excluirPreset });
      if (params.editarPreset && params.novoPreset)
        return organizacaoService.atualizarTema({
          editarPreset: {
            id: params.editarPreset,
            ...params.novoPreset,
            coresLight: params.tema?.light,
            coresDark: params.tema?.dark,
          },
        });
      return organizacaoService.atualizarTema({
        preset: params.tema?.preset ?? preset,
        coresLight: params.tema?.light ?? light,
        coresDark: params.tema?.dark ?? dark,
        novoPreset: params.novoPreset,
      });
    },
    onSuccess: (result, params) => {
      toast.success(
        params.excluirPreset
          ? 'Preset excluído'
          : params.editarPreset
            ? 'Preset atualizado'
            : params.novoPreset
              ? 'Preset criado e aplicado à rede'
              : 'Tema aplicado à rede',
      );
      setPreset(result.tema.preset);
      setCoresLight(result.tema.light);
      setCoresDark(result.tema.dark);
      setNovoPresetAberto(false);
      setPresetParaExcluir(null);
      queryClient.setQueryData(
        ['organizacao'],
        organizacao ? { ...organizacao, tema: result.tema } : undefined,
      );
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

  const presetsDisponiveis = [
    ...TEMA_PRESETS,
    ...(organizacao?.tema.presetsPersonalizados ?? []),
  ];
  const presetAtual =
    presetsDisponiveis.find((item) => item.id === preset) ?? TEMA_PRESETS[0];
  const light = { ...Tema.defaultPreset().light, ...presetAtual.light, ...coresLight };
  const dark = { ...Tema.defaultPreset().dark, ...presetAtual.dark, ...coresDark };
  const temaEdicao: TemaProps = {
    preset,
    light,
    dark,
    presetsPersonalizados: organizacao?.tema.presetsPersonalizados ?? [],
  };
  const presetEditavel = Tema.reconstitute(temaEdicao).editavel;
  const aplicarTema: SalvarTemaHandler = (params) => {
    const base = Tema.create(params.tema ?? temaEdicao);
    const result = base.isFailure
      ? base
      : params.editarPreset && params.novoPreset
        ? base.value.editarPreset({
            id: params.editarPreset,
            ...params.novoPreset,
            coresLight: params.tema?.light,
            coresDark: params.tema?.dark,
          })
        : params.novoPreset
          ? base.value.salvarComoPreset(params.novoPreset)
          : base;
    if (result.isFailure) {
      toast.error(result.error.message);
      return;
    }
    salvarTema.mutate(params);
  };
  const duplicarPreset: DuplicarPresetHandler = (item) => {
    setPresetEmEdicao(null);
    const origem = Tema.reconstitute(temaEdicao).selecionarPreset(item.id);
    if (origem.isFailure) {
      toast.error(origem.error.message);
      return;
    }
    setDuplicacaoPreset({
      tema: origem.value.toJSON(),
      valoresIniciais: {
        nome: `Cópia de ${item.nome}`.slice(0, 60),
        descricao: item.descricao,
      },
    });
    setNovoPresetAberto(true);
  };

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
                <Input
                  id="rede-nome"
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                />
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
                <Input
                  id="rede-cnpj"
                  value={cnpj}
                  onChange={(evento) => setCnpj(evento.target.value)}
                />
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
                <Badge variant="outline">
                  Identificador da rede: {organizacao?.slug ?? organizacao?.id}
                </Badge>
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
                      O tema é exclusivo do administrador da rede. Você pode visualizar os
                      presets, mas não salvar alterações.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {[
                  { titulo: 'Presets padrão do sistema', itens: TEMA_PRESETS },
                  {
                    titulo: 'Presets personalizados',
                    itens: organizacao?.tema.presetsPersonalizados ?? [],
                  },
                ].map((grupo) => (
                  <section
                    key={grupo.titulo}
                    className="space-y-3"
                    aria-label={grupo.titulo}
                  >
                    <h3 className="text-sm font-semibold">{grupo.titulo}</h3>
                    {grupo.itens.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Você ainda não criou presets personalizados.
                      </p>
                    ) : null}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {grupo.itens.map((item) => (
                        <div key={item.id} className="flex min-w-0 flex-col gap-2">
                          <button
                            type="button"
                            disabled={!ehAdmin || salvarTema.isPending}
                            aria-pressed={preset === item.id}
                            onClick={() => {
                              setPreset(item.id);
                              setCoresLight({});
                              setCoresDark({});
                            }}
                            className={`min-w-0 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                              preset === item.id
                                ? 'border-primary ring-1 ring-primary'
                                : 'hover:bg-accent'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="flex shrink-0 gap-1">
                                {[
                                  item.light.primary,
                                  item.light.accent,
                                  item.light.sidebar,
                                ].map((cor, indice) => (
                                  <span
                                    key={indice}
                                    aria-hidden
                                    className="size-5 rounded-full border"
                                    style={{ backgroundColor: `hsl(${cor})` }}
                                  />
                                ))}
                              </span>
                              <span className="min-w-0 break-words text-sm font-medium">
                                {item.nome}
                              </span>
                            </span>
                            <span className="mt-1 block break-words text-xs text-muted-foreground">
                              {item.descricao}
                            </span>
                            <Badge variant="outline" className="mt-2">
                              {Tema.presetDoSistema(item.id)
                                ? 'Padrão do sistema'
                                : 'Preset da rede'}
                            </Badge>
                          </button>
                          <div className="flex flex-wrap justify-end gap-1">
                            {!Tema.presetDoSistema(item.id) ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Editar preset ${item.nome}`}
                                  disabled={
                                    !ehAdmin ||
                                    !pode('tema:editar') ||
                                    salvarTema.isPending
                                  }
                                  onClick={() => {
                                    const origem = Tema.reconstitute(
                                      organizacao?.tema ?? temaEdicao,
                                    ).selecionarPreset(item.id);
                                    if (origem.isFailure) {
                                      toast.error(origem.error.message);
                                      return;
                                    }
                                    setPresetEmEdicao(item.id);
                                    setDuplicacaoPreset({
                                      tema: origem.value.toJSON(),
                                      valoresIniciais: {
                                        nome: item.nome,
                                        descricao: item.descricao,
                                      },
                                    });
                                    setNovoPresetAberto(true);
                                  }}
                                >
                                  <Pencil aria-hidden />
                                  Editar
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label={`Excluir preset ${item.nome}`}
                                  disabled={
                                    !ehAdmin ||
                                    !pode('tema:editar') ||
                                    salvarTema.isPending
                                  }
                                  onClick={() => setPresetParaExcluir(item)}
                                >
                                  <Trash2 aria-hidden className="text-destructive" />
                                  Excluir
                                </Button>
                              </>
                            ) : null}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="self-end"
                              aria-label={`Duplicar preset ${item.nome}`}
                              disabled={
                                !ehAdmin || !pode('tema:editar') || salvarTema.isPending
                              }
                              onClick={() => duplicarPreset(item)}
                            >
                              <Copy aria-hidden />
                              Duplicar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <Button
                  variant="outline"
                  onClick={() => {
                    setDuplicacaoPreset(null);
                    setPresetEmEdicao(null);
                    setNovoPresetAberto(true);
                  }}
                  disabled={!ehAdmin || !pode('tema:editar') || salvarTema.isPending}
                >
                  <Plus aria-hidden />
                  Criar novo preset
                </Button>

                <p className="text-xs text-muted-foreground">
                  O tema altera apenas as cores: tipografia, espaçamento e layout
                  permanecem os do design system (§3.7).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {presetEditavel ? 'Editar cores do preset' : 'Cores do preset'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {TOKENS_EDITAVEIS.map((token) => (
                  <div key={token.chave} className="grid gap-2">
                    <p className="text-xs font-medium">{token.rotulo}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          modo: 'light' as const,
                          valor: light[token.chave],
                          setter: setCoresLight,
                        },
                        {
                          modo: 'dark' as const,
                          valor: dark[token.chave],
                          setter: setCoresDark,
                        },
                      ].map((coluna) => (
                        <ColorPicker
                          key={coluna.modo}
                          id={`cor-${token.chave}-${coluna.modo}`}
                          label={`Modo ${coluna.modo === 'light' ? 'claro' : 'escuro'} — ${token.rotulo}`}
                          value={coluna.valor}
                          onValueChange={(cor) =>
                            coluna.setter((anterior) => ({
                              ...anterior,
                              [token.chave]: cor,
                            }))
                          }
                          disabled={!ehAdmin || !presetEditavel || salvarTema.isPending}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                <Alert variant="info">
                  <AlertDescription>
                    {presetEditavel
                      ? 'Clique na amostra para escolher uma cor. Salve para atualizar este preset da rede nos modos claro e escuro.'
                      : 'Os presets do sistema são protegidos. Duplique um preset ou crie um novo para editar suas cores.'}
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end">
                  <Button
                    onClick={() => aplicarTema({})}
                    carregando={salvarTema.isPending}
                    disabled={!ehAdmin || !pode('tema:editar')}
                  >
                    <Save aria-hidden />
                    {presetEditavel ? 'Salvar e aplicar preset' : 'Aplicar tema'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Dialog open={novoPresetAberto} onOpenChange={setNovoPresetAberto}>
              <DialogContent tamanho="sm">
                <DialogHeader>
                  <DialogTitle>
                    {presetEmEdicao
                      ? 'Editar preset personalizado'
                      : duplicacaoPreset
                        ? 'Duplicar preset de cores'
                        : 'Criar preset de cores'}
                  </DialogTitle>
                  <DialogDescription>
                    {presetEmEdicao
                      ? 'Atualize o nome, a descrição e as cores deste preset.'
                      : duplicacaoPreset
                        ? 'Dê um nome à cópia para reutilizar estas cores na rede.'
                        : 'Dê um nome às cores atuais para reutilizá-las na rede.'}
                  </DialogDescription>
                </DialogHeader>
                <NovoPresetForm
                  presetId={presetEmEdicao ?? undefined}
                  tema={duplicacaoPreset?.tema ?? temaEdicao}
                  valoresIniciais={duplicacaoPreset?.valoresIniciais}
                  carregando={salvarTema.isPending}
                  aoSalvar={(novoPreset) =>
                    aplicarTema({
                      novoPreset,
                      tema: duplicacaoPreset?.tema,
                      editarPreset: presetEmEdicao ?? undefined,
                    })
                  }
                >
                  {presetEmEdicao && duplicacaoPreset ? (
                    <div className="max-h-64 space-y-4 overflow-y-auto pr-2">
                      {TOKENS_EDITAVEIS.map((token) => (
                        <div key={token.chave} className="space-y-2">
                          <p className="text-xs font-medium">{token.rotulo}</p>
                          <div className="grid grid-cols-2 gap-2">
                            {(['light', 'dark'] as const).map((modo) => (
                              <ColorPicker
                                key={modo}
                                id={`editar-${token.chave}-${modo}`}
                                label={modo === 'light' ? 'Modo claro' : 'Modo escuro'}
                                value={duplicacaoPreset.tema[modo][token.chave]}
                                disabled={salvarTema.isPending}
                                onValueChange={(cor) =>
                                  setDuplicacaoPreset((anterior) =>
                                    anterior
                                      ? {
                                          ...anterior,
                                          tema: {
                                            ...anterior.tema,
                                            [modo]: {
                                              ...anterior.tema[modo],
                                              [token.chave]: cor,
                                            },
                                          },
                                        }
                                      : anterior,
                                  )
                                }
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </NovoPresetForm>
              </DialogContent>
            </Dialog>

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
                    JPG, PNG ou SVG até 5 MB. O logotipo aparece no cabeçalho dos
                    documentos clínicos emitidos por todas as unidades da rede.
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
                      {organizacao?.logotipoUrl
                        ? 'Substituir logotipo'
                        : 'Enviar logotipo'}
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
        aberto={Boolean(presetParaExcluir)}
        aoMudar={(aberto) => {
          if (!aberto) setPresetParaExcluir(null);
        }}
        titulo="Excluir preset personalizado"
        descricao={`Excluir o preset “${presetParaExcluir?.nome ?? ''}”? Se ele estiver aplicado à rede, o tema padrão Oceano será aplicado.`}
        textoConfirmar="Excluir preset"
        carregando={salvarTema.isPending}
        onConfirmar={() => {
          if (presetParaExcluir)
            salvarTema.mutate({ excluirPreset: presetParaExcluir.id });
        }}
      />
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
