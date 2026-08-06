// Sitemap generator for SERVIO
// This can be used to generate a dynamic sitemap

export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export function generateSitemap(entries: SitemapEntry[]): string {
  const baseUrl = 'https://archyveservizio.vercel.app';
  
  const xmlEntries = entries.map(entry => {
    const url = entry.url.startsWith('http') ? entry.url : `${baseUrl}${entry.url}`;
    return `
  <url>
    <loc>${url}</loc>
    ${entry.lastModified ? `<lastmod>${entry.lastModified}</lastmod>` : ''}
    ${entry.changeFrequency ? `<changefreq>${entry.changeFrequency}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

// Static sitemap entries
export const staticSitemapEntries: SitemapEntry[] = [
  {
    url: '/',
    changeFrequency: 'daily',
    priority: 1.0,
  },
  {
    url: '/search',
    changeFrequency: 'daily',
    priority: 0.9,
  },
  {
    url: '/faq',
    changeFrequency: 'monthly',
    priority: 0.5,
  },
  {
    url: '/login',
    changeFrequency: 'monthly',
    priority: 0.3,
  },
  {
    url: '/signup',
    changeFrequency: 'monthly',
    priority: 0.3,
  },
];

// Function to generate dynamic provider profile sitemap entries
export async function generateProviderSitemapEntries(): Promise<SitemapEntry[]> {
  // This would typically fetch from your database
  // For now, return empty array - implement with actual data fetching
  return [];
}

// Function to generate complete sitemap
export async function generateCompleteSitemap(): Promise<string> {
  const providerEntries = await generateProviderSitemapEntries();
  const allEntries = [...staticSitemapEntries, ...providerEntries];
  return generateSitemap(allEntries);
}
