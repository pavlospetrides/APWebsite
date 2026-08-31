import { createClient } from '@supabase/supabase-js';
import { bilingualValue, type PortfolioProject, type ProjectCategory } from './project-types';

type DbImage = { storage_path: string; cover_storage_path: string | null; alt_el: string | null; alt_en: string | null; sort_order: number };
type DbProject = {
  slug: string;
  title_el: string | null;
  title_en: string | null;
  description_el: string | null;
  description_en: string | null;
  category: ProjectCategory;
  year: number | null;
  location_el: string | null;
  location_en: string | null;
  cover_path: string | null;
  featured: boolean;
  updated_at: string;
  project_images: DbImage[] | null;
};

export async function getPublishedProjects(): Promise<PortfolioProject[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || url.includes('YOUR_') || key.startsWith('YOUR_')) return [];

  try {
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase
      .from('projects')
      .select('slug,title_el,title_en,description_el,description_en,category,year,location_el,location_en,cover_path,featured,updated_at,project_images(storage_path,cover_storage_path,alt_el,alt_en,sort_order)')
      .eq('status', 'published')
      .order('updated_at', { ascending: false });
    if (error || !data) return [];

    const rows = data as unknown as DbProject[];
    const paths = [...new Set(rows.flatMap((row) => [
      row.cover_path,
      ...(row.project_images || []).flatMap((image) => [image.storage_path, image.cover_storage_path]),
    ].filter((path): path is string => Boolean(path))))];
    const signedByPath = new Map<string, string>();
    if (paths.length) {
      const signed = await supabase.storage.from('project-images').createSignedUrls(paths, 3600);
      signed.data?.forEach((item, index) => {
        if (item.signedUrl) signedByPath.set(paths[index], item.signedUrl);
      });
    }

    return rows.map((row) => {
      const imageRows = [...(row.project_images || [])].sort((a, b) => a.sort_order - b.sort_order);
      const title = bilingualValue(row.title_el, row.title_en, { el: 'Έργο', en: 'Project' });
      const description = bilingualValue(row.description_el, row.description_en, { el: 'Περιγραφή έργου', en: 'Project description' });
      const images = imageRows.flatMap((image) => {
        const src = signedByPath.get(image.storage_path);
        return src ? [{ src, alt: bilingualValue(image.alt_el, image.alt_en, title) }] : [];
      });
      const cover = row.cover_path ? signedByPath.get(row.cover_path) || null : images[0]?.src || null;
      const coverRecord = imageRows.find((image) => image.storage_path === row.cover_path || image.cover_storage_path === row.cover_path) || imageRows[0];
      return {
        slug: row.slug,
        category: row.category,
        year: row.year,
        location: bilingualValue(row.location_el, row.location_en),
        title,
        description,
        cover,
        coverAlt: coverRecord ? bilingualValue(coverRecord.alt_el, coverRecord.alt_en, title) : title,
        images,
        featured: row.featured,
        updatedAt: row.updated_at,
      };
    });
  } catch {
    return [];
  }
}

export async function getProject(slug: string) {
  return (await getPublishedProjects()).find((project) => project.slug === slug) || null;
}
