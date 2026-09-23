import type { MetadataRoute } from 'next';
import { siteConfig } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/konto', '/koszyk', '/zamowienie', '/api', '/auth', '/newsletter'] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
