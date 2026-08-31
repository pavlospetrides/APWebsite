import { describe, expect, it } from 'vitest';
import { imageAltSchema, makeProjectSlug, projectFormSchema } from '../lib/project-validation';

const valid = {
  slug: 'sample-project', title_el: 'Ελληνικός τίτλος', title_en: '',
  description_el: 'Μία πλήρης ελληνική περιγραφή έργου.', description_en: '',
  category: 'renovation', year: '', location_el: '', location_en: '',
  featured: false, status: 'draft' as const,
};

describe('project bilingual validation', () => {
  it.each([
    ['Greek title only', { title_el: 'Ελληνικός τίτλος', title_en: '' }],
    ['English title only', { title_el: '', title_en: 'English title' }],
    ['both titles', { title_el: 'Ελληνικός τίτλος', title_en: 'English title' }],
  ])('accepts %s', (_, titles) => expect(projectFormSchema.safeParse({ ...valid, ...titles }).success).toBe(true));

  it('rejects no title and marks both fields', () => {
    const result = projectFormSchema.safeParse({ ...valid, title_el: '', title_en: '' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path[0])).toEqual(expect.arrayContaining(['title_el', 'title_en']));
  });

  it.each([
    ['Greek description only', { description_el: 'Πλήρης ελληνική περιγραφή.', description_en: '' }],
    ['English description only', { description_el: '', description_en: 'A complete English description.' }],
    ['both descriptions', { description_el: 'Πλήρης ελληνική περιγραφή.', description_en: 'A complete English description.' }],
  ])('accepts %s', (_, descriptions) => expect(projectFormSchema.safeParse({ ...valid, ...descriptions }).success).toBe(true));

  it('rejects no description', () => expect(projectFormSchema.safeParse({ ...valid, description_el: '', description_en: '' }).success).toBe(false));
  it('rejects a present but too-short description', () => expect(projectFormSchema.safeParse({ ...valid, description_el: 'μικρή', description_en: '' }).success).toBe(false));
  it('rejects invalid slugs and years', () => {
    expect(projectFormSchema.safeParse({ ...valid, slug: 'Bad slug!' }).success).toBe(false);
    expect(projectFormSchema.safeParse({ ...valid, year: '1999' }).success).toBe(false);
  });
  it('transliterates a Greek-only title into a technical slug', () => expect(makeProjectSlug('Νέα Ηλεκτρική Εγκατάσταση')).toBe('nea-ilektriki-egkatastasi'));
});

describe('image alt validation', () => {
  it.each([{ alt_el: 'Ηλεκτρικός πίνακας', alt_en: '' }, { alt_el: '', alt_en: 'Electrical panel' }, { alt_el: 'Πίνακας', alt_en: 'Panel' }])('accepts at least one meaningful language', (value) => expect(imageAltSchema.safeParse(value).success).toBe(true));
  it('rejects two empty values', () => expect(imageAltSchema.safeParse({ alt_el: '', alt_en: '' }).success).toBe(false));
});
