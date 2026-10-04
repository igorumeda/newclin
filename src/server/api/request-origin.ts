/** Valida a origem pública mesmo quando a URL interna usa outro host ou protocolo. */
export function isTrustedRequestOrigin(request: Request, appUrl: string): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;

  try {
    const source = new URL(origin);
    if (!['http:', 'https:'].includes(source.protocol) || source.origin !== origin)
      return false;

    const target = new URL(request.url);
    const allowed = new Set([target.origin, new URL(appUrl).origin]);
    const host = request.headers.get('host');
    const forwardedProtocol = request.headers.get('x-forwarded-proto');
    const protocol = forwardedProtocol ? `${forwardedProtocol}:` : target.protocol;
    if (host && ['http:', 'https:'].includes(protocol)) {
      const publicUrl = new URL(`${protocol}//${host}`);
      if (publicUrl.host === host && publicUrl.pathname === '/')
        allowed.add(publicUrl.origin);
    }
    return allowed.has(source.origin);
  } catch {
    return false;
  }
}
