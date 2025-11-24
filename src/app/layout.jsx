import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { ClientProviders } from '@/components/providers/ClientProviders';

export const metadata = {
  title: 'Gestion Scolaire',
  description: 'Application de gestion scolaire complète',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gestion Scolaire',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <ClientProviders>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  );
}
