# AP Electrical Services

Bilingual public website and private administration system built with the Next.js App Router model through Vinext, React, TypeScript and Supabase Auth/PostgreSQL/Storage.

## Security model

- `/admin` never renders a login or access-denied screen. Anonymous, AAL1 and non-admin requests receive the normal 404 page.
- The private login URL is configured once through the server-only `PRIVATE_ADMIN_LOGIN_PATH` environment variable. Use a long two-segment path, do not link it, and do not publish its value.
- A hidden route is only an extra layer. Authorization requires a valid Supabase session, TOTP MFA at `aal2`, and a matching row in `public.admin_users`.
- Admin database and Storage operations use the logged-in user's session and remain subject to RLS. The application does not use the service-role key during normal operation.
- Private responses use `noindex`, `nofollow`, `noarchive`, `no-store`, `DENY` framing and a no-referrer policy.
- There is no signup, registration, create-account or public invitation flow in the application.

## Local setup

1. Install Node.js 22.13 or later and run `npm install`.
2. Copy `.env.example` to `.env.local` and replace every placeholder.
3. Set `PRIVATE_ADMIN_LOGIN_PATH` to a long private two-segment route beginning with `/`.
4. Run `npm run dev` and open `http://localhost:3000`.

The private route value is intentionally server-only. Do not prefix it with `NEXT_PUBLIC_`.

## Required Supabase production configuration

Apply these migrations in order using the Supabase SQL Editor:

1. `supabase/migrations/202608300001_initial_schema.sql`
2. `supabase/migrations/202608310001_admin_mfa_hardening.sql`
3. `supabase/migrations/202608310002_bilingual_content_and_image_variants.sql`

The first creates `projects`, `project_images`, `appointment_requests`, `admin_users`, `public.is_admin()`, indexes, RLS policies and the private `project-images` bucket. The second preserves `public.is_admin()` as the membership check and adds `public.is_admin_mfa()`, requiring both membership and an `aal2` JWT for all administrative reads and writes. The third safely relaxes individual EL/EN columns while enforcing that every title, description and image alt pair contains at least one valid language. It also adds `cover_storage_path` and extends the existing private Storage read policy to the optimized cover derivative without weakening MFA.

Manually disable public registration:

**Supabase Dashboard → Authentication → Providers → Email → “Allow new users to sign up” = OFF**

The label can appear under Authentication configuration depending on the Dashboard version. This manual setting is mandatory even though the application contains no signup UI.

TOTP MFA is implemented in the private login flow. Supabase TOTP MFA is normally enabled by default; confirm under **Authentication → Multi-Factor Authentication** that TOTP enrollment, challenge and verification are allowed. The first authorized login enrolls an authenticator, and subsequent logins require its six-digit code.

## Create an administrator

1. In **Supabase Dashboard → Authentication → Users**, manually create the user with email and password.
2. Add that existing Auth user to the application allowlist:

   ```sql
   insert into public.admin_users (user_id)
   select id
   from auth.users
   where email = 'OWNER_EMAIL_HERE'
   on conflict (user_id) do nothing;
   ```

Authentication alone is insufficient. Removing the row from `public.admin_users` revokes administrative access even if the Auth user still exists.

## Portfolio source of truth

Supabase is the only portfolio source used by the public website, project detail routes, sitemap and admin dashboard. Draft projects remain visible to an MFA-verified administrator and are excluded from all public reads by RLS. Unpublishing or deleting a project therefore changes the public portfolio without a second hardcoded list.

The repository audit found four generated example records in the former `lib/projects.seed.ts`; they explicitly described themselves as examples rather than completed AP Electrical Services work. They were removed from the portfolio data path and were not migrated as real projects. No real project records or project photos were present elsewhere in the repository, and the connected Supabase project currently contains zero projects.

Real projects can be entered through the private CMS. For a batch import, place reviewed records in `data/projects.json` and run:

