export const locales = ['el', 'en'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const messages = {
  el: {
    nav: { home: 'Αρχική', renovations: 'Ανακαινίσεις', builds: 'Νέες Κατασκευές', repairs: 'Επισκευές & Βλάβες', projects: 'Έργα', contact: 'Επικοινωνία' },
    appointment: 'Κλείστε ραντεβού', call: 'Καλέστε τώρα', example: 'Ενδεικτικές εργασίες', learn: 'Δείτε περισσότερα', area: 'Περιοχή εξυπηρέτησης', footer: 'Ηλεκτρολογικές εργασίες κατοικιών με προσεκτική εκτέλεση και ξεκάθαρη επικοινωνία.', privacy: 'Τα στοιχεία της φόρμας χρησιμοποιούνται μόνο για την επικοινωνία σχετικά με το αίτημά σας.',
  },
  en: {
    nav: { home: 'Home', renovations: 'Renovations', builds: 'New Builds', repairs: 'Repairs & Faults', projects: 'Projects', contact: 'Contact' },
    appointment: 'Book an appointment', call: 'Call now', example: 'Example services', learn: 'Learn more', area: 'Service area', footer: 'Residential electrical work carried out with care and clear communication.', privacy: 'Form details are used only to contact you about your request.',
  },
} as const;

export const paths = {
  home: '', renovations: 'renovations', builds: 'new-builds', repairs: 'repairs', projects: 'projects', contact: 'contact',
} as const;
