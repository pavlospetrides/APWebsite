create extension if not exists pgcrypto;

create type public.project_status as enum ('draft', 'published');
create type public.appointment_status as enum ('new', 'contacted', 'completed');

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title_el text not null check (char_length(title_el) between 2 and 160),
  title_en text not null check (char_length(title_en) between 2 and 160),
  description_el text not null check (char_length(description_el) between 10 and 3000),
  description_en text not null check (char_length(description_en) between 10 and 3000),
  category text not null check (category in ('renovation','new-build','repair','lighting')),
  year integer check (year between 2000 and 2100),
  location_el text,
  location_en text,
  cover_path text,
  featured boolean not null default false,
  status public.project_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null unique,
  alt_el text not null check (char_length(alt_el) between 2 and 300),
  alt_en text not null check (char_length(alt_en) between 2 and 300),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text not null check (char_length(phone) between 6 and 30),
  email text,
  work_type text not null check (work_type in ('renovation','new-build','repair','other')),
  area text not null check (char_length(area) between 2 and 120),
  preferred_date date,
  preferred_time time,
  message text not null check (char_length(message) between 10 and 1500),
  status public.appointment_status not null default 'new',
  created_at timestamptz not null default now()
);

create index projects_public_idx on public.projects (status, featured, created_at desc);
create index project_images_order_idx on public.project_images (project_id, sort_order);
create index appointment_status_idx on public.appointment_requests (status, created_at desc);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger projects_touch_updated_at before update on public.projects for each row execute function public.touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.appointment_requests enable row level security;

create policy "admins can read own membership" on public.admin_users for select to authenticated using (user_id = auth.uid());
create policy "published projects are public" on public.projects for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy "admins create projects" on public.projects for insert to authenticated with check (public.is_admin());
create policy "admins update projects" on public.projects for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete projects" on public.projects for delete to authenticated using (public.is_admin());
create policy "published project images are public" on public.project_images for select to anon, authenticated using (exists (select 1 from public.projects p where p.id = project_id and (p.status = 'published' or public.is_admin())));
create policy "admins create project images" on public.project_images for insert to authenticated with check (public.is_admin());
create policy "admins update project images" on public.project_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete project images" on public.project_images for delete to authenticated using (public.is_admin());
create policy "public creates appointment requests" on public.appointment_requests for insert to anon, authenticated with check (status = 'new');
create policy "admins read appointment requests" on public.appointment_requests for select to authenticated using (public.is_admin());
create policy "admins update appointment requests" on public.appointment_requests for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-images', 'project-images', false, 8388608, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "published project files are readable" on storage.objects for select to anon, authenticated using (
  bucket_id = 'project-images' and exists (
    select 1 from public.project_images pi join public.projects p on p.id = pi.project_id
    where pi.storage_path = name and (p.status = 'published' or public.is_admin())
  )
);
create policy "admins upload project files" on storage.objects for insert to authenticated with check (bucket_id = 'project-images' and public.is_admin());
create policy "admins update project files" on storage.objects for update to authenticated using (bucket_id = 'project-images' and public.is_admin()) with check (bucket_id = 'project-images' and public.is_admin());
create policy "admins delete project files" on storage.objects for delete to authenticated using (bucket_id = 'project-images' and public.is_admin());

grant execute on function public.is_admin() to anon, authenticated;
