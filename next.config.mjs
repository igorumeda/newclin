/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    serverComponentsExternalPackages: ['pg', 'nodemailer', 'pdf-lib', '@electric-sql/pglite'],
  },
  logging: { fetches: { fullUrl: false } },
};

export default nextConfig;
