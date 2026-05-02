import type { Metadata } from 'next';
import './globals.css';
import { SeasonProvider } from '@/components/SeasonContext';
import NavbarWrapper from '@/components/NavbarWrapper';

export const metadata: Metadata = {
  title: 'HockeyTables — NHL Stats',
  description: 'NHL player, goalie and team statistics powered by the NHL API',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-base text-white antialiased">
        <SeasonProvider>
          <NavbarWrapper />
          <main className="mx-auto max-w-screen-2xl px-4 py-6">{children}</main>
        </SeasonProvider>
      </body>
    </html>
  );
}
