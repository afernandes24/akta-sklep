import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/courier-prime/400.css';
import '@fontsource/courier-prime/700.css';
import './globals.css';

import type { Metadata, Viewport } from 'next';
import { CartProvider } from '@/components/cart/CartProvider';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { Trackers } from '@/components/consent/Trackers';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — gry detektywistyczne do druku (PDF)`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: 'website',
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    url: siteConfig.url,
    images: [{ url: '/og.png', width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#0c0b0a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="flex min-h-screen flex-col">
        <a href="#tresc" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-brass-400 focus:px-3 focus:py-2 focus:text-ink-950">
          Przejdź do treści
        </a>
        <CartProvider>
          <Header />
          <main id="tresc" className="flex-1">
            {children}
          </main>
          <Footer />
          <CookieBanner />
          <Trackers />
        </CartProvider>
      </body>
    </html>
  );
}
