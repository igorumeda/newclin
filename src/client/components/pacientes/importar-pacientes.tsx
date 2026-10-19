'use client';

import * as React from 'react';
import Papa from 'papaparse';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/client/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Alert, AlertDescription, AlertTitle, Separator } from '@/client/ui/feedback';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Checkbox, Label } from '@/client/ui/controls';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/client/ui/table';
import { pacienteService } from '@/client/services/paciente.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import type {
  LinhaImportacaoPaciente,
  RelatorioImportacaoDto,
} from '@/modules/patient/application/dtos/paciente.dto';

const CAMPOS: { chave: keyof LinhaImportacaoPaciente; rotulo: string; obrigatorio?: boolean }[] = [
  { chave: 'nome', rotulo: 'Nome completo', obrigatorio: true },
  { chave: 'cpf', rotulo: 'CPF', obrigatorio: true },
  { chave: 'dataNascimento', rotulo: 'Data de nascimento', obrigatorio: true },
  { chave: 'sexo', rotulo: 'Sexo', obrigatorio: true },
  { chave: 'telefone', rotulo: 'Telefone' },
  { chave: 'email', rotulo: 'E-mail' },
  { chave: 'cep', rotulo: 'CEP' },
  { chave: 'logradouro', rotulo: 'Logradouro' },
  { chave: 'numero', rotulo: 'Número' },
  { chave: 'complemento', rotulo: 'Complemento' },
  { chave: 'bairro', rotulo: 'Bairro' },
  { chave: 'cidade', rotulo: 'Cidade' },
  { chave: 'uf', rotulo: 'UF' },
  { chave: 'responsavelNome', rotulo: 'Responsável — nome' },
  { chave: 'responsavelTelefone', rotulo: 'Responsável — telefone' },
  { chave: 'responsavelParentesco', rotulo: 'Responsável — parentesco' },
  { chave: 'alergias', rotulo: 'Alergias' },
  { chave: 'condicoesCronicas', rotulo: 'Condições crônicas' },
  { chave: 'observacoes', rotulo: 'Observações' },
];

/** Cabeçalhos sugeridos no modelo CSV (Excel abre o arquivo direto). */
const MODELO_CABECALHO = [
  'nome',
  'cpf',
  'dataNascimento',
  'sexo',
  'telefone',
  'email',
  'cep',
  'logradouro',
  'numero',
  'bairro',
  'cidade',
  'uf',
  'responsavelNome',
  'responsavelTelefone',
  'responsavelParentesco',
];

/** Detecção automática de colunas pelo nome do cabeçalho. */
const SINONIMOS: Record<string, keyof LinhaImportacaoPaciente> = {
  nome: 'nome',
  'nome completo': 'nome',
  paciente: 'nome',
  cpf: 'cpf',
  'cpf do paciente': 'cpf',
  nascimento: 'dataNascimento',
  'data de nascimento': 'dataNascimento',
  dtnascimento: 'dataNascimento',
  'data_nascimento': 'dataNascimento',
  sexo: 'sexo',
  genero: 'sexo',
  gênero: 'sexo',
  telefone: 'telefone',
  celular: 'telefone',
  fone: 'telefone',
  email: 'email',
  'e-mail': 'email',
  cep: 'cep',
  logradouro: 'logradouro',
  endereco: 'logradouro',
  rua: 'logradouro',
  numero: 'numero',
  complemento: 'complemento',
  bairro: 'bairro',
  cidade: 'cidade',
  municipio: 'cidade',
  uf: 'uf',
  estado: 'uf',
  'responsavel nome': 'responsavelNome',
  responsavel: 'responsavelNome',
  'responsável': 'responsavelNome',
  'responsavel telefone': 'responsavelTelefone',
  'responsavel parentesco': 'responsavelParentesco',
  alergias: 'alergias',
  'condicoes cronicas': 'condicoesCronicas',
  observacoes: 'observacoes',
};

