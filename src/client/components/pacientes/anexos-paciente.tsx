'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FileText, Paperclip, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/client/ui/button';
import { Badge } from '@/client/ui/badge';
import { Alert, AlertDescription, EstadoVazio, TabelaSkeleton } from '@/client/ui/feedback';
import { ConfirmDialog } from '@/client/ui/overlay';
import { Input } from '@/client/ui/input';
import { prontuarioService, type AnexoDto } from '@/client/services/prontuario.service';
import { mensagemDeErro } from '@/client/services/api-client.service';
import { formatarBytes, formatarDataHora } from '@/client/lib/format';
import {
  ALLOWED_ATTACHMENT_MIME_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_MB,
} from '@/shared/constants/upload.constants';

const MIMES_ACEITOS = ALLOWED_ATTACHMENT_MIME_TYPES as readonly string[];

function lerComoBase64(arquivo: File): Promise<string> {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => {
      const resultado = String(leitor.result ?? '');
      resolver(resultado.includes(',') ? resultado.split(',')[1] : resultado);
    };
    leitor.onerror = () => rejeitar(new Error('Falha ao ler o arquivo'));
    leitor.readAsDataURL(arquivo);
  });
}

/** Anexos do paciente (§3.6 — PDF/JPG/PNG até 10 MB, links assinados com expiração). */
export function AnexosPaciente({
  pacienteId,
  atendimentoId,
  podeEditar = true,
}: {
  pacienteId: string;
  atendimentoId?: string | null;
  podeEditar?: boolean;
}) {
  const queryClient = useQueryClient();
  const [descricao, setDescricao] = React.useState('');
  const [anexoParaRemover, setAnexoParaRemover] = React.useState<AnexoDto | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const consulta = useQuery({
    queryKey: ['anexos', { pacienteId, atendimentoId }],
    queryFn: () =>
      prontuarioService.listarAnexos({
        pacienteId,
        atendimentoId: atendimentoId ?? undefined,
      }),
  });

  const enviar = useMutation({
    mutationFn: async (arquivo: File) => {
      if (!MIMES_ACEITOS.includes(arquivo.type)) {
        throw new Error('Formato não permitido. Envie PDF, JPG ou PNG.');
      }
      if (arquivo.size > MAX_UPLOAD_SIZE_BYTES) {
        throw new Error(`Arquivo maior que ${MAX_UPLOAD_SIZE_MB} MB.`);
      }

      const conteudoBase64 = await lerComoBase64(arquivo);

      return prontuarioService.enviarAnexo({
        pacienteId,
        atendimentoId: atendimentoId ?? null,
        nomeArquivo: arquivo.name,
        descricao: descricao || null,
        mimeType: arquivo.type,
        tamanhoBytes: arquivo.size,
        conteudoBase64,
      });
    },
    onSuccess: () => {
      toast.success('Anexo enviado');
      setDescricao('');
      if (inputRef.current) inputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['anexos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const remover = useMutation({
    mutationFn: (anexoId: string) => prontuarioService.removerAnexo(anexoId),
    onSuccess: () => {
      toast.success('Anexo removido');
      setAnexoParaRemover(null);
      queryClient.invalidateQueries({ queryKey: ['anexos'] });
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  const abrir = useMutation({
    mutationFn: (anexoId: string) => prontuarioService.obterLinkAnexo(anexoId),
    onSuccess: (link) => {
      if (!link.url) {
        toast.error('Não foi possível gerar o link do anexo');
        return;
      }
      window.open(link.url, '_blank', 'noopener,noreferrer');
    },
    onError: (erro) => toast.error(mensagemDeErro(erro)),
  });

  return (
    <div className="space-y-4">
      {podeEditar ? (
        <Alert variant="info">
          <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-medium" htmlFor="anexo-descricao">
                Descrição do anexo (opcional)
              </label>
              <Input
                id="anexo-descricao"
                value={descricao}
                onChange={(evento) => setDescricao(evento.target.value)}
                placeholder="Ex.: hemograma de 12/03"
              />
            </div>
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="file"
                accept={MIMES_ACEITOS.join(',')}
                className="hidden"
                onChange={(evento) => {
                  const arquivo = evento.target.files?.[0];
                  if (arquivo) enviar.mutate(arquivo);
                }}
              />
              <Button
                type="button"
                variant="outline"
                carregando={enviar.isPending}
                onClick={() => inputRef.current?.click()}
              >
                <Upload aria-hidden />
                Enviar arquivo
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : null}

      {consulta.isLoading ? (
        <TabelaSkeleton linhas={3} />
      ) : (consulta.data ?? []).length === 0 ? (
        <EstadoVazio
          titulo="Nenhum anexo"
          descricao={`Envie laudos e exames em PDF, JPG ou PNG (até ${MAX_UPLOAD_SIZE_MB} MB). DICOM será suportado em versões futuras.`}
          icone={Paperclip}
        />
      ) : (
        <ul className="divide-y rounded-lg border">
          {(consulta.data ?? []).map((anexo) => (
            <li key={anexo.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{anexo.nomeArquivo}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatarBytes(anexo.tamanhoBytes)} · {formatarDataHora(anexo.createdAt)}
                    {anexo.descricao ? ` · ${anexo.descricao}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline">{anexo.mimeType.split('/')[1]?.toUpperCase()}</Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => abrir.mutate(anexo.id)}
                  carregando={abrir.isPending && abrir.variables === anexo.id}
                >
                  <Download aria-hidden />
                  Abrir
                </Button>
                {podeEditar ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remover ${anexo.nomeArquivo}`}
                    onClick={() => setAnexoParaRemover(anexo)}
                  >
                    <Trash2 className="text-destructive" aria-hidden />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        aberto={Boolean(anexoParaRemover)}
        aoMudar={(aberto) => {
          if (!aberto) setAnexoParaRemover(null);
        }}
        titulo="Remover anexo"
        descricao={`O arquivo "${anexoParaRemover?.nomeArquivo ?? ''}" será removido do prontuário. A ação fica registrada na auditoria.`}
        textoConfirmar="Remover"
        carregando={remover.isPending}
        onConfirmar={() => anexoParaRemover && remover.mutate(anexoParaRemover.id)}
      />
    </div>
  );
}
