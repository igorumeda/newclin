'use client';

import * as React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Eye, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Alert, AlertDescription } from '@/client/ui/feedback';
import { Input, Textarea } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Badge } from '@/client/ui/badge';
import { documentoService, type ConteudoDocumento, type PrevisualizarDocumentoOutputDto } from '@/client/services/documento.service';
import { pacienteService, type PacienteDto } from '@/client/services/paciente.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { formatarData, formatarIdade } from '@/client/lib/format';
import { toDateInputValue } from '@/client/lib/utils';
import { TIPO_DOCUMENTO_LABELS, type TipoDocumento } from '@/modules/clinical-document/domain/value-objects/tipo-documento.vo';

export type EditorDocumentoProps = {
  unidadeId: string;
  profissionalId: string;
  pacienteInicial?: PacienteDto | null;
  atendimentoId?: string | null;
  tipoInicial?: TipoDocumento;
  /** Achado do tipo de documento já criado (documento pré-existente). */
  conteudoInicial?: ConteudoDocumento;
  somenteLeitura?: boolean;
};

const itemReceitaVazio = { medicamento: '', dosagem: '', via: 'oral', frequencia: '', duracao: '', observacoes: '' };

export function EditorDocumento({
  unidadeId,
  profissionalId,
  pacienteInicial,
  atendimentoId,
  tipoInicial = 'receita',
  conteudoInicial,
  somenteLeitura = false,
}: EditorDocumentoProps) {
  const [tipo, setTipo] = React.useState<TipoDocumento>(tipoInicial);
  const [paciente, setPaciente] = React.useState<PacienteDto | null>(pacienteInicial ?? null);
  const [busca, setBusca] = React.useState('');
  const [conteudo, setConteudo] = React.useState<ConteudoDocumento>(
    conteudoInicial ?? {
      itens: [{ ...itemReceitaVazio }],
      orientacoes: '',
      exames: [{ nome: '' }],
      justificativa: '',
      diasAfastamento: 1,
      cid: '',
      finalidade: '',
      dataComparecimento: toDateInputValue(new Date()),
      horaEntrada: '',
      horaSaida: '',
      procedimento: '',
      observacoes: '',
      textoLivre: '',
    },
  );
  const [previa, setPrevia] = React.useState<PrevisualizarDocumentoOutputDto | null>(null);

  const buscaPacientes = useQuery({
    queryKey: ['pacientes', 'busca-documento', busca],
    queryFn: () => pacienteService.listar({ termo: busca, perPage: 6 }),
    enabled: busca.trim().length >= 2 && !paciente,
  });

  const previsualizar = useMutation({
    mutationFn: () =>
      documentoService.previsualizar({
        unidadeId,
        pacienteId: paciente?.id as string,
        profissionalId,
        atendimentoId: atendimentoId ?? null,
        tipo,
        conteudo,
      }),
    onSuccess: (resultado) => {
      setPrevia(resultado);
      toast.success('Prévia atualizada');
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const emitir = useMutation({
    mutationFn: async () => {
      if (!paciente) throw new Error('Selecione o paciente');
      const criado = await documentoService.criar({
        unidadeId,
        pacienteId: paciente.id,
        profissionalId,
        atendimentoId: atendimentoId ?? null,
        tipo,
        conteudo,
      });
      return documentoService.emitir(criado.id, { notificarPaciente: true });
    },
    onSuccess: (resultado) => {
      toast.success(
        `Documento emitido${resultado.notificacao?.enfileiradas ? ` · ${resultado.notificacao.enfileiradas} notificação(ões) enfileirada(s)` : ''}`,
      );
      setPrevia(null);
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const podeEmitir = Boolean(paciente && unidadeId && profissionalId) && !somenteLeitura;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Identificação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="documento-tipo">Tipo de documento *</Label>
              <Select
                value={tipo}
                onValueChange={(valor) => setTipo(valor as TipoDocumento)}
                disabled={somenteLeitura}
              >
                <SelectTrigger id="documento-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TIPO_DOCUMENTO_LABELS) as TipoDocumento[]).map((chave) => (
                    <SelectItem key={chave} value={chave}>
                      {TIPO_DOCUMENTO_LABELS[chave]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Paciente *</Label>
              {paciente ? (
                <div className="flex items-center justify-between gap-2 rounded-md border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{paciente.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {paciente.cpfFormatado} · {formatarData(paciente.dataNascimento)} ·{' '}
                      {formatarIdade(paciente.idade)}
                    </p>
                  </div>
                  {!somenteLeitura ? (
                    <Button variant="ghost" size="sm" onClick={() => setPaciente(null)}>
                      Trocar
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    value={busca}
                    onChange={(evento) => setBusca(evento.target.value)}
                    placeholder="Buscar paciente por nome ou CPF"
                  />
                  {busca.trim().length >= 2 ? (
                    <ul className="max-h-48 divide-y overflow-y-auto rounded-md border">
                      {(buscaPacientes.data?.items ?? []).map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => {
                              setPaciente(item);
                              setBusca('');
                            }}
                          >
                            <span className="block font-medium">{item.nome}</span>
                            <span className="block text-xs text-muted-foreground">{item.cpfFormatado}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conteúdo do documento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tipo === 'receita' ? (
              <>
                <div className="space-y-3">
                  {(conteudo.itens ?? []).map((item, indice) => (
                    <div key={indice} className="grid gap-2 rounded-md border p-3 sm:grid-cols-6">
                      <div className="space-y-1 sm:col-span-3">
                        <Label className="text-xs">Medicamento *</Label>
                        <Input
                          value={item.medicamento}
                          onChange={(evento) => {
                            const itens = [...(conteudo.itens ?? [])];
                            itens[indice] = { ...item, medicamento: evento.target.value };
                            setConteudo((anterior) => ({ ...anterior, itens }));
                          }}
                          disabled={somenteLeitura}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-3">
                        <Label className="text-xs">Dosagem *</Label>
                        <Input
                          value={item.dosagem}
                          onChange={(evento) => {
                            const itens = [...(conteudo.itens ?? [])];
                            itens[indice] = { ...item, dosagem: evento.target.value };
                            setConteudo((anterior) => ({ ...anterior, itens }));
                          }}
                          disabled={somenteLeitura}
                          placeholder="Ex.: 500 mg"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Via</Label>
                        <Input
                          value={item.via}
                          onChange={(evento) => {
                            const itens = [...(conteudo.itens ?? [])];
                            itens[indice] = { ...item, via: evento.target.value };
                            setConteudo((anterior) => ({ ...anterior, itens }));
                          }}
                          disabled={somenteLeitura}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Frequência</Label>
                        <Input
                          value={item.frequencia}
                          onChange={(evento) => {
                            const itens = [...(conteudo.itens ?? [])];
                            itens[indice] = { ...item, frequencia: evento.target.value };
                            setConteudo((anterior) => ({ ...anterior, itens }));
                          }}
                          disabled={somenteLeitura}
                          placeholder="Ex.: 8/8h"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Duração</Label>
                        <Input
                          value={item.duracao}
                          onChange={(evento) => {
                            const itens = [...(conteudo.itens ?? [])];
                            itens[indice] = { ...item, duracao: evento.target.value };
                            setConteudo((anterior) => ({ ...anterior, itens }));
                          }}
                          disabled={somenteLeitura}
                          placeholder="Ex.: 7 dias"
                        />
                      </div>
                      {!somenteLeitura && (conteudo.itens ?? []).length > 1 ? (
                        <div className="flex items-end sm:col-span-6">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setConteudo((anterior) => ({
                                ...anterior,
                                itens: (anterior.itens ?? []).filter((_, posicao) => posicao !== indice),
                              }))
                            }
                          >
                            <Trash2 aria-hidden />
                            Remover medicamento
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}

                  {!somenteLeitura ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setConteudo((anterior) => ({
                          ...anterior,
                          itens: [...(anterior.itens ?? []), { ...itemReceitaVazio }],
                        }))
                      }
                    >
                      <Plus aria-hidden />
                      Adicionar medicamento
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="documento-orientacoes">Orientações</Label>
                  <Textarea
                    id="documento-orientacoes"
                    rows={3}
                    value={conteudo.orientacoes ?? ''}
                    onChange={(evento) => setConteudo((anterior) => ({ ...anterior, orientacoes: evento.target.value }))}
                    disabled={somenteLeitura}
                  />
                </div>
              </>
            ) : null}

            {tipo === 'atestado' ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="atestado-dias">Dias de afastamento *</Label>
                  <Input
                    id="atestado-dias"
                    type="number"
                    min={1}
                    value={conteudo.diasAfastamento ?? 1}
                    onChange={(evento) =>
                      setConteudo((anterior) => ({ ...anterior, diasAfastamento: Number(evento.target.value) }))
                    }
                    disabled={somenteLeitura}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="atestado-cid">CID-10</Label>
                  <Input
                    id="atestado-cid"
                    value={conteudo.cid ?? ''}
                    onChange={(evento) => setConteudo((anterior) => ({ ...anterior, cid: evento.target.value }))}
                    disabled={somenteLeitura}
                    placeholder="Ex.: J11.1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="atestado-finalidade">Finalidade</Label>
                  <Input
                    id="atestado-finalidade"
                    value={conteudo.finalidade ?? ''}
                    onChange={(evento) => setConteudo((anterior) => ({ ...anterior, finalidade: evento.target.value }))}
                    disabled={somenteLeitura}
                    placeholder="Ex.: apresentar ao empregador"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="atestado-observacoes">Observações</Label>
                  <Textarea
                    id="atestado-observacoes"
                    rows={2}
                    value={conteudo.observacoes ?? ''}
                    onChange={(evento) => setConteudo((anterior) => ({ ...anterior, observacoes: evento.target.value }))}
                    disabled={somenteLeitura}
                  />
                </div>
              </div>
            ) : null}

            {tipo === 'solicitacao_exames' ? (
              <>
                <div className="space-y-2">
                  {(conteudo.exames ?? []).map((exame, indice) => (
                    <div key={indice} className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={exame.nome}
                        placeholder="Nome do exame *"
                        onChange={(evento) => {
                          const exames = [...(conteudo.exames ?? [])];
                          exames[indice] = { ...exame, nome: evento.target.value };
                          setConteudo((anterior) => ({ ...anterior, exames }));
                        }}
                        disabled={somenteLeitura}
                      />
                      <Input
                        value={exame.observacoes ?? ''}
                        placeholder="Observações / preparo"
                        onChange={(evento) => {
                          const exames = [...(conteudo.exames ?? [])];
                          exames[indice] = { ...exame, observacoes: evento.target.value };
                          setConteudo((anterior) => ({ ...anterior, exames }));
                        }}
                        disabled={somenteLeitura}
                      />
                      {!somenteLeitura && (conteudo.exames ?? []).length > 1 ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover exame"
                          onClick={() =>
                            setConteudo((anterior) => ({
                              ...anterior,
                              exames: (anterior.exames ?? []).filter((_, posicao) => posicao !== indice),
                            }))
                          }
                        >
                          <Trash2 aria-hidden />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  {!somenteLeitura ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setConteudo((anterior) => ({ ...anterior, exames: [...(anterior.exames ?? []), { nome: '' }] }))
                      }
                    >
                      <Plus aria-hidden />
                      Adicionar exame
                    </Button>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exames-justificativa">Indicação clínica</Label>
                  <Textarea
                    id="exames-justificativa"
                    rows={3}
                    value={conteudo.justificativa ?? ''}
                    onChange={(evento) => setConteudo((anterior) => ({ ...anterior, justificativa: evento.target.value }))}
                    disabled={somenteLeitura}
                  />
                </div>
              </>
            ) : null}

            {tipo === 'declaracao_comparecimento' ? (
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="declaracao-data">Data do comparecimento *</Label>
                  <Input
                    id="declaracao-data"
                    type="date"
                    value={conteudo.dataComparecimento ?? ''}
                    onChange={(evento) =>
                      setConteudo((anterior) => ({ ...anterior, dataComparecimento: evento.target.value }))
                    }
                    disabled={somenteLeitura}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="declaracao-entrada">Hora de entrada</Label>
                  <Input
                    id="declaracao-entrada"
                    type="time"
                    value={conteudo.horaEntrada ?? ''}
                    onChange={(evento) => setConteudo((anterior) => ({ ...anterior, horaEntrada: evento.target.value }))}
                    disabled={somenteLeitura}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="declaracao-saida">Hora de saída</Label>
                  <Input
                    id="declaracao-saida"
                    type="time"
                    value={conteudo.horaSaida ?? ''}
                    onChange={(evento) => setConteudo((anterior) => ({ ...anterior, horaSaida: evento.target.value }))}
                    disabled={somenteLeitura}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor="declaracao-procedimento">Procedimento / atendimento</Label>
                  <Input
                    id="declaracao-procedimento"
                    value={conteudo.procedimento ?? ''}
                    onChange={(evento) => setConteudo((anterior) => ({ ...anterior, procedimento: evento.target.value }))}
                    disabled={somenteLeitura}
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="documento-texto-livre">Texto complementar</Label>
              <Textarea
                id="documento-texto-livre"
                rows={2}
                value={conteudo.textoLivre ?? ''}
                onChange={(evento) => setConteudo((anterior) => ({ ...anterior, textoLivre: evento.target.value }))}
                disabled={somenteLeitura}
                placeholder="Aparece no rodapé do documento, quando necessário."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => previsualizar.mutate()}
            carregando={previsualizar.isPending}
            disabled={!paciente}
          >
            <Eye aria-hidden />
            Atualizar prévia
          </Button>
          <Button onClick={() => emitir.mutate()} carregando={emitir.isPending} disabled={!podeEmitir}>
            <FileText aria-hidden />
            Emitir documento
          </Button>
        </div>

        {somenteLeitura ? (
          <Alert variant="info">
            <AlertDescription>Documentos emitidos são imutáveis — use “Cancelar” para invalidá-los.</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <Card className="lg:sticky lg:top-20 lg:h-fit">
        <CardHeader>
          <CardTitle>Prévia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {!previa ? (
            <p className="text-xs text-muted-foreground">
              Clique em <strong>Atualizar prévia</strong> para conferir o cabeçalho da clínica, os dados do
              paciente e o conteúdo antes da emissão.
            </p>
          ) : (
            <>
              <div className="flex items-start gap-3">
                {previa.cabecalho.logotipoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previa.cabecalho.logotipoUrl}
                    alt={previa.cabecalho.redeNome}
                    className="size-12 rounded object-contain"
                  />
                ) : null}
                <div className="min-w-0">
                  <p className="truncate font-semibold">{previa.cabecalho.redeNome}</p>
                  <p className="truncate text-xs text-muted-foreground">{previa.cabecalho.unidadeNome}</p>
                  <p className="truncate text-xs text-muted-foreground">{previa.cabecalho.unidadeEndereco}</p>
                  <p className="text-xs text-muted-foreground">{previa.cabecalho.unidadeTelefone}</p>
                </div>
              </div>

              <div className="rounded-md border p-3 text-xs">
                <p className="font-medium">{previa.paciente.nome}</p>
                <p className="text-muted-foreground">
                  {previa.paciente.cpfFormatado} · {formatarData(previa.paciente.dataNascimento)} ·{' '}
                  {formatarIdade(previa.paciente.idade)}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <Badge>{TIPO_DOCUMENTO_LABELS[previa.tipo]}</Badge>
                <span className="text-xs text-muted-foreground">
                  Próximo número: {previa.proximoNumero}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">
                Assinatura: {previa.profissional.nome} — {previa.profissional.especialidade}
                {previa.profissional.conselho ? ` (${previa.profissional.conselho})` : ''}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
