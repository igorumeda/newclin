'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  CalendarRange,
  Download,
  Percent,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, StatCard } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Input } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/ui/controls';
import { Alert, AlertDescription, TabelaSkeleton } from '@/client/ui/feedback';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/client/ui/table';
import { GraficoBarras, GraficoLinha, GraficoPizza } from '@/client/components/shared/graficos';
import { relatorioService } from '@/client/services/relatorio.service';
import { profissionalService } from '@/client/services/profissional.service';
import { useUnidadeAtiva } from '@/client/hooks/use-unidade-ativa';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { formatarData, formatarMes, formatarNumero, formatarPercentual } from '@/client/lib/format';

function paraCsv(cabecalhos: string[], linhas: (string | number)[][]): string {
  const celulas = [cabecalhos.join(';'), ...linhas.map((linha) => linha.join(';'))];
  return `\uFEFF${celulas.join('\n')}`;
}

function baixarCsv(nomeArquivo: string, conteudo: string) {
  const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.click();
  URL.revokeObjectURL(url);
}

export default function RelatoriosPage() {
  const { unidadeId } = useUnidadeAtiva();
  const { podeVerRelatorios } = usePermissoes();

  const trintaDiasAtras = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const hoje = new Date().toISOString().slice(0, 10);

  const [inicio, setInicio] = React.useState(trintaDiasAtras);
  const [fim, setFim] = React.useState(hoje);
  const [profissionalId, setProfissionalId] = React.useState('todos');
  const [dimensao, setDimensao] = React.useState<'tipo' | 'especialidade'>('tipo');

  const filtros = {
    inicio,
    fim,
    unidadeId: unidadeId ?? undefined,
    profissionalId: profissionalId === 'todos' ? undefined : profissionalId,
  };

  const visaoGeral = useQuery({
    queryKey: ['relatorios', 'visao-geral', filtros],
    queryFn: () => relatorioService.visaoGeral(filtros),
    enabled: podeVerRelatorios,
  });

  const profissionais = useQuery({
    queryKey: ['profissionais', { ativo: true }],
    queryFn: () => profissionalService.listar({ ativo: true }),
    enabled: podeVerRelatorios,
  });

  const distribuicao = useQuery({
    queryKey: ['relatorios', 'distribuicao', filtros, dimensao],
    queryFn: () => relatorioService.distribuicao({ ...filtros, dimensao }),
    enabled: podeVerRelatorios,
  });

  if (!podeVerRelatorios) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          Os relatórios de gestão são restritos ao administrador da rede e ao gestor de unidade (§3.8).
        </AlertDescription>
      </Alert>
    );
  }

  const dados = visaoGeral.data;
  const loading = visaoGeral.isLoading;

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Relatórios"
        descricao="Indicadores de atendimento, absenteísmo, captação e produtividade por profissional e unidade."
        acoes={
          <Button
            variant="outline"
            onClick={() => {
              if (!dados) return;
              const csv = paraCsv(
                ['data', 'unidade', 'agendados', 'finalizados', 'cancelados', 'faltas'],
                dados.atendimentos.linhas.map((linha) => [
                  formatarData(linha.data),
                  linha.unidadeNome,
                  linha.totalAgendados,
                  linha.totalFinalizados,
                  linha.totalCancelados,
                  linha.totalFaltas,
                ]),
              );
              baixarCsv(`atendimentos-${inicio}-a-${fim}.csv`, csv);
              toast.success('CSV do relatório gerado');
            }}
            disabled={!dados}
          >
            <Download aria-hidden />
            Exportar atendimentos (CSV)
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="relatorio-inicio" className="text-xs">
              Início do período
            </Label>
            <Input
              id="relatorio-inicio"
              type="date"
              value={inicio}
              max={fim}
              onChange={(evento) => setInicio(evento.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="relatorio-fim" className="text-xs">
              Fim do período
            </Label>
            <Input
              id="relatorio-fim"
              type="date"
              value={fim}
              min={inicio}
              onChange={(evento) => setFim(evento.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Profissional</Label>
            <Select value={profissionalId} onValueChange={setProfissionalId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os profissionais</SelectItem>
                {(profissionais.data?.items ?? []).map((profissional) => (
                  <SelectItem key={profissional.id} value={profissional.id}>
                    {profissional.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setInicio(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
                setFim(hoje);
              }}
            >
              Últimos 7 dias
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInicio(new Date(Date.now() - 89 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
                setFim(hoje);
              }}
            >
              90 dias
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <TabelaSkeleton linhas={6} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              titulo="Atendimentos finalizados"
              valor={formatarNumero(dados?.atendimentos.totais.finalizados)}
              descricao="no período selecionado"
              icone={BarChart3}
            />
            <StatCard
              titulo="Faltas"
              valor={formatarNumero(dados?.faltas.totais.faltas)}
              descricao={`taxa de ${formatarPercentual(dados?.faltas.totais.taxaFaltas)}`}
              icone={Percent}
            />
            <StatCard
              titulo="Novos pacientes"
              valor={formatarNumero(dados?.novosPacientes.totalPacientes)}
              descricao="cadastros no período"
              icone={UserPlus}
            />
            <StatCard
              titulo="Pacientes ativos"
              valor={formatarNumero(dados?.dashboard.pacientesAtivos)}
              descricao={`${formatarNumero(dados?.dashboard.profissionaisAtivos)} profissionais ativos`}
              icone={Users}
            />
          </div>

          <Tabs defaultValue="atendimentos">
            <TabsList>
              <TabsTrigger value="atendimentos">Atendimentos</TabsTrigger>
              <TabsTrigger value="faltas">Faltas e cancelamentos</TabsTrigger>
              <TabsTrigger value="captacao">Novos pacientes</TabsTrigger>
              <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
              <TabsTrigger value="produtividade">Produtividade</TabsTrigger>
            </TabsList>

            <TabsContent value="atendimentos">
              <div className="grid gap-4">
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle>Atendimentos por dia e unidade</CardTitle>
                    <span className="text-xs text-muted-foreground">
                      {formatarData(dados?.periodo.inicio ?? inicio)} — {formatarData(dados?.periodo.fim ?? fim)}
                    </span>
                  </CardHeader>
                  <CardContent>
                    {dados?.atendimentos.linhas.length ? (
                      <GraficoLinha
                        dados={dados.atendimentos.linhas.map((linha) => ({
                          rotulo: formatarData(linha.data).slice(0, 5),
                          valor: linha.totalFinalizados,
                        }))}
                        chaveValor="finalizados"
                      />
                    ) : (
                      <p className="py-10 text-center text-sm text-muted-foreground">Sem dados no período.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-0 sm:p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead className="text-right">Agendados</TableHead>
                          <TableHead className="text-right">Finalizados</TableHead>
                          <TableHead className="text-right">Cancelados</TableHead>
                          <TableHead className="text-right">Faltas</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(dados?.atendimentos.linhas ?? []).map((linha, indice) => (
                          <TableRow key={`${linha.data}-${linha.unidadeId}-${indice}`}>
                            <TableCell className="tabular-nums">{formatarData(linha.data)}</TableCell>
                            <TableCell>{linha.unidadeNome}</TableCell>
                            <TableCell className="text-right tabular-nums">{linha.totalAgendados}</TableCell>
                            <TableCell className="text-right tabular-nums">{linha.totalFinalizados}</TableCell>
                            <TableCell className="text-right tabular-nums">{linha.totalCancelados}</TableCell>
                            <TableCell className="text-right tabular-nums">{linha.totalFaltas}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2}>Totais</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {dados?.atendimentos.totais.agendados ?? 0}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {dados?.atendimentos.totais.finalizados ?? 0}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {dados?.atendimentos.totais.cancelados ?? 0}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {dados?.atendimentos.totais.faltas ?? 0}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="faltas">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Absenteísmo por profissional</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      baixarCsv(
                        `faltas-${inicio}-a-${fim}.csv`,
                        paraCsv(
                          ['profissional', 'especialidade', 'unidade', 'agendamentos', 'faltas', 'cancelamentos', 'taxa_faltas'],
                          (dados?.faltas.linhas ?? []).map((linha) => [
                            linha.profissionalNome,
                            linha.especialidade,
                            linha.unidadeNome,
                            linha.totalAgendamentos,
                            linha.totalFaltas,
                            linha.totalCancelamentos,
                            formatarPercentual(linha.taxaFaltas),
                          ]),
                        ),
                      )
                    }
                  >
                    <Download aria-hidden />
                    CSV
                  </Button>
                </CardHeader>
                <CardContent className="p-0 sm:p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Agendamentos</TableHead>
                        <TableHead className="text-right">Faltas</TableHead>
                        <TableHead className="text-right">Cancelamentos</TableHead>
                        <TableHead className="text-right">Taxa de faltas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dados?.faltas.linhas ?? []).map((linha, indice) => (
                        <TableRow key={`${linha.profissionalId}-${indice}`}>
                          <TableCell>
                            <p className="font-medium">{linha.profissionalNome}</p>
                            <p className="text-xs text-muted-foreground">{linha.especialidade}</p>
                          </TableCell>
                          <TableCell>{linha.unidadeNome}</TableCell>
                          <TableCell className="text-right tabular-nums">{linha.totalAgendamentos}</TableCell>
                          <TableCell className="text-right tabular-nums text-warning">{linha.totalFaltas}</TableCell>
                          <TableCell className="text-right tabular-nums">{linha.totalCancelamentos}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatarPercentual(linha.taxaFaltas)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="captacao">
              <Card>
                <CardHeader>
                  <CardTitle>Novos pacientes por mês</CardTitle>
                </CardHeader>
                <CardContent>
                  {dados?.novosPacientes.linhas.length ? (
                    <GraficoBarras
                      dados={dados.novosPacientes.linhas.map((linha) => ({
                        rotulo: formatarMes(linha.mes),
                        valor: linha.totalPacientes,
                      }))}
                      chaveValor="pacientes"
                    />
                  ) : (
                    <p className="py-10 text-center text-sm text-muted-foreground">Sem cadastros no período.</p>
                  )}

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {dados?.novosPacientes.linhas.map((linha) => (
                      <div key={linha.mes} className="rounded-md border p-3 text-sm">
                        <p className="font-medium">{formatarMes(linha.mes)}</p>
                        <p className="text-xs text-muted-foreground">
                          {linha.totalPacientes} cadastro(s) · {linha.comConsentimentoLgpd} com consentimento LGPD
                          {linha.totalInativos > 0 ? ` · ${linha.totalInativos} inativo(s)` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="distribuicao">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader className="flex-row items-center justify-between space-y-0">
                    <CardTitle>Distribuição</CardTitle>
                    <Select value={dimensao} onValueChange={(valor) => setDimensao(valor as 'tipo' | 'especialidade')}>
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tipo">Por tipo de atendimento</SelectItem>
                        <SelectItem value="especialidade">Por especialidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    {distribuicao.data?.linhas.length ? (
                      <GraficoPizza
                        dados={distribuicao.data.linhas.map((linha) => ({
                          rotulo: linha.rotulo,
                          valor: linha.total,
                          cor: linha.cor,
                        }))}
                      />
                    ) : (
                      <p className="py-10 text-center text-sm text-muted-foreground">Sem dados no período.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detalhamento</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 sm:p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{dimensao === 'tipo' ? 'Tipo' : 'Especialidade'}</TableHead>
                          <TableHead className="text-right">Atendimentos</TableHead>
                          <TableHead className="text-right">Participação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const linhas = distribuicao.data?.linhas ?? [];
                          const total = linhas.reduce((soma, linha) => soma + linha.total, 0);
                          return linhas.map((linha) => (
                            <TableRow key={linha.rotulo}>
                              <TableCell>
                                <span className="flex items-center gap-2">
                                  <span
                                    aria-hidden
                                    className="inline-block size-2.5 rounded-full"
                                    style={{ backgroundColor: linha.cor }}
                                  />
                                  {linha.rotulo}
                                </span>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{linha.total}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {total === 0 ? '—' : formatarPercentual((linha.total / total) * 100)}
                              </TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="produtividade">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-muted-foreground" aria-hidden />
                    Produtividade por profissional
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      baixarCsv(
                        `produtividade-${inicio}-a-${fim}.csv`,
                        paraCsv(
                          ['profissional', 'especialidade', 'unidade', 'atendimentos', 'dias_com_atendimento', 'media_por_dia', 'evolucoes'],
                          (dados?.produtividade.linhas ?? []).map((linha) => [
                            linha.profissionalNome,
                            linha.especialidade,
                            linha.unidadeNome,
                            linha.totalAtendimentos,
                            linha.diasComAtendimento,
                            linha.mediaAtendimentosDia,
                            linha.totalEvolucoes,
                          ]),
                        ),
                      )
                    }
                  >
                    <Download aria-hidden />
                    CSV
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {dados?.produtividade.linhas.length ? (
                    <GraficoBarras
                      dados={dados.produtividade.linhas.map((linha) => ({
                        rotulo: linha.profissionalNome,
                        valor: linha.totalAtendimentos,
                      }))}
                      chaveValor="atendimentos"
                    />
                  ) : (
                    <p className="py-6 text-center text-sm text-muted-foreground">Sem dados no período.</p>
                  )}

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead className="text-right">Atendimentos</TableHead>
                        <TableHead className="text-right">Dias</TableHead>
                        <TableHead className="text-right">Média/dia</TableHead>
                        <TableHead className="text-right">Evoluções</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(dados?.produtividade.linhas ?? []).map((linha, indice) => (
                        <TableRow key={`${linha.profissionalId}-${indice}`}>
                          <TableCell>
                            <p className="font-medium">{linha.profissionalNome}</p>
                            <p className="text-xs text-muted-foreground">{linha.especialidade}</p>
                          </TableCell>
                          <TableCell>{linha.unidadeNome}</TableCell>
                          <TableCell className="text-right tabular-nums">{linha.totalAtendimentos}</TableCell>
                          <TableCell className="text-right tabular-nums">{linha.diasComAtendimento}</TableCell>
                          <TableCell className="text-right tabular-nums">
                            {linha.mediaAtendimentosDia.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{linha.totalEvolucoes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2}>Total</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {dados?.produtividade.totalAtendimentos ?? 0}
                        </TableCell>
                        <TableCell colSpan={3} />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarRange className="size-3" aria-hidden />
            Dados calculados em {dados?.dashboard.geradoEm ? new Date(dados.dashboard.geradoEm).toLocaleString('pt-BR') : '—'} ·
            total de {visaoGeral.data ? formatarNumero(dados?.atendimentos.totais.agendados) : '0'} agendamentos no
            período
          </div>
        </>
      )}
    </div>
  );
}
