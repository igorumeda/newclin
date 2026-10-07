'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/client/ui/layout/page-container.component';
import { PageTitle } from '@/client/ui/typography/page-title.component';
import { EmptyState } from '@/client/ui/typography/empty-state.component';
import { LoadingSkeleton } from '@/client/ui/feedback/loading-skeleton.component';
import { ROTULO_TIPO_CAMPO } from '../../../domain/value-objects/tipo-campo.vo';
import type { TipoCampoValue } from '../../../domain/value-objects/tipo-campo.vo';
import type { TemplateResponseDto } from '../../dtos/prontuario.response.dto';
import { prontuarioApiService } from '../../services/prontuario-api.service';

export function TemplatesPage() {
  const [selecionado, setSelecionado] = useState<TemplateResponseDto | null>(null);

  const templates = useQuery({
    queryKey: ['templates'],
    queryFn: () => prontuarioApiService.listarTemplates({}),
  });

  return (
    <PageContainer>
      <PageTitle
        titulo="Templates de prontuário"
        descricao="Estruturas dinâmicas por especialidade. Alterações geram uma nova versão."
      />

      {templates.isLoading ? (
        <LoadingSkeleton linhas={4} />
      ) : (templates.data?.length ?? 0) === 0 ? (
        <EmptyState
          titulo="Nenhum template cadastrado"
          descricao="Rode o seed ou cadastre um template pela API."
          icone={<FileSpreadsheet className="h-8 w-8" aria-hidden />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.data?.map((template) => (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-start justify-between gap-2 text-base">
                  <span className="min-w-0 truncate">{template.nome}</span>
                  <Badge variant="secondary">v{template.versao}</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{template.especialidade}</p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">{template.descricao ?? 'Sem descrição'}</p>
                  <p>
                    {template.secoes.length} seção(ões) · {template.totalCampos} campo(s)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.padrao ? <Badge variant="info">Padrão</Badge> : null}
                    <Badge variant={template.ativo ? 'success' : 'outline'}>
                      {template.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setSelecionado(template)}>
                  Ver estrutura
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={Boolean(selecionado)}
        onOpenChange={(estado) => (!estado ? setSelecionado(null) : undefined)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selecionado?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {selecionado?.secoes.map((secao) => (
              <div key={secao.id} className="space-y-2">
                <p className="font-medium">{secao.titulo}</p>
                <ul className="divide-y rounded-md border text-sm">
                  {secao.campos.map((campo) => (
                    <li key={campo.id} className="flex items-center justify-between gap-3 p-3">
                      <span className="min-w-0 truncate">
                        {campo.rotulo}
                        {campo.obrigatorio ? (
                          <span className="ml-1 text-destructive" aria-hidden>
                            *
                          </span>
                        ) : null}
                      </span>
                      <Badge variant="outline">
                        {ROTULO_TIPO_CAMPO[campo.tipo as TipoCampoValue]}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
