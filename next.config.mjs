/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : [],
  },
  // Stare sprawy (usunięte) → 301 na najbliższą obecną sprawę albo katalog, żeby nie tracić ruchu z Google
  async redirects() {
    const stare = {
      'ostatni-lot-sp-krw': '/sprawy/alarm-na-wysokosci',
      'katastrofa-nad-sniardwami': '/sprawy/alarm-na-wysokosci',
      latarnik: '/sprawy/cisza-po-sezonie',
      'lza-baltyku': '/sprawy/cisza-po-sezonie',
      'czlowiek-za-burta': '/sprawy/cisza-po-sezonie',
      anonimy: '/sprawy',
      'morderstwo-w-hotelu': '/sprawy',
    };
    return Object.entries(stare).map(([slug, destination]) => ({ source: `/sprawy/${slug}`, destination, statusCode: 301 }));
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Przeglądarka zawsze łączy się przez HTTPS (rok). Bez includeSubDomains — nie blokuje innych subdomen.
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
