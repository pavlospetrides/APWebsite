export const locales = ['el', 'en'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export const messages = {
  el: {
    nav: { home: 'Αρχική', renovations: 'Ανακαινίσεις', builds: 'Νέες Κατασκευές', repairs: 'Επισκευές & Βλάβες', projects: 'Έργα', contact: 'Επικοινωνία' },
    appointment: 'Κλείστε ραντεβού', call: 'Καλέστε τώρα', example: 'Ενδεικτικές εργασίες', learn: 'Δείτε περισσότερα', area: 'Περιοχή εξυπηρέτησης', footer: 'Ηλεκτρολογικές εργασίες κατοικιών με προσεκτική εκτέλεση και ξεκάθαρη επικοινωνία.',
    legal: { heading: 'Νομικά', privacy: 'Πολιτική Απορρήτου', cookies: 'Cookies & Αποθήκευση', notice: 'Νομική Ενημέρωση', terms: 'Όροι Χρήσης' },
  },
  en: {
    nav: { home: 'Home', renovations: 'Renovations', builds: 'New Builds', repairs: 'Repairs & Faults', projects: 'Projects', contact: 'Contact' },
    appointment: 'Book an appointment', call: 'Call now', example: 'Example services', learn: 'Learn more', area: 'Service area', footer: 'Residential electrical work carried out with care and clear communication.',
    legal: { heading: 'Legal', privacy: 'Privacy Policy', cookies: 'Cookies & Storage', notice: 'Legal Notice', terms: 'Website Terms' },
  },
} as const;

export const paths = {
  home: '', renovations: 'renovations', builds: 'new-builds', repairs: 'repairs', projects: 'projects', contact: 'contact',
} as const;
