import type { Locale } from './i18n';

export type ProjectCategory = 'renovation' | 'new-build' | 'repair' | 'lighting';
export type PortfolioImage = { src: string; alt: Record<Locale, string> };
export type PortfolioProject = {
  slug: string;
  category: ProjectCategory;
  year: number | null;
  location: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  cover: string | null;
  coverAlt: Record<Locale, string>;
  images: PortfolioImage[];
  featured: boolean;
  updatedAt: string;
};

export function bilingualValue(
  el: string | null | undefined,
  en: string | null | undefined,
  fallback: Record<Locale, string> = { el: '', en: '' },
): Record<Locale, string> {
  const cleanEl = el?.trim() || '';
  const cleanEn = en?.trim() || '';
  return {
    el: cleanEl || cleanEn || fallback.el,
    en: cleanEn || cleanEl || fallback.en,
  };
}

export const categoryLabel: Record<ProjectCategory, Record<Locale, string>> = {
  renovation: { el: 'Ανακαίνιση', en: 'Renovation' },
  'new-build': { el: 'Νέα κατασκευή', en: 'New build' },
  repair: { el: 'Επισκευή', en: 'Repair' },
  lighting: { el: 'Φωτισμός', en: 'Lighting' },
};
