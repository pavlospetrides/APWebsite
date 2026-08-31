import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

describe('shared service workflow responsiveness', () => {
  it('uses one semantic shared workflow for every localized service page', async () => {
    const [component, renovations, builds, repairs] = await Promise.all([
      read('components/service-page.tsx'),
      read('app/[locale]/renovations/page.tsx'),
      read('app/[locale]/new-builds/page.tsx'),
      read('app/[locale]/repairs/page.tsx'),
    ]);

    expect(component).toContain('<section className="section workflow">');
    expect(component).toContain('<ol>');
    expect(component).toContain('<li key={step}>');
    for (const route of [renovations, builds, repairs]) {
      expect(route).toContain('<ServicePage');
      expect(route).toContain('const content: Record<Locale, ServicePageContent>');
      expect(route).toContain('el: {');
      expect(route).toContain('en: {');
    }
  });

  it('preserves the desktop four-column workflow', async () => {
    const css = await read('app/globals.css');
    expect(css).toContain('.workflow ol { margin:50px 0 0; padding:0; list-style:none; display:grid; grid-template-columns:repeat(4,1fr);');
  });

  it('uses a two-column tablet workflow and a content-height mobile stack', async () => {
    const css = await read('app/globals.css');
    expect(css).toContain('@media (max-width: 900px) { .workflow ol { grid-template-columns:repeat(2,minmax(0,1fr)); }');
    expect(css).toContain('@media (max-width: 600px) { .workflow { width:calc(100% - 32px); padding-top:0; }');
    expect(css).toContain('.workflow li,.workflow li:not(:first-child) { min-height:0; height:auto; padding:24px 0 20px;');
    expect(css).toContain('.workflow li p { margin:14px 0 0; }');
  });

  it('also removes the same inherited minimum-height pattern from the stacked homepage process', async () => {
    const css = await read('app/globals.css');
    expect(css).toContain('.process-grid article,.process-grid article:not(:first-child) { min-height:0; height:auto; padding:28px 0;');
  });
});