function normalizar(valor: string | undefined): string {
  if (!valor) return '';
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizarSexo(valor: string | undefined): string {
  const texto = normalizar(valor);
  if (['f', 'fem', 'feminino', 'mulher'].includes(texto)) return 'feminino';
  if (['m', 'masc', 'masculino', 'homem'].includes(texto)) return 'masculino';
  if (['outro', 'o'].includes(texto)) return 'outro';
  return 'nao_informado';
}

function normalizarData(valor: string | undefined): string {
  const texto = (valor ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;

  const brasileira = texto.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (brasileira) {
    const [, dia, mes, ano] = brasileira;
    const anoCompleto = ano.length === 2 ? `19${ano}` : ano;
    return `${anoCompleto}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }

  return texto;
}

function baixarModelo() {
  const conteudo = `${MODELO_CABECALHO.join(';')}\nMaria da Silva;529.982.247-25;1985-04-12;feminino;(11) 99999-0000;maria@email.com;01310-100;Av. Paulista;1000;Bela Vista;São Paulo;SP;;;;\n`;
  const blob = new Blob([`\uFEFF${conteudo}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'modelo-importacao-pacientes.csv';
  link.click();
  URL.revokeObjectURL(url);
}

export function ImportarPacientes() {
  const queryClient = useQueryClient();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [colunas, setColunas] = React.useState<string[]>([]);
  const [linhasBrutas, setLinhasBrutas] = React.useState<Record<string, string>[]>([]);
  const [mapeamento, setMapeamento] = React.useState<Partial<Record<keyof LinhaImportacaoPaciente, string>>>({});
  const [consentimento, setConsentimento] = React.useState(true);
  const [relatorio, setRelatorio] = React.useState<RelatorioImportacaoDto | null>(null);
  const [nomeArquivo, setNomeArquivo] = React.useState('');

  function aoSelecionarArquivo(arquivo: File) {
    setNomeArquivo(arquivo.name);
    setRelatorio(null);

    Papa.parse<Record<string, string>>(arquivo, {
      header: true,
      skipEmptyLines: true,
      delimiter: '',
      transformHeader: (cabecalho) => cabecalho.trim(),
      complete: (resultado) => {
        const registros = (resultado.data ?? []).filter((linha) =>
          Object.values(linha).some((valor) => String(valor ?? '').trim() !== ''),
        );

        if (registros.length === 0) {
          toast.error('Não encontramos linhas no arquivo.');
          return;
        }

        const cabecalhos = Object.keys(registros[0]);
        setColunas(cabecalhos);
        setLinhasBrutas(registros);

        const deteccao: Partial<Record<keyof LinhaImportacaoPaciente, string>> = {};
        for (const cabecalho of cabecalhos) {
          const campo = SINONIMOS[normalizar(cabecalho)];
          if (campo && !deteccao[campo]) deteccao[campo] = cabecalho;
        }
        setMapeamento(deteccao);

        toast.success(`${registros.length} linha(s) lidas — revise o mapeamento das colunas.`);
      },
      error: () => toast.error('Falha ao ler o arquivo. Verifique se é um CSV válido.'),
    });
  }

  const linhasMapeadas = React.useMemo<LinhaImportacaoPaciente[]>(() => {
    return linhasBrutas.map((linha, indice) => {
      const convertida = { linha: indice + 2 } as LinhaImportacaoPaciente;

      for (const campo of CAMPOS) {
        const coluna = mapeamento[campo.chave];
        if (!coluna) continue;
        const valor = String(linha[coluna] ?? '').trim();
        if (!valor) continue;

        if (campo.chave === 'sexo') convertida.sexo = normalizarSexo(valor);
        else if (campo.chave === 'dataNascimento') convertida.dataNascimento = normalizarData(valor);
        else convertida[campo.chave] = valor as never;
      }

      return convertida;
    });
  }, [linhasBrutas, mapeamento]);

  const faltandoObrigatorios = CAMPOS.filter(
    (campo) => campo.obrigatorio && !mapeamento[campo.chave],
  ).map((campo) => campo.rotulo);

  const importar = useMutation({
    mutationFn: async () => {
      const lotes: LinhaImportacaoPaciente[][] = [];
      for (let indice = 0; indice < linhasMapeadas.length; indice += 500) {
        lotes.push(linhasMapeadas.slice(indice, indice + 500));
      }

      const parciais: RelatorioImportacaoDto[] = [];
      for (const lote of lotes) {
        parciais.push(await pacienteService.importar({ linhas: lote, consentimentoLgpd: consentimento }));
      }

      return parciais.reduce<RelatorioImportacaoDto>(
        (acumulado, parcial) => ({
          totalLinhas: acumulado.totalLinhas + parcial.totalLinhas,
          importados: acumulado.importados + parcial.importados,
          ignorados: acumulado.ignorados + parcial.ignorados,
          erros: acumulado.erros + parcial.erros,
          detalhes: [...acumulado.detalhes, ...parcial.detalhes],
          idsImportados: [...acumulado.idsImportados, ...parcial.idsImportados],
        }),
        { totalLinhas: 0, importados: 0, ignorados: 0, erros: 0, detalhes: [], idsImportados: [] },
      );
    },
    onSuccess: (resultado) => {
      setRelatorio(resultado);
      toast.success(`Importação concluída: ${resultado.importados} paciente(s) importado(s).`);
      queryClient.invalidateQueries({ queryKey: ['pacientes'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  function baixarRelatorioCsv() {
    if (!relatorio) return;
    const linhas = relatorio.detalhes.map((detalhe) =>
      [detalhe.linha, detalhe.nome ?? '', detalhe.cpf ?? '', detalhe.motivo].join(';'),
    );
    const conteudo = `\uFEFFlinha;nome;cpf;motivo\n${linhas.join('\n')}`;
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'relatorio-importacao.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>1. Arquivo de origem</CardTitle>
          <Button variant="outline" size="sm" onClick={baixarModelo}>
            <Download aria-hidden />
            Baixar modelo CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert variant="info">
            <AlertDescription>
              Aceitamos arquivos CSV com separador ponto e vírgula ou vírgula. No Excel, use{' '}
              <strong>Arquivo → Salvar como → CSV (separado por ponto e vírgula)</strong>. A primeira
              linha deve conter os títulos das colunas.
            </AlertDescription>
          </Alert>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,.txt"
            className="hidden"
            onChange={(evento) => {
              const arquivo = evento.target.files?.[0];
              if (arquivo) aoSelecionarArquivo(arquivo);
            }}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              <Upload aria-hidden />
              Selecionar arquivo
            </Button>
            {nomeArquivo ? (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileSpreadsheet className="size-4" aria-hidden />
                {nomeArquivo} · {linhasBrutas.length} linha(s)
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {colunas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Mapeamento das colunas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faltandoObrigatorios.length > 0 ? (
              <Alert variant="warning">
                <AlertDescription>
                  Campos obrigatórios sem coluna: <strong>{faltandoObrigatorios.join(', ')}</strong>. Linhas
                  sem nome, CPF, data de nascimento ou sexo são ignoradas com o motivo no relatório.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="success">
                <AlertDescription>Todos os campos obrigatórios estão mapeados.</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {CAMPOS.map((campo) => (
                <div key={campo.chave} className="space-y-1.5">
                  <Label className="text-xs">
                    {campo.rotulo}
                    {campo.obrigatorio ? ' *' : ''}
                  </Label>
                  <Select
                    value={mapeamento[campo.chave] ?? '__nenhuma'}
                    onValueChange={(valor) =>
                      setMapeamento((anterior) => ({
                        ...anterior,
                        [campo.chave]: valor === '__nenhuma' ? undefined : valor,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Não importar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__nenhuma">Não importar</SelectItem>
                      {colunas.map((coluna) => (
                        <SelectItem key={coluna} value={coluna}>
                          {coluna}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {linhasBrutas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>3. Prévia e confirmação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Nascimento</TableHead>
                    <TableHead>Sexo</TableHead>
                    <TableHead>Telefone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhasMapeadas.slice(0, 5).map((linha) => (
                    <TableRow key={linha.linha}>
                      <TableCell className="text-xs text-muted-foreground">{linha.linha}</TableCell>
                      <TableCell>{linha.nome ?? '—'}</TableCell>
                      <TableCell className="tabular-nums">{linha.cpf ?? '—'}</TableCell>
                      <TableCell className="tabular-nums">{linha.dataNascimento ?? '—'}</TableCell>
                      <TableCell>{linha.sexo ?? '—'}</TableCell>
                      <TableCell>{linha.telefone ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-xs text-muted-foreground">
              Exibindo as 5 primeiras linhas de {linhasMapeadas.length}. Pacientes com CPF já cadastrado são
              ignorados e aparecem no relatório — a importação nunca sobrescreve cadastros existentes.
            </p>

            <label className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox
                checked={consentimento}
                onCheckedChange={(valor) => setConsentimento(valor === true)}
              />
              <span className="space-y-0.5">
                <span className="block text-sm font-medium">Registrar consentimento LGPD para os importados</span>
                <span className="block text-xs text-muted-foreground">
                  Marque quando a clínica já possui autorização formal dos pacientes para tratamento dos dados.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => importar.mutate()} carregando={importar.isPending}>
                <Upload aria-hidden />
                Importar {linhasMapeadas.length} linha(s)
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setColunas([]);
                  setLinhasBrutas([]);
                  setNomeArquivo('');
                  if (inputRef.current) inputRef.current.value = '';
                }}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {relatorio ? (
        <Card>
          <CardHeader>
            <CardTitle>Relatório da importação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">
                <CheckCircle2 className="mr-1 size-3" aria-hidden />
                {relatorio.importados} importado(s)
              </Badge>
              <Badge variant="warning">{relatorio.ignorados} ignorado(s)</Badge>
              <Badge variant="destructive">
                <AlertTriangle className="mr-1 size-3" aria-hidden />
                {relatorio.erros} com erro
              </Badge>
              <Badge variant="outline">{relatorio.totalLinhas} linha(s) no total</Badge>
            </div>

            {relatorio.detalhes.length > 0 ? (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Detalhes por linha</p>
                  <Button variant="outline" size="sm" onClick={baixarRelatorioCsv}>
                    <Download aria-hidden />
                    Baixar CSV
                  </Button>
                </div>
                <div className="max-h-80 overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Linha</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relatorio.detalhes.map((detalhe, indice) => (
                        <TableRow key={`${detalhe.linha}-${indice}`}>
                          <TableCell className="text-xs">{detalhe.linha}</TableCell>
                          <TableCell>{detalhe.nome ?? '—'}</TableCell>
                          <TableCell className="tabular-nums">{detalhe.cpf ?? '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{detalhe.motivo}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <Alert variant="success">
                <AlertTitle>Nenhum problema encontrado</AlertTitle>
                <AlertDescription>Todas as linhas foram importadas com sucesso.</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
