'use client';

import * as React from 'react';
import { CheckCircle2, FileText, Save, ShieldAlert, Stethoscope } from 'lucide-react';
import { Badge } from '@/client/ui/badge';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Alert, AlertDescription, AlertTitle, EstadoVazio } from '@/client/ui/feedback';
import { Separator } from '@/client/ui/feedback';
import { CampoDinamico } from './campo-dinamico';
import { EvolucoesTimeline } from './evolucoes-timeline';
import { Button as Botao } from '@/client/ui/button';
import { CAMPOS_FIXOS } from '@/modules/medical-record/domain/value-objects/campos-fixos.vo';
import type { CampoEstrutura } from '@/modules/medical-record/domain/value-objects/campo-template.vo';
import type { DadosPreenchidos, ValorCampo } from '@/modules/medical-record/domain/value-objects/dados-prontuario.vo';
import type { AtendimentoDetalhe } from '@/client/services/prontuario.service';

export type CamposFixosValores = {
  queixaPrincipal: string;
  anamnese: string;
  exameFisico: string;
  hipoteseDiagnostica: string;
  cid: string;
  conduta: string;
};

export type FormularioProntuarioProps = {
  detalhe: AtendimentoDetalhe;
  valoresFixos: CamposFixosValores;
  valoresDinamicos: DadosPreenchidos;
  aoMudarFixo: (chave: keyof CamposFixosValores, valor: string) => void;
  aoMudarDinamico: (campoId: string, valor: ValorCampo) => void;
  problemas: { campoId: string; rotulo: string; motivo: string }[];
  /** Avisos de campos obrigatórios não preenchidos na finalização. */
  avisos: string[];
  salvando?: boolean;
  finalizando?: boolean;
  bloqueado?: boolean;
  aoSalvar: () => void;
  aoFinalizar: () => void;
  aoVerDocumentos?: () => void;
};

/** Formulário do prontuário: campos fixos + seções dinâmicas do template. */
export function FormularioProntuario({
  detalhe,
  valoresFixos,
  valoresDinamicos,
  aoMudarFixo,
  aoMudarDinamico,
  problemas,
  avisos,
  salvando = false,
  finalizando = false,
  bloqueado = false,
  aoSalvar,
  aoFinalizar,
  aoVerDocumentos,
}: FormularioProntuarioProps) {
  const { atendimento, estrutura } = detalhe;
  const secoes = estrutura?.secoes ?? [];

  const erroDe = (campoId: string) => problemas.find((problema) => problema.campoId === campoId)?.motivo;

  function valorFixo(campo: CampoEstrutura): string {
    return valoresFixos[campo.id as keyof CamposFixosValores] ?? '';
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="size-4 text-muted-foreground" aria-hidden />
              {atendimento.pacienteNome ?? 'Paciente'}
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {atendimento.profissionalNome} · {atendimento.unidadeNome} ·{' '}
              {atendimento.templateNome ?? 'sem template'}
              {atendimento.templateVersao ? ` (v${atendimento.templateVersao})` : ''} ·{' '}
              {atendimento.fontePagadoraLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={atendimento.finalizado ? 'success' : 'warning'}>{atendimento.statusLabel}</Badge>
            {bloqueado ? <Badge variant="secondary">somente leitura</Badge> : null}
          </div>
        </CardHeader>

        {bloqueado ? (
          <CardContent>
            <Alert variant="info">
              <AlertDescription>
                Atendimento finalizado em {atendimento.finalizadoEm ? atendimento.finalizadoEm.slice(0, 10) : '—'}: o
                conteúdo é imutável. Registre correções como adendo na linha do tempo abaixo.
              </AlertDescription>
            </Alert>
          </CardContent>
        ) : null}
      </Card>

      {avisos.length > 0 ? (
        <Alert variant="warning">
          <AlertTitle>Campos obrigatórios pendentes</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {avisos.map((aviso, indice) => (
                <li key={indice}>{aviso}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <fieldset disabled={bloqueado} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground">
              Campos fixos do prontuário
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {CAMPOS_FIXOS.map((campo) =>
              campo.tipo === 'texto_longo' ? (
                <div key={campo.id} className="space-y-1.5">
                  <label htmlFor={`fixo-${campo.id}`} className="flex items-center gap-1 text-sm font-medium">
                    {campo.rotulo}
                    {campo.obrigatorio ? <span className="text-destructive">*</span> : null}
                  </label>
                  <textarea
                    id={`fixo-${campo.id}`}
                    rows={campo.id === 'exameFisico' ? 5 : 4}
                    value={valorFixo(campo)}
                    onChange={(evento) => aoMudarFixo(campo.id as keyof CamposFixosValores, evento.target.value)}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
                    placeholder={campo.ajuda ?? undefined}
                  />
                  {campo.ajuda ? <p className="text-xs text-muted-foreground">{campo.ajuda}</p> : null}
                </div>
              ) : (
                <CampoDinamico
                  key={campo.id}
                  campo={campo}
                  idPrefix="fixo"
                  valor={valorFixo(campo)}
                  aoMudar={(valor) => aoMudarFixo(campo.id as keyof CamposFixosValores, String(valor ?? ''))}
                  erro={erroDe(campo.id)}
                />
              ),
            )}
          </CardContent>
        </Card>

        {secoes.length === 0 ? (
          <EstadoVazio
            titulo="Template sem seções dinâmicas"
            descricao="Este atendimento foi iniciado sem template de especialidade — apenas os campos fixos estão disponíveis."
            icone={FileText}
          />
        ) : (
          secoes.map((secao) => (
            <Card key={secao.id}>
              <CardHeader>
                <CardTitle className="text-base">{secao.titulo}</CardTitle>
                {secao.descricao ? (
                  <p className="text-xs text-muted-foreground">{secao.descricao}</p>
                ) : null}
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {secao.campos.map((campo) => (
                  <div
                    key={campo.id}
                    className={campo.tipo === 'texto_longo' ? 'sm:col-span-2' : undefined}
                  >
                    <CampoDinamico
                      campo={campo}
                      idPrefix={secao.id}
                      valor={valoresDinamicos[campo.id]}
                      aoMudar={(valor) => aoMudarDinamico(campo.id, valor)}
                      erro={erroDe(campo.id)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </fieldset>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evoluções e adendos</CardTitle>
        </CardHeader>
        <CardContent>
          <EvolucoesTimeline
            evolucoes={detalhe.evolucoes}
            permitirAdendo={atendimento.finalizado}
            aoAdicionar={undefined}
          />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex flex-col gap-2 border-t bg-background/95 py-3 backdrop-blur sm:flex-row sm:justify-end">
        {aoVerDocumentos ? (
          <Botao variant="outline" type="button" onClick={aoVerDocumentos}>
            <FileText aria-hidden />
            Documentos do atendimento
          </Botao>
        ) : null}

        <Button
          type="button"
          variant="outline"
          onClick={aoSalvar}
          carregando={salvando}
          disabled={bloqueado}
        >
          <Save aria-hidden />
          Salvar rascunho
        </Button>

        <Button type="button" onClick={aoFinalizar} carregando={finalizando} disabled={bloqueado}>
          {bloqueado ? <ShieldAlert aria-hidden /> : <CheckCircle2 aria-hidden />}
          Finalizar atendimento
        </Button>
      </div>
    </div>
  );
}
