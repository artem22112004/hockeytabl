import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { SeasonProvider } from '@/components/SeasonContext';
import NavbarWrapper from '@/components/NavbarWrapper';
import LiveScoresBar from '@/components/LiveScoresBar';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'HockeyTables — NHL Analytics',
  description: 'Premium NHL statistics — player, goalie and team analytics',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-base text-white antialiased">
        <SeasonProvider>
          <LiveScoresBar />
          <NavbarWrapper />
          <main className="mx-auto max-w-screen-2xl px-4 py-6">{children}</main>
        </SeasonProvider>
      </body>
    </html>
  );
}
