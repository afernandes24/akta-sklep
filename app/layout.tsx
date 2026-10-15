import './globals.css';
import localFont from 'next/font/local';

import type { Metadata, Viewport } from 'next';
import { CartProvider } from '@/components/cart/CartProvider';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { Trackers } from '@/components/consent/Trackers';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { siteConfig } from '@/lib/config';
import { PageBeacon } from '@/components/analytics/PageBeacon';

/**
 * Czcionki z własnego serwera (app/fonts: znaki łacińskie + polskie w jednym pliku).
 * next/font dobiera wymiary czcionki zastępczej do docelowej, więc tekst nie „skacze”
 * po doczytaniu czcionki, a najważniejsze pliki są pobierane od razu (preload).
 */
const aktaInter = localFont({
  src: [
    { path: './fonts/inter-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/inter-500.woff2', weight: '500', style: 'normal' },
    { path: './fonts/inter-600.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-sans',
  display: 'swap',
  adjustFontFallback: 'Arial',
});
const aktaPlayfair = localFont({
  src: [
    { path: './fonts/playfair-display-600.woff2', weight: '600', style: 'normal' },
    { path: './fonts/playfair-display-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-serif',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
const aktaCourier = localFont({
  src: [
    { path: './fonts/courier-prime-400.woff2', weight: '400', style: 'normal' },
    { path: './fonts/courier-prime-700.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-mono',
  display: 'swap',
  preload: false,
  adjustFontFallback: false,
});

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
    <html lang="pl" className={`${aktaInter.variable} ${aktaPlayfair.variable} ${aktaCourier.variable}`}>
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
          <PageBeacon />
        </CartProvider>
      </body>
    </html>
  );
}
