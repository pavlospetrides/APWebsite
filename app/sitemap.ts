import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { getPublishedProjects } from '@/lib/projects';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ['', '/renovations', '/new-builds', '/repairs', '/projects', '/contact', '/privacy', '/cookies', '/legal', '/terms'];
  const projects = await getPublishedProjects();
  return ['el', 'en'].flatMap((locale) => [
    ...pages.map((path) => ({
      url: `${siteConfig.url}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path === '' ? 'monthly' as const : 'yearly' as const,
      priority: path === '' ? 1 : 0.8,
    })),
    ...projects.map((project) => ({
      url: `${siteConfig.url}/${locale}/projects/${project.slug}`,
      lastModified: new Date(project.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]);
}
