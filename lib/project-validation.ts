import { z } from 'zod';
import type { ProjectStatus } from '@/types/database';

export const PROJECT_CATEGORIES = ['renovation', 'new-build', 'repair', 'lighting'] as const;
export const PROJECT_STATUSES = ['draft', 'published'] as const satisfies readonly ProjectStatus[];

export function makeProjectSlug(value: string) {
  const greek: Record<string, string> = { α:'a', β:'v', γ:'g', δ:'d', ε:'e', ζ:'z', η:'i', θ:'th', ι:'i', κ:'k', λ:'l', μ:'m', ν:'n', ξ:'x', ο:'o', π:'p', ρ:'r', σ:'s', ς:'s', τ:'t', υ:'y', φ:'f', χ:'ch', ψ:'ps', ω:'o' };
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[α-ω]/g, (letter) => greek[letter] || '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export type ProjectFormValues = {
  id?: string;
  slug: string;
  title_el: string;
  title_en: string;
  description_el: string;
  description_en: string;
  category: string;
  year: string;
  location_el: string;
  location_en: string;
  featured: boolean;
  status: ProjectStatus;
};

const optionalText = (minimum: number, maximum: number, minimumMessage: string, maximumMessage: string) =>
  z.string().trim().refine((value) => !value || value.length >= minimum, minimumMessage)
    .refine((value) => value.length <= maximum, maximumMessage);

export const projectFormSchema = z.object({
  id: z.uuid().optional(),
  slug: z.string().trim()
    .min(1, 'Συμπλήρωσε ένα slug ή έναν αγγλικό τίτλο για αυτόματη δημιουργία.')
    .max(180, 'Το slug δεν μπορεί να ξεπερνά τους 180 χαρακτήρες.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Χρησιμοποίησε μόνο πεζά λατινικά, αριθμούς και παύλες.'),
  title_el: optionalText(2, 160, 'Ο τίτλος πρέπει να περιέχει τουλάχιστον 2 χαρακτήρες.', 'Ο τίτλος δεν μπορεί να ξεπερνά τους 160 χαρακτήρες.'),
  title_en: optionalText(2, 160, 'Ο τίτλος πρέπει να περιέχει τουλάχιστον 2 χαρακτήρες.', 'Ο τίτλος δεν μπορεί να ξεπερνά τους 160 χαρακτήρες.'),
  description_el: optionalText(10, 3000, 'Η περιγραφή πρέπει να περιέχει τουλάχιστον 10 χαρακτήρες.', 'Η περιγραφή δεν μπορεί να ξεπερνά τους 3.000 χαρακτήρες.'),
  description_en: optionalText(10, 3000, 'Η περιγραφή πρέπει να περιέχει τουλάχιστον 10 χαρακτήρες.', 'Η περιγραφή δεν μπορεί να ξεπερνά τους 3.000 χαρακτήρες.'),
  category: z.enum(PROJECT_CATEGORIES, { message: 'Επίλεξε έγκυρη κατηγορία.' }),
  year: z.string().trim().refine((value) => !value || (/^\d{4}$/.test(value) && Number(value) >= 2000 && Number(value) <= 2100), 'Το έτος πρέπει να είναι μεταξύ 2000 και 2100.'),
  location_el: optionalText(2, 160, 'Η τοποθεσία πρέπει να περιέχει τουλάχιστον 2 χαρακτήρες.', 'Η τοποθεσία δεν μπορεί να ξεπερνά τους 160 χαρακτήρες.'),
  location_en: optionalText(2, 160, 'Η τοποθεσία πρέπει να περιέχει τουλάχιστον 2 χαρακτήρες.', 'Η τοποθεσία δεν μπορεί να ξεπερνά τους 160 χαρακτήρες.'),
  featured: z.boolean(),
  status: z.enum(PROJECT_STATUSES, { message: 'Επίλεξε έγκυρη κατάσταση.' }),
}).superRefine((value, context) => {
  if (!value.title_el && !value.title_en) {
    const message = 'Συμπλήρωσε τίτλο τουλάχιστον σε μία γλώσσα.';
    context.addIssue({ code: 'custom', path: ['title_el'], message });
    context.addIssue({ code: 'custom', path: ['title_en'], message });
  }
  if (!value.description_el && !value.description_en) {
    const message = 'Συμπλήρωσε περιγραφή τουλάχιστον σε μία γλώσσα.';
    context.addIssue({ code: 'custom', path: ['description_el'], message });
    context.addIssue({ code: 'custom', path: ['description_en'], message });
  }
});

export const imageAltSchema = z.object({
  alt_el: optionalText(2, 300, 'Το alt text πρέπει να περιέχει τουλάχιστον 2 χαρακτήρες.', 'Το alt text δεν μπορεί να ξεπερνά τους 300 χαρακτήρες.'),
  alt_en: optionalText(2, 300, 'Το alt text πρέπει να περιέχει τουλάχιστον 2 χαρακτήρες.', 'Το alt text δεν μπορεί να ξεπερνά τους 300 χαρακτήρες.'),
}).superRefine((value, context) => {
  if (!value.alt_el && !value.alt_en) {
    const message = 'Συμπλήρωσε alt text τουλάχιστον σε μία γλώσσα.';
    context.addIssue({ code: 'custom', path: ['alt_el'], message });
    context.addIssue({ code: 'custom', path: ['alt_en'], message });
  }
});

export type FieldErrors = Record<string, string>;

export function errorsByPath(error: z.ZodError): FieldErrors {
  const result: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.');
    if (key && !result[key]) result[key] = issue.message;
  }
  return result;
}

export function toNullableText(value: string): string | null {
  return value.trim() || null;
}
