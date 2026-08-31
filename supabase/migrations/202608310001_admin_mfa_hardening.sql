-- Require both explicit admin membership and an AAL2 (MFA-verified) session.
-- public.is_admin() remains the single membership check used by the application.
create or replace function public.is_admin_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin()
    and coalesce((select auth.jwt() ->> 'aal'), 'aal1') = 'aal2';
$$;

revoke all on function public.is_admin_mfa() from public;
grant execute on function public.is_admin_mfa() to anon, authenticated;

alter policy "published projects are public" on public.projects
  using (status = 'published' or public.is_admin_mfa());
alter policy "admins create projects" on public.projects
  with check (public.is_admin_mfa());
alter policy "admins update projects" on public.projects
  using (public.is_admin_mfa()) with check (public.is_admin_mfa());
alter policy "admins delete projects" on public.projects
  using (public.is_admin_mfa());

alter policy "published project images are public" on public.project_images
  using (exists (
    select 1 from public.projects p
    where p.id = project_id and (p.status = 'published' or public.is_admin_mfa())
  ));
alter policy "admins create project images" on public.project_images
  with check (public.is_admin_mfa());
alter policy "admins update project images" on public.project_images
  using (public.is_admin_mfa()) with check (public.is_admin_mfa());
alter policy "admins delete project images" on public.project_images
  using (public.is_admin_mfa());

alter policy "admins read appointment requests" on public.appointment_requests
  using (public.is_admin_mfa());
alter policy "admins update appointment requests" on public.appointment_requests
  using (public.is_admin_mfa()) with check (public.is_admin_mfa());

alter policy "published project files are readable" on storage.objects
  using (
    bucket_id = 'project-images' and exists (
      select 1 from public.project_images pi
      join public.projects p on p.id = pi.project_id
      where pi.storage_path = name and (p.status = 'published' or public.is_admin_mfa())
    )
  );
alter policy "admins upload project files" on storage.objects
  with check (bucket_id = 'project-images' and public.is_admin_mfa());
alter policy "admins update project files" on storage.objects
  using (bucket_id = 'project-images' and public.is_admin_mfa())
  with check (bucket_id = 'project-images' and public.is_admin_mfa());
alter policy "admins delete project files" on storage.objects
  using (bucket_id = 'project-images' and public.is_admin_mfa());
