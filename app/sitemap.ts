import type { MetadataRoute } from 'next';
import { getPublishedCases } from '@/lib/cases';
import { siteConfig } from '@/lib/config';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const cases = await getPublishedCases();
  const staticPages = ['', '/sprawy', '/darmowa-sprawa', '/o-nas', '/faq', '/kontakt', '/regulamin', '/zwroty-i-reklamacje', '/polityka-prywatnosci', '/polityka-cookies', '/nota-prawna'];
  return [
    ...staticPages.map((p) => ({
      url: `${siteConfig.url}${p}`,
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : p === '/sprawy' ? 0.9 : 0.5,
    })),
    ...cases.map((c) => ({
      url: `${siteConfig.url}/sprawy/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ];
}
