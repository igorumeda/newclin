'use client';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Algo deu errado</h1>
        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
          {error.message || 'Erro inesperado ao carregar a aplicação.'}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: '1.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', cursor: 'pointer' }}
        >
          Tentar novamente
        </button>
      </body>
    </html>
  );
}
