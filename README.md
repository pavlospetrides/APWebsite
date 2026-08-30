# AP Electrical Services

Production-ready bilingual website and lightweight CMS for a residential electrician. The application uses the Next.js App Router programming model through Vinext, React 19, TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL/Storage and Lucide icons. Greek (`/el`) is the default language and English is available at `/en`.

## Included

- Greek and English home, renovations, new-builds, repairs, projects, project-detail and contact pages
- Responsive keyboard-accessible navigation, language switching and mobile call action
- Appointment form with server-side Zod validation, honeypot, rate limiting and consent
- Supabase-backed admin login, project CRUD, draft/publish state, featured projects, bilingual content/alt text, multi-image upload, upload ordering and appointment status management
- PostgreSQL schema, indexes, Row Level Security and private Storage policies
- Per-page metadata, canonical and `hreflang` links, Open Graph/X card, sitemap, robots rules, 404 and error boundary
- Four original local example images generated for this project plus a branded social-preview image

The bundled project records and generated images are examples. The public site labels them as example services and does not claim they are completed work by Antis Petridis. Seed content is isolated in `lib/projects.seed.ts`.

## Local setup

Requirements: Node.js 22.13 or later and npm.

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and replace every placeholder.
3. Start development with `npm run dev`.
4. Open `http://localhost:3000`. The root redirects to Greek at `/el`.

Without Supabase variables, all public pages work with the removable seed data. The contact form runs validation in preview mode but does not persist requests, and `/admin` shows setup instructions.

## Business details to replace

All mutable business values are centralized in `config/site.ts` and read from environment variables:

- `[BUSINESS_NAME]` via `NEXT_PUBLIC_BUSINESS_NAME`
- `[PHONE_NUMBER]` via `NEXT_PUBLIC_PHONE_NUMBER`
- `[EMAIL_ADDRESS]` via `NEXT_PUBLIC_EMAIL_ADDRESS`
- `[SERVICE_AREA]` via `NEXT_PUBLIC_SERVICE_AREA`
- `[WHATSAPP_NUMBER]` via `NEXT_PUBLIC_WHATSAPP_NUMBER`; no WhatsApp link appears while this remains a placeholder
- `NEXT_PUBLIC_SITE_URL` must be the final HTTPS origin for canonical, sitemap and social metadata

Do not publish publicly until the visible placeholders have been replaced. No address, opening hours, reviews, prices, certifications or 24-hour promise have been invented.

## Supabase setup

1. Create a Supabase project.
2. In the SQL Editor, run `supabase/migrations/202608300001_initial_schema.sql`. This creates `projects`, `project_images`, `appointment_requests`, `admin_users`, indexes, RLS policies and the private `project-images` bucket.
3. Copy Project URL and anon key into `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Keep the service-role key in the server-only `SUPABASE_SERVICE_ROLE_KEY` variable if it is needed for future maintenance tooling. The current application does not read or use it. Never expose it or prefix it with `NEXT_PUBLIC_`.
5. Restart the local server after changing environment variables.

The appointment endpoint, public project reads and signed-image requests use the publishable/anon key and are constrained by RLS. Ordinary admin operations use the authenticated admin session and RLS. The application never uses the service-role key.

## Create the first admin

1. In Supabase Dashboard, go to Authentication → Users and create the owner with email and password.
2. Run this once in the SQL Editor, replacing the placeholder with the same email address:

   ```sql
   insert into public.admin_users (user_id)
   select id
   from auth.users
   where email = 'ADMIN_EMAIL_HERE'
   on conflict (user_id) do nothing;
   ```

Only authenticated users present in `admin_users` pass the admin RLS checks. The `/admin` route is not linked from the public navigation and is marked `noindex`.

## Add a project and photos

1. Open `/admin` and sign in with the Supabase admin email/password.
2. Choose **Νέο έργο**.
3. Fill in Greek and English title/description, category, year, optional general location and bilingual alt text.
4. Select one or more JPG, PNG, WebP or AVIF images up to 8 MB each. The first image becomes the cover; use the arrow buttons to change the upload order before saving.
5. Choose **Πρόχειρο** for a draft or **Δημοσιευμένο** to make it publicly readable, optionally mark it as featured, then save.
6. Use the project row actions to preview, edit or delete. Deletion asks for confirmation and removes the corresponding Storage objects.

Appointment requests appear in the second admin section and can be marked new, contacted or completed.

## Replace example images

Generated starter images are in `public/images`. After Supabase is connected, upload real project photographs from `/admin`; published database projects replace the seed portfolio automatically. Remove the seed entries from `lib/projects.seed.ts` when no longer needed. Keep accurate bilingual alt text and obtain permission for every published photograph.

## Validation

Run `npm run lint`, `npm run typecheck`, `npm run build`, keep `npm run dev` running, then run `npm run test:smoke`.

The smoke test checks the core Greek/English routes, project detail, contact, admin setup, sitemap, robots and invalid appointment rejection. `TEST_BASE_URL` can point it at another running environment.

## Deployment

The build emits Cloudflare Worker-compatible output in `dist` through Vinext and the Sites Vite plugin. Configure the same environment variables as deployment secrets/values, set `NEXT_PUBLIC_SITE_URL` to the final origin, run `npm run build`, then deploy the generated Sites version. Supabase remains the durable PostgreSQL/Auth/Storage backend over HTTPS.

For another platform, keep the App Router route structure and confirm its support for the Vinext/Cloudflare output, or migrate the route files to a standard current Next.js deployment without changing the Supabase schema.
