import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar el modo estricto de React
  reactStrictMode: true,

  // Configurar dominios permitidos para imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/aluminios-88a45.firebasestorage.app/o/**',
      },
    ],
  },

  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://aluminiosanfrancisco.com',
    NEXT_PUBLIC_COMPANY_NAME: 'Aluminio San Francisco',
    NEXT_PUBLIC_COMPANY_LOCATION: 'San Francisco del Rincón, Guanajuato',
  },

  // Configuración para optimización SEO
  poweredByHeader: false,
  
  // Configuración de headers para SEO
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },

  // Configuración para sitemap
  trailingSlash: false,
};

export default nextConfig;