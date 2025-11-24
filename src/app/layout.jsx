import './globals.css';
import Navbar from '@/components/layout/Navbar';
import { ClientProviders } from '@/components/providers/ClientProviders';

export const metadata = {
  title: 'Gestion Scolaire',
  description: 'Application de gestion scolaire complète',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
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
