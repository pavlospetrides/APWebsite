import { createClient } from '@supabase/supabase-js';
import { exampleProjects, type ProjectSeed } from './projects.seed';

type DbImage = { storage_path: string; alt_el: string; alt_en: string; sort_order: number };
type DbProject = { slug: string; title_el: string; title_en: string; description_el: string; description_en: string; category: ProjectSeed['category']; year: number | null; location_el: string | null; location_en: string | null; cover_path: string | null; featured: boolean; status: 'published' | 'draft'; project_images: DbImage[] | null };

export async function getPublishedProjects(): Promise<ProjectSeed[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL; const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return exampleProjects;
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase.from('projects').select('slug,title_el,title_en,description_el,description_en,category,year,location_el,location_en,cover_path,featured,status,project_images(storage_path,alt_el,alt_en,sort_order)').eq('status', 'published').order('created_at', { ascending: false });
    if (error || !data?.length) return exampleProjects;
    return await Promise.all((data as unknown as DbProject[]).map(async row => {
      const imageRows = [...(row.project_images || [])].sort((a,b) => a.sort_order - b.sort_order);
      const paths = imageRows.map(image => image.storage_path);
      if (row.cover_path && !paths.includes(row.cover_path)) paths.unshift(row.cover_path);
      const signed = await Promise.all(paths.map(async path => (await supabase.storage.from('project-images').createSignedUrl(path, 3600)).data?.signedUrl || ''));
      const images = signed.filter(Boolean); const cover = images[0] || '/images/finished-lighting.webp';
      const first = imageRows[0];
      return { slug: row.slug, category: row.category, year: row.year || new Date().getFullYear(), location: { el: row.location_el || '', en: row.location_en || '' }, title: { el: row.title_el, en: row.title_en }, description: { el: row.description_el, en: row.description_en }, cover, images: images.length ? images : [cover], alt: { el: first?.alt_el || row.title_el, en: first?.alt_en || row.title_en }, featured: row.featured };
    }));
  } catch { return exampleProjects; }
}

export async function getProject(slug: string) { return (await getPublishedProjects()).find(project => project.slug === slug) || null; }
