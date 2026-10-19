/** Regras de anexo da v1.0: PDF, JPG e PNG com limite de 10 MB por arquivo. */
export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
] as const;

export const ALLOWED_LOGO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'] as const;

export const STORAGE_BUCKET_LOGOS = 'logos';
export const STORAGE_BUCKET_ATTACHMENTS = 'anexos';
export const STORAGE_BUCKET_DOCUMENTS = 'documentos';

export const STORAGE_SIGNED_URL_TTL_SECONDS = 600;
