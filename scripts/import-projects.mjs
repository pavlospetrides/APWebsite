import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const root = process.cwd();
const manifestPath = path.resolve(root, process.argv.find((value) => value.endsWith('.json')) || 'data/projects.json');
const dryRun = process.argv.includes('--dry-run');
const allowedCategories = new Set(['renovation', 'new-build', 'repair', 'lighting']);
const allowedStatuses = new Set(['draft', 'published']);
const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic', '.heif']);

function requiredText(value, field, minimum = 2) {
  if (typeof value !== 'string' || value.trim().length < minimum) throw new Error(`${field} is required`);
  return value.trim();
}

function optionalText(value, field, minimum, maximum) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.trim().length < minimum || value.trim().length > maximum) throw new Error(`${field} must contain ${minimum}-${maximum} characters when present`);
  return value.trim();
}

function bilingual(el, en, field, minimum, maximum) {
  const values = [optionalText(el, `${field}_el`, minimum, maximum), optionalText(en, `${field}_en`, minimum, maximum)];
  if (!values[0] && !values[1]) throw new Error(`${field} requires at least one language`);
  return values;
}

async function readEnvironment() {
  const text = await fs.readFile(path.join(root, '.env.local'), 'utf8').catch(() => '');
  return Object.fromEntries(text.split(/\r?\n/).filter((line) => line && !line.trim().startsWith('#') && line.includes('=')).map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
  }));
}

function validateProject(project, index) {
  const slug = requiredText(project.slug, `projects[${index}].slug`);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`${slug}: invalid slug`);
  if (slug.length > 180) throw new Error(`${slug}: slug exceeds 180 characters`);
  if (!allowedCategories.has(project.category)) throw new Error(`${slug}: invalid category`);
  const status = project.status || 'draft';
  if (!allowedStatuses.has(status)) throw new Error(`${slug}: invalid status`);
  const images = Array.isArray(project.images) ? project.images.map((image, imageIndex) => {
    const [alt_el, alt_en] = bilingual(image.alt_el, image.alt_en, `${slug}.images[${imageIndex}].alt`, 2, 300);
    return {
      source: requiredText(image.source, `${slug}.images[${imageIndex}].source`), alt_el, alt_en,
      sort_order: Number.isInteger(image.sort_order) && image.sort_order >= 0 ? image.sort_order : imageIndex,
      cover: image.cover === true,
    };
  }) : [];
  const [title_el, title_en] = bilingual(project.title_el, project.title_en, `${slug}.title`, 2, 160);
  const [description_el, description_en] = bilingual(project.description_el, project.description_en, `${slug}.description`, 10, 3000);
  return {
    slug,
    title_el, title_en, description_el, description_en,
    category: project.category,
    year: Number.isInteger(project.year) ? project.year : null,
    location_el: optionalText(project.location_el, `${slug}.location_el`, 2, 160),
    location_en: optionalText(project.location_en, `${slug}.location_en`, 2, 160),
    featured: project.featured === true,
    status,
    images,
  };
}

const raw = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (!Array.isArray(raw)) throw new Error('The project manifest must contain a JSON array.');
const projects = raw.map(validateProject);
if (dryRun) {
  console.log(`Validated ${projects.length} project record(s); no database or Storage changes made.`);
  process.exit(0);
}

const env = await readEnvironment();
if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase server credentials are not configured.');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

for (const project of projects) {
  const { images, ...record } = project;
  const saved = await supabase.from('projects').upsert({ ...record, cover_path: null }, { onConflict: 'slug' }).select('id').single();
  if (saved.error || !saved.data) throw new Error(`${project.slug}: ${saved.error?.message || 'project upsert failed'}`);

  const uploaded = [];
  for (const image of images) {
    const source = path.resolve(root, image.source);
    if (!source.startsWith(`${root}${path.sep}`)) throw new Error(`${project.slug}: image path is outside the repository`);
    const extension = path.extname(source).toLowerCase();
    if (!supportedExtensions.has(extension)) throw new Error(`${project.slug}: unsupported image type ${extension}`);
    const bytes = await fs.readFile(source);
    if (bytes.length > 25 * 1024 * 1024) throw new Error(`${project.slug}: ${image.source} exceeds the 25 MB source limit`);
    const metadata = await sharp(bytes, { limitInputPixels: 60_000_000 }).metadata().catch(() => null);
    if (!metadata?.width || !metadata.height) throw new Error(`${project.slug}: ${image.source} is not a decodable image`);
    const rotated = metadata.orientation && metadata.orientation >= 5 && metadata.orientation <= 8;
    const normalizedWidth = rotated ? metadata.height : metadata.width;
    const normalizedHeight = rotated ? metadata.width : metadata.height;
    const cropWidth = normalizedWidth / normalizedHeight > 1.6 ? normalizedHeight * 1.6 : normalizedWidth;
    const cropHeight = normalizedWidth / normalizedHeight > 1.6 ? normalizedHeight : normalizedWidth / 1.6;
    const coverScale = Math.min(1, 1600 / cropWidth, 1000 / cropHeight);
    const coverWidth = Math.round(cropWidth * coverScale);
    const coverHeight = Math.round(cropHeight * coverScale);
    const normalized = sharp(bytes, { limitInputPixels: 60_000_000 }).autoOrient();
    const [gallery, cover] = await Promise.all([
      normalized.clone().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toBuffer(),
      normalized.clone().resize(coverWidth, coverHeight, { fit: 'cover', position: 'centre' }).webp({ quality: 84 }).toBuffer(),
    ]);
    const baseName = path.basename(source, extension).toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    const storagePath = `projects/${project.slug}/${baseName}-gallery.webp`;
    const coverStoragePath = `projects/${project.slug}/${baseName}-cover.webp`;
    const [upload, coverUpload] = await Promise.all([
      supabase.storage.from('project-images').upload(storagePath, gallery, { contentType: 'image/webp', cacheControl: '31536000', upsert: true }),
      supabase.storage.from('project-images').upload(coverStoragePath, cover, { contentType: 'image/webp', cacheControl: '31536000', upsert: true }),
    ]);
    if (upload.error || coverUpload.error) throw new Error(`${project.slug}: optimized image upload failed`);
    const imageRecord = await supabase.from('project_images').upsert({ project_id: saved.data.id, storage_path: storagePath, cover_storage_path: coverStoragePath, alt_el: image.alt_el, alt_en: image.alt_en, sort_order: image.sort_order }, { onConflict: 'storage_path' });
    if (imageRecord.error) throw new Error(`${project.slug}: ${imageRecord.error.message}`);
    uploaded.push({ ...image, storagePath, coverStoragePath });
  }
  const selectedCover = uploaded.find((image) => image.cover) || uploaded[0];
  const coverPath = selectedCover?.coverStoragePath || selectedCover?.storagePath || null;
  const coverUpdate = await supabase.from('projects').update({ cover_path: coverPath }).eq('id', saved.data.id);
  if (coverUpdate.error) throw new Error(`${project.slug}: ${coverUpdate.error.message}`);
  console.log(`Upserted ${project.slug} with ${uploaded.length} image(s).`);
}

console.log(`Import complete: ${projects.length} project record(s).`);
