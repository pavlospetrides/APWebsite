import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { exampleProjects } from '@/lib/projects.seed';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ['', '/renovations', '/new-builds', '/repairs', '/projects', '/contact'];
  return ['el','en'].flatMap(locale => [...pages.map(path => ({ url: `${siteConfig.url}/${locale}${path}`, lastModified: new Date(), changeFrequency: path === '' ? 'monthly' as const : 'yearly' as const, priority: path === '' ? 1 : .8 })), ...exampleProjects.map(project => ({ url: `${siteConfig.url}/${locale}/projects/${project.slug}`, lastModified: new Date(), changeFrequency: 'yearly' as const, priority: .6 }))]);
}
