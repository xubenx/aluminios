import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cambiar el directorio de salida a "build"

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

};

export default nextConfig;