```bash
npm run import:projects -- --dry-run
npm run import:projects
```

The importer applies the same “at least one language” rules, upserts projects by unique slug and upserts image records by Storage path. It normalizes EXIF orientation, caps gallery images at a 2,000 px long edge, creates an 8:5 cover crop, strips source metadata and uploads only quality-84 WebP derivatives. It is idempotent and does not delete projects or stale files. The manifest is deliberately empty until real project information is supplied; do not replace missing fields with invented content.

## Project editor image pipeline

- File content is checked by binary signature and successful browser decoding, not filename alone.
- Sources up to 25 MB and 60 megapixels are decoded lazily, with at most two files processing concurrently.
- `createImageBitmap(..., { imageOrientation: 'from-image' })` normalizes EXIF orientation before canvas resizing. Canvas re-encoding strips camera metadata.
- Gallery images preserve composition and are capped at a 2,000 px long edge. Cover derivatives use a centered 8:5 crop up to 1,600×1,000 without stretching or upscaling small images.
- Both outputs use WebP quality 0.84. The original camera file is never uploaded.
- HEIC/HEIF is accepted only when the current browser can actually decode it (Safari 17+ can). Other browsers show a per-file Greek explanation and retain the rest of the form.
- Pending object URLs are revoked when replaced, removed, saved or discarded.

## Secrets

- `.env.local` and every `.env*` file except `.env.example` are gitignored.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are public client configuration and are constrained by RLS.
- `PRIVATE_ADMIN_LOGIN_PATH` is the only server-only variable required by the hosted application.
- `SUPABASE_SERVICE_ROLE_KEY` is read only by the owner-run batch import and local security-test scripts. Do not configure it in Vercel. Never prefix it with `NEXT_PUBLIC_`, log it, or use it in browser code.
- Configure all environment values separately in production. Do not commit `.env.local`.

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run test:unit
npm run test:image
npm run dev
npm run test:smoke
```

The unit suite covers bilingual validation/fallback, alt pairs, slug/year failures, content signatures, resize/crop geometry, legal routes, form transparency and browser-storage controls. The image benchmark generates PNG/JPEG/WebP/AVIF, large phone, rotated EXIF and parallel fixtures, then records derivative dimensions and approximate compression. With local Supabase configuration, the smoke suite creates temporary records/users and cleans them in `finally`: it verifies a valid anonymous appointment submission, denied anonymous read/update, denied non-admin and AAL1-admin read, and successful AAL2/MFA admin read, in addition to public/legal routes and private-route protections.

## Legal release gate

The bilingual privacy, cookie/storage, provider-information and enquiry-terms pages are implemented, but public release is intentionally blocked because legally relevant owner facts and production-provider settings remain unverified. Complete [LEGAL-COMPLIANCE-CHECKLIST.md](LEGAL-COMPLIANCE-CHECKLIST.md) and update the centralized public facts in `config/legal.ts` before publication. Do not add a cookie banner unless a fresh production scan finds non-essential storage; the current reachable application uses none.

## Deployment

The production build uses Vinext, Vite and Nitro's explicit `vercel` preset. `npm run build` generates the Vercel Build Output API structure in `.vercel/output`, including the server function and static assets. Cloudflare Workers, Wrangler, OpenAI Sites, D1 and R2 are not application dependencies; Supabase provides database, storage and authentication.

In Vercel use the **Other** framework preset, repository root as the root directory, `npm install` as the install command, `npm run build` as the build command, and Node.js 22.x. Do not override the output directory: Nitro writes the required `.vercel/output` structure directly.

Deployment remains prohibited until the legal release gate is complete. Before connecting `apetrides.com`, configure the production variables, apply all three Supabase migrations, disable public signup, verify every dynamic/auth/API route on Vercel, and run the final-domain cookie/storage and mobile checks. Migration `202608310002_bilingual_content_and_image_variants.sql` must be live because public project queries expect `project_images.cover_storage_path`.
