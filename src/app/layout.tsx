import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MuiProvider from './components/MuiProvider';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Aluminio San Francisco - Vidrio y Aluminio en León, Guanajuato",
    template: "%s | Aluminio San Francisco León"
  },
  description: "Aluminio San Francisco: Especialistas en vidrio y aluminio en León, Guanajuato. Más de 30 años fabricando ventanas, puertas, cancelería y domos. Servicio residencial de calidad. ¡Cotización gratuita!",
  keywords: [
    "Aluminio San Francisco",
    "vidrio y aluminio León",
    "ventanas León Guanajuato",
    "puertas aluminio León",
    "cancelería León",
    "domos León",
    "vidrio templado León",
    "aluminio residencial León",
    "ventanas residenciales",
    "puertas de aluminio",
    "cancelería de vidrio",
    "servicio León Guanajuato",
    "aluminio arquitectónico León"
  ],
  authors: [{ name: "Aluminio San Francisco" }],
  creator: "Aluminio San Francisco",
  publisher: "Aluminio San Francisco",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://aluminiosanfrancisco.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Aluminio San Francisco - Vidrio y Aluminio en León, Guanajuato",
    description: "Especialistas en vidrio y aluminio en León. Más de 30 años creando ventanas, puertas y cancelería de calidad. Servicio residencial profesional. ¡Cotización gratuita!",
    url: 'https://aluminiosanfrancisco.com',
    siteName: 'Aluminio San Francisco',
    locale: 'es_MX',
    type: 'website',
    images: [
      {
        url: '/logo_aluminos.png',
        width: 1200,
        height: 630,
        alt: 'Aluminio San Francisco - Vidrio y Aluminio en León',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Aluminio San Francisco - Vidrio y Aluminio en León",
    description: "Especialistas en vidrio y aluminio en León, Guanajuato. Más de 30 años de experiencia. ¡Cotización gratuita!",
    images: ['/logo_aluminos.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'tu-codigo-de-verificacion-google',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo128.png" />
        <meta name="geo.region" content="MX-GTO" />
        <meta name="geo.placename" content="León, Guanajuato" />
        <meta name="geo.position" content="21.1619;-101.6956" />
        <meta name="ICBM" content="21.1619, -101.6956" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MuiProvider>
          {children}
        </MuiProvider>
      </body>
    </html>
  );
}
