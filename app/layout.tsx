import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { siteConfig } from '@/config/site';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: 'AP Electrical Services | Ηλεκτρολογικές εργασίες κατοικιών', template: '%s | AP Electrical Services' },
  description:
    'Ηλεκτρολογικές εγκαταστάσεις, ανακαινίσεις και επισκευές για κατοικίες.',
  applicationName: 'AP Electrical Services',
  openGraph: { type: 'website', siteName: 'AP Electrical Services', title: 'AP Electrical Services', description: 'Electrical installations · Renovations · Repairs', images: [{ url: '/og.webp', width: 1200, height: 630, alt: 'AP Electrical Services' }] },
  twitter: { card: 'summary_large_image', title: 'AP Electrical Services', description: 'Electrical installations · Renovations · Repairs', images: ['/og.webp'] },
  icons: { icon: '/favicon.svg' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
