/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: '**.supabase.in' },
    ],
  },
  eslint: {
    // O lint de arquitetura roda em `npm run lint`; o build não deve falhar por estilo.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
