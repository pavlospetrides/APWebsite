import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('public compliance controls', () => {
  it('does not require consent to submit a requested appointment enquiry', async () => {
    const [form, route] = await Promise.all([
      read('components/appointment-form.tsx'),
      read('app/api/appointments/route.ts'),
    ]);

    expect(form).not.toMatch(/type=["']checkbox["'][^>]*name=["']consent/);
    expect(route).not.toMatch(/consent:\s*z\.literal\(true\)/);
    expect(form).toContain(`href={\`/${'${locale}'}/privacy\`}`);
    expect(form).toContain('does not confirm an appointment');
  });

  it('has all bilingual legal routes and sitemap entries', async () => {
    const [sitemap, footer] = await Promise.all([
      read('app/sitemap.ts'),
      read('components/site-footer.tsx'),
    ]);

    for (const kind of ['privacy', 'cookies', 'legal', 'terms']) {
      await expect(read(`app/[locale]/${kind}/page.tsx`)).resolves.toContain(`kind="${kind}"`);
      expect(sitemap).toContain(`/${kind}`);
      expect(footer).toContain(`/${'${locale}'}/${kind}`);
    }
    expect(footer).not.toContain('Cookie Settings');
    expect(footer).toContain('Σχεδιασμός & ανάπτυξη ιστοσελίδας από');
    expect(footer).toContain('Website design & development by');
    expect(footer).toContain('href="https://cpuclinic.eu" target="_blank" rel="noopener noreferrer"');
    expect(footer.match(/CPU Clinic/g)).toHaveLength(1);
  });

  it('contains no application browser-storage writes', async () => {
    const paths = [
      'components/site-header.tsx',
      'components/appointment-form.tsx',
      'components/ui/sidebar.tsx',
      'app/api/appointments/route.ts',
    ];
    const source = (await Promise.all(paths.map(read))).join('\n');
    expect(source).not.toMatch(/document\.cookie\s*=|localStorage\.(?:setItem|removeItem|clear)|sessionStorage\.(?:setItem|removeItem|clear)|indexedDB\.open/);
  });

  it('keeps internal compliance work out of the public legal runtime', async () => {
    const [config, legalPage, checklist, envExample] = await Promise.all([
      read('config/legal.ts'),
      read('components/legal-page.tsx'),
      read('LEGAL-COMPLIANCE-CHECKLIST.md'),
      read('.env.example'),
    ]);

    const publicRuntime = `${config}\n${legalPage}`;
    expect(publicRuntime).not.toMatch(/REQUIRED BEFORE PUBLIC LAUNCH|\bTODO\b|owner must|must be confirmed|public launch remains blocked|repository remains|Vercel compatibility|Supabase (?:project )?region|DPA verification|full geographic establishment address remains|εκκρεμεί|ο ιδιοκτήτης πρέπει/i);
    expect(legalPage).not.toContain('MissingFacts');
    expect(config).not.toContain('requiredBeforeLaunch');
    expect(config).not.toContain('productionDeploymentVerified');

    expect(config).toContain(`establishmentLocalityEn: 'Kato Polemidia, Limassol, Cyprus'`);
    expect(config).toContain(`professionalTitleEn: 'Electrical Installations Contractor'`);
    expect(config).toContain(`competentAuthorityDepartmentEn: 'Department of Electrical and Mechanical Services (EMS)'`);
    expect(config).toContain(`privacyContactEmail: 'pavlospetrides741@gmail.com'`);
    expect(config).toContain(`applicationHost: 'Vercel'`);
    expect(config).toContain(`productionDomain: process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'https://apetrides.com'`);
    expect(publicRuntime).not.toMatch(/ΦΠΑ|\bVAT\b|VAT number|VAT status|VAT registered|not VAT registered/i);

    expect(checklist).toMatch(/Publication status:\s*\*\*BLOCKED/i);
    expect(checklist).toMatch(/full geographic address/i);
    expect(checklist).toMatch(/licen[cs]e|register identifier/i);
    expect(checklist).toMatch(/retention/i);
    expect(checklist).toMatch(/Vercel/);
    expect(checklist).toMatch(/Supabase/);
    expect(checklist).toMatch(/\bVAT\b/);
    expect(envExample).not.toContain('NEXT_PUBLIC_ELECTRICIAN_LICENCE_NUMBER');
    expect(envExample).not.toMatch(/ΦΠΑ|\bVAT\b|NEXT_PUBLIC_VAT_NUMBER/i);
  });

  it('targets Vercel through Vinext and Nitro without Cloudflare deployment coupling', async () => {
    const [packageText, vite, tsconfig, envExample, gitignore] = await Promise.all([
      read('package.json'),
      read('vite.config.ts'),
      read('tsconfig.json'),
      read('.env.example'),
      read('.gitignore'),
    ]);
    const packageJson = JSON.parse(packageText) as {
      scripts: Record<string, string>;
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    const installed = { ...packageJson.dependencies, ...packageJson.devDependencies };

    expect(packageJson.scripts.build).toBe('vite build');
    expect(packageText.match(/"build"\s*:/g)).toHaveLength(1);
    expect(packageJson.scripts.start).toBe('vite preview');
    expect(vite).toContain(`from '@tailwindcss/vite'`);
    expect(vite).toContain(`preset: 'vercel'`);
    expect(vite).toContain('inlineDynamicImports: true');
    expect(vite).toContain(`runtime: 'nodejs22.x'`);
    expect(vite.indexOf('tailwindcss()')).toBeLessThan(vite.indexOf('vinext()'));
    expect(vite.indexOf('vinext()')).toBeLessThan(vite.indexOf('nitro({'));
    expect(vite).not.toMatch(/@tailwindcss\/postcss|@cloudflare|@openai\/sites/);
    expect(installed).not.toHaveProperty('@tailwindcss/postcss');
    expect(installed).not.toHaveProperty('@cloudflare/vite-plugin');
    expect(installed).not.toHaveProperty('@cloudflare/workers-types');
    expect(installed).not.toHaveProperty('@openai/sites-vite-plugin');
    expect(installed).not.toHaveProperty('wrangler');
    expect(tsconfig).not.toContain('@cloudflare/workers-types');
    expect(envExample).not.toMatch(/NEXT_PUBLIC_LEGAL_ADDRESS|NEXT_PUBLIC_ELECTRICIAN_CERTIFICATE_TYPE|NEXT_PUBLIC_PROFESSIONAL_RULES_URL/);
    expect(gitignore).toContain('.env*');
    expect(gitignore).toContain('!.env.example');
    expect(gitignore).toContain('/.output/');
    await expect(read('.openai/hosting.json')).rejects.toThrow();
  });
});
