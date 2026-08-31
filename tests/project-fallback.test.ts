import { describe, expect, it } from 'vitest';
import { bilingualValue } from '../lib/project-types';

describe('central bilingual fallback', () => {
  it('uses English content on Greek pages when Greek is missing', () => {
    expect(bilingualValue(null, 'English title')).toEqual({ el: 'English title', en: 'English title' });
  });
  it('uses Greek content on English pages when English is missing', () => {
    expect(bilingualValue('Ελληνικός τίτλος', '')).toEqual({ el: 'Ελληνικός τίτλος', en: 'Ελληνικός τίτλος' });
  });
  it('trims both values and keeps the requested translation when present', () => {
    expect(bilingualValue(' Ελληνικά ', ' English ')).toEqual({ el: 'Ελληνικά', en: 'English' });
  });
  it('provides a field-specific final fallback for defensive rendering', () => {
    expect(bilingualValue(null, null, { el: 'Έργο', en: 'Project' })).toEqual({ el: 'Έργο', en: 'Project' });
  });
});
