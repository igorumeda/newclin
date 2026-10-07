'use client';

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { FileUp, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { FormField } from '@/client/ui/forms/form-field.component';
import { parseCsv } from '@/shared/utils/csv.util';
import type { CsvRow } from '@/shared/utils/csv.util';
import type {
  ImportacaoResponseDto,
  MapeamentoColunasRequestDto,
} from '../../dtos/paciente.response.dto';
import { pacienteApiService } from '../../services/paciente-api.service';

type CampoSistema = {
  chave: keyof MapeamentoColunasRequestDto;
  rotulo: string;
  obrigatorio: boolean;
  sugestoes: string[];
};

const CAMPOS_SISTEMA: CampoSistema[] = [
  { chave: 'nome', rotulo: 'Nome', obrigatorio: true, sugestoes: ['nome', 'paciente'] },
  { chave: 'cpf', rotulo: 'CPF', obrigatorio: true, sugestoes: ['cpf', 'documento'] },
  {
    chave: 'dataNascimento',
    rotulo: 'Data de nascimento',
    obrigatorio: true,
    sugestoes: ['nascimento', 'data_nasc', 'dt_nascimento'],
  },
  { chave: 'sexo', rotulo: 'Sexo', obrigatorio: false, sugestoes: ['sexo', 'genero'] },
  { chave: 'telefone', rotulo: 'Telefone', obrigatorio: false, sugestoes: ['telefone', 'celular'] },
  { chave: 'email', rotulo: 'E-mail', obrigatorio: false, sugestoes: ['email', 'e-mail'] },
  {
    chave: 'responsavelNome',
    rotulo: 'Responsável',
    obrigatorio: false,
    sugestoes: ['responsavel', 'mae', 'pai'],
  },
  {
    chave: 'responsavelTelefone',
    rotulo: 'Telefone do responsável',
    obrigatorio: false,
    sugestoes: ['telefone_responsavel'],
  },
  {
    chave: 'observacoes',
    rotulo: 'Observações',
    obrigatorio: false,
    sugestoes: ['observacao', 'obs'],
  },
];

const SEM_MAPEAMENTO = '__nenhuma__';

function sugerirColuna(campo: CampoSistema, colunas: string[]): string {
  const encontrada = colunas.find((coluna) => {
    const normalizada = coluna
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return campo.sugestoes.some((sugestao) => normalizada.includes(sugestao));
  });
  return encontrada ?? SEM_MAPEAMENTO;
}

export function ImportarPacientesPage() {
  const [arquivoNome, setArquivoNome] = useState('');
  const [colunas, setColunas] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<CsvRow[]>([]);
  const [mapeamento, setMapeamento] = useState<Record<string, string>>({});
  const [relatorio, setRelatorio] = useState<ImportacaoResponseDto | null>(null);

  async function selecionarArquivo(evento: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;

    const conteudo = await arquivo.text();
    const analisado = parseCsv({ content: conteudo });
    if (analisado.rows.length === 0) {
      toast.error('Não foi possível ler linhas do arquivo');
      return;
    }

    setArquivoNome(arquivo.name);
    setColunas(analisado.headers);
    setLinhas(analisado.rows);
    setRelatorio(null);

    const automatico: Record<string, string> = {};
    CAMPOS_SISTEMA.forEach((campo) => {
      automatico[campo.chave] = sugerirColuna(campo, analisado.headers);
    });
    setMapeamento(automatico);
  }

  const importar = useMutation({
    mutationFn: () => {
      const mapeado: Record<string, string> = {};
      Object.entries(mapeamento).forEach(([campo, coluna]) => {
        if (coluna && coluna !== SEM_MAPEAMENTO) mapeado[campo] = coluna;
      });

      return pacienteApiService.importar({
        arquivoNome,
        mapeamento: mapeado as unknown as MapeamentoColunasRequestDto,
        linhas,
        consentimentoLgpd: false,
      });
    },
    onSuccess: (resultado) => {
      setRelatorio(resultado);
      toast.success(`${resultado.importados} paciente(s) importado(s)`);
    },
    onError: (erro: Error) => toast.error(erro.message),
  });

  const obrigatoriosPreenchidos = CAMPOS_SISTEMA.filter((campo) => campo.obrigatorio).every(
    (campo) => mapeamento[campo.chave] && mapeamento[campo.chave] !== SEM_MAPEAMENTO,
  );

  return (
    <PageContainer>
      <BreadcrumbNav
        itens={[{ titulo: 'Pacientes', href: '/pacientes' }, { titulo: 'Importar' }]}
      />
      <PageTitle
        titulo="Importar pacientes"
        descricao="Envie um CSV, relacione as colunas aos campos do sistema e confira o relatório."
      />

      <Card>
        <CardHeader>
          <CardTitle>1. Arquivo</CardTitle>
          <CardDescription>
            Formatos aceitos: CSV separado por vírgula ou ponto e vírgula.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <FormField rotulo="Arquivo CSV">
            <Input type="file" accept=".csv,text/csv" onChange={selecionarArquivo} />
          </FormField>
          {linhas.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              <strong>{arquivoNome}</strong> — {linhas.length} linha(s), {colunas.length} coluna(s)
            </p>
          ) : null}
        </CardContent>
      </Card>

      {colunas.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>2. Relacionar colunas</CardTitle>
            <CardDescription>
              Os campos obrigatórios precisam estar mapeados para iniciar a importação.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {CAMPOS_SISTEMA.map((campo) => (
              <FormField key={campo.chave} rotulo={campo.rotulo} obrigatorio={campo.obrigatorio}>
                <Select
                  value={mapeamento[campo.chave] ?? SEM_MAPEAMENTO}
                  onValueChange={(valor) =>
                    setMapeamento((atual) => ({ ...atual, [campo.chave]: valor }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a coluna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_MAPEAMENTO}>Não importar</SelectItem>
                    {colunas.map((coluna) => (
                      <SelectItem key={coluna} value={coluna}>
                        {coluna}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {linhas.length > 0 ? (
        <Button
          onClick={() => importar.mutate()}
          disabled={!obrigatoriosPreenchidos || importar.isPending}
        >
          <Upload className="h-4 w-4" aria-hidden />
          Importar {linhas.length} linha(s)
        </Button>
      ) : null}

      {relatorio ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" aria-hidden />
              Relatório da importação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">{relatorio.importados} importados</Badge>
              <Badge variant="warning">{relatorio.ignorados} ignorados</Badge>
              <Badge variant="destructive">{relatorio.erros} com erro</Badge>
            </div>

            {relatorio.detalhes.length > 0 ? (
              <Alert>
                <AlertTitle>Detalhes por linha</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto text-sm">
                    {relatorio.detalhes.map((detalhe) => (
                      <li key={`${detalhe.linha}-${detalhe.situacao}`}>
                        Linha {detalhe.linha}: <strong>{detalhe.situacao}</strong> —{' '}
                        {detalhe.mensagem}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </PageContainer>
  );
}
