'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Diff, ScrollText, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/client/ui/page-header';
import { Button } from '@/client/ui/button';
import { Card, CardContent } from '@/client/ui/card';
import { Badge } from '@/client/ui/badge';
import { Input } from '@/client/ui/input';
import { Label } from '@/client/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/ui/select';
import { Alert, AlertDescription, EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/client/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/client/ui/table';
import { auditoriaService, type AuditoriaDto } from '@/client/services/usuario.service';
import { usuarioService } from '@/client/services/usuario.service';
import { usePermissoes } from '@/client/hooks/use-permissoes';
import { usePaginacao } from '@/client/hooks/use-paginacao';
import { formatarDataHora } from '@/client/lib/format';

const ENTIDADES = [
  'pacientes',
  'agendamentos',
  'atendimentos',
  'documentos',
  'templates_prontuario',
  'profiles',
  'profissionais',
  'unidades',
  'redes',
  'auth',
];

const ACOES = ['criar', 'atualizar', 'inativar', 'reativar', 'excluir', 'login', 'logout', 'exportar', 'emitir'];

export default function AuditoriaPage() {
  const { podeVerAuditoria } = usePermissoes();
  const { page, perPage, irPara } = usePaginacao(30);

  const [entidade, setEntidade] = React.useState('todas');
  const [acao, setAcao] = React.useState('todas');
  const [usuarioId, setUsuarioId] = React.useState('todos');
  const [de, setDe] = React.useState('');
  const [ate, setAte] = React.useState('');
  const [detalhe, setDetalhe] = React.useState<AuditoriaDto | null>(null);

  const consulta = useQuery({
    queryKey: ['auditoria', { entidade, acao, usuarioId, de, ate, page, perPage }],
    queryFn: () =>
      auditoriaService.listar({
        entidade: entidade === 'todas' ? undefined : entidade,
        acao: acao === 'todas' ? undefined : acao,
        usuarioId: usuarioId === 'todos' ? undefined : usuarioId,
        de: de || undefined,
        ate: ate || undefined,
        page,
        perPage,
      }),
    enabled: podeVerAuditoria,
    placeholderData: (anterior) => anterior,
  });

  const usuarios = useQuery({
    queryKey: ['usuarios', { ativo: undefined }],
    queryFn: () => usuarioService.listar({ perPage: 100 }),
    enabled: podeVerAuditoria,
  });

  if (!podeVerAuditoria) {
    return (
      <Alert variant="warning">
        <AlertDescription>
          A trilha de auditoria é restrita ao administrador da rede (§2.3).
        </AlertDescription>
      </Alert>
    );
  }

  const itens = consulta.data?.items ?? [];
  const total = (consulta.data?.meta.total as number | undefined) ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="space-y-5">
      <PageHeader
        titulo="Auditoria"
        descricao="Registro imutável das ações sensíveis: quem fez, quando, em qual entidade e quais valores mudaram (antes/depois)."
      >
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-3" aria-hidden />
          Dados pessoais são exibidos apenas para fins de conformidade e investigação — o acesso aqui também é
          auditado.
        </p>
      </PageHeader>

      <Card>
        <CardContent className="grid gap-3 p-4 sm:p-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-xs">Entidade</Label>
            <Select value={entidade} onValueChange={setEntidade}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ENTIDADES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Ação</Label>
            <Select value={acao} onValueChange={setAcao}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ACOES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Usuário</Label>
            <Select value={usuarioId} onValueChange={setUsuarioId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {(usuarios.data?.items ?? []).map((usuario) => (
                  <SelectItem key={usuario.id} value={usuario.id}>
                    {usuario.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auditoria-de" className="text-xs">
              De
            </Label>
            <Input id="auditoria-de" type="date" value={de} onChange={(evento) => setDe(evento.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auditoria-ate" className="text-xs">
              Até
            </Label>
            <Input id="auditoria-ate" type="date" value={ate} onChange={(evento) => setAte(evento.target.value)} />
          </div>
        </CardContent>
      </Card>

      {consulta.isLoading ? (
        <TabelaSkeleton linhas={8} />
      ) : itens.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum registro no período"
          descricao="Ajuste os filtros para localizar as ações auditadas."
          icone={ScrollText}
        />
      ) : (
        <Card>
          <CardContent className="p-0 sm:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {formatarDataHora(registro.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{registro.usuarioNome ?? 'sistema'}</p>
                      <p className="text-xs text-muted-foreground">
                        {registro.usuarioRole ?? registro.usuarioEmail ?? ''}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          registro.acao === 'excluir'
                            ? 'destructive'
                            : registro.acao === 'criar'
                              ? 'success'
                              : 'secondary'
                        }
                      >
                        {registro.acaoLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{registro.entidade}</TableCell>
                    <TableCell className="max-w-sm truncate text-sm text-muted-foreground">
                      {registro.descricao ?? '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {registro.dadosAntes || registro.dadosDepois ? (
                        <Button variant="outline" size="sm" onClick={() => setDetalhe(registro)}>
                          <Diff aria-hidden />
                          Alterações
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          <Search className="mr-1 inline size-3" aria-hidden />
          {total} registro(s) · página {page} de {totalPaginas}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => irPara(page - 1)}>
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPaginas}
            onClick={() => irPara(page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <Dialog open={Boolean(detalhe)} onOpenChange={(aberto) => !aberto && setDetalhe(null)}>
        <DialogContent tamanho="lg">
          <DialogHeader>
            <DialogTitle>
              {detalhe?.acaoLabel} · {detalhe?.entidade}
            </DialogTitle>
            <DialogDescription>
              {formatarDataHora(detalhe?.createdAt ?? '')} · {detalhe?.usuarioNome ?? 'sistema'}
              {detalhe?.ip ? ` · IP ${detalhe.ip}` : ''}
              {detalhe?.origem ? ` · origem ${detalhe.origem}` : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Antes</p>
              <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                {detalhe?.dadosAntes ? JSON.stringify(detalhe.dadosAntes, null, 2) : '—'}
              </pre>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Depois</p>
              <pre className="max-h-72 overflow-auto rounded-md border bg-muted/40 p-3 text-xs">
                {detalhe?.dadosDepois ? JSON.stringify(detalhe.dadosDepois, null, 2) : '—'}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
