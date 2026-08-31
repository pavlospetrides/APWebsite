-- Allow one complete translation while keeping project content non-empty.
-- This is forward-only and preserves all existing records and security policies.

alter table public.projects
  alter column title_el drop not null,
  alter column title_en drop not null,
  alter column description_el drop not null,
  alter column description_en drop not null;

alter table public.projects
  drop constraint if exists projects_title_el_check,
  drop constraint if exists projects_title_en_check,
  drop constraint if exists projects_description_el_check,
  drop constraint if exists projects_description_en_check;

alter table public.projects
  add constraint projects_slug_length_check check (char_length(slug) <= 180) not valid,
  add constraint projects_title_el_length_check check (
    title_el is null or btrim(title_el) = '' or char_length(btrim(title_el)) between 2 and 160
  ),
  add constraint projects_title_en_length_check check (
    title_en is null or btrim(title_en) = '' or char_length(btrim(title_en)) between 2 and 160
  ),
  add constraint projects_title_translation_check check (
    coalesce(nullif(btrim(title_el), ''), nullif(btrim(title_en), '')) is not null
  ),
  add constraint projects_description_el_length_check check (
    description_el is null or btrim(description_el) = '' or char_length(btrim(description_el)) between 10 and 3000
  ),
  add constraint projects_description_en_length_check check (
    description_en is null or btrim(description_en) = '' or char_length(btrim(description_en)) between 10 and 3000
  ),
  add constraint projects_description_translation_check check (
    coalesce(nullif(btrim(description_el), ''), nullif(btrim(description_en), '')) is not null
  ),
  add constraint projects_location_el_length_check check (
    location_el is null or btrim(location_el) = '' or char_length(btrim(location_el)) between 2 and 160
  ) not valid,
  add constraint projects_location_en_length_check check (
    location_en is null or btrim(location_en) = '' or char_length(btrim(location_en)) between 2 and 160
  ) not valid;

alter table public.project_images
  alter column alt_el drop not null,
  alter column alt_en drop not null,
  add column if not exists cover_storage_path text;

alter table public.project_images
  drop constraint if exists project_images_alt_el_check,
  drop constraint if exists project_images_alt_en_check;

alter table public.project_images
  add constraint project_images_alt_el_length_check check (
    alt_el is null or btrim(alt_el) = '' or char_length(btrim(alt_el)) between 2 and 300
  ),
  add constraint project_images_alt_en_length_check check (
    alt_en is null or btrim(alt_en) = '' or char_length(btrim(alt_en)) between 2 and 300
  ),
  add constraint project_images_alt_translation_check check (
    coalesce(nullif(btrim(alt_el), ''), nullif(btrim(alt_en), '')) is not null
  );

create unique index if not exists project_images_cover_storage_path_idx
  on public.project_images (cover_storage_path)
  where cover_storage_path is not null;

comment on column public.project_images.storage_path is
  'Optimized composition-preserving gallery image.';
comment on column public.project_images.cover_storage_path is
  'Optimized 8:5 center-cropped project-card/hero derivative.';

-- Existing rows still use storage_path as their cover. New rows may use the
-- derivative path. Private Storage remains readable only through a published
-- image record or an AAL2 admin session.
alter policy "published project files are readable" on storage.objects
  using (
    bucket_id = 'project-images' and exists (
      select 1 from public.project_images pi
      join public.projects p on p.id = pi.project_id
      where (pi.storage_path = name or pi.cover_storage_path = name)
        and (p.status = 'published' or public.is_admin_mfa())
    )
  );
