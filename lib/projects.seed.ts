import type { Locale } from './i18n';

export type ProjectCategory = 'renovation' | 'new-build' | 'repair' | 'lighting';
export type ProjectSeed = {
  slug: string;
  category: ProjectCategory;
  year: number;
  location: { el: string; en: string };
  title: { el: string; en: string };
  description: { el: string; en: string };
  cover: string;
  images: string[];
  alt: { el: string; en: string };
  featured: boolean;
};

export const exampleProjects: ProjectSeed[] = [
  {
    slug: 'new-home-installation-example', category: 'new-build', year: 2026,
    location: { el: 'Ενδεικτική τοποθεσία', en: 'Example location' },
    title: { el: 'Ηλεκτρολογική εγκατάσταση νέας κατοικίας', en: 'New-home electrical installation' },
    description: { el: 'Ενδεικτική παρουσίαση σωληνώσεων, καλωδίωσης, πίνακα και τελικών σημείων σε νέα κατοικία.', en: 'An example of conduits, wiring, distribution board and final points in a new home.' },
    cover: '/images/hero-new-build.webp', images: ['/images/hero-new-build.webp', '/images/finished-lighting.webp'],
    alt: { el: 'Ενδεικτική καλωδίωση σε νέα κατοικία', en: 'Example wiring in a new home' }, featured: true,
  },
  {
    slug: 'apartment-renovation-example', category: 'renovation', year: 2026,
    location: { el: 'Ενδεικτική τοποθεσία', en: 'Example location' },
    title: { el: 'Ηλεκτρολογική αναβάθμιση κατοικίας', en: 'Home electrical upgrade' },
    description: { el: 'Ενδεικτική αντικατάσταση καλωδίωσης και προετοιμασία νέων σημείων πρίζας και φωτισμού.', en: 'Example cable replacement and preparation of new socket and lighting points.' },
    cover: '/images/renovation.webp', images: ['/images/renovation.webp', '/images/finished-lighting.webp'],
    alt: { el: 'Ενδεικτική ηλεκτρολογική ανακαίνιση', en: 'Example electrical renovation' }, featured: true,
  },
  {
    slug: 'fault-diagnosis-example', category: 'repair', year: 2026,
    location: { el: 'Ενδεικτική τοποθεσία', en: 'Example location' },
    title: { el: 'Διάγνωση προβλήματος σε πίνακα', en: 'Distribution-board fault diagnosis' },
    description: { el: 'Ενδεικτική μεθοδική διερεύνηση κυκλωμάτων και ελαττωματικών εξαρτημάτων.', en: 'Example methodical circuit and component diagnosis.' },
    cover: '/images/fault-diagnosis.webp', images: ['/images/fault-diagnosis.webp'],
    alt: { el: 'Ενδεικτικός έλεγχος ηλεκτρικού πίνακα', en: 'Example electrical board inspection' }, featured: false,
  },
  {
    slug: 'residential-lighting-example', category: 'lighting', year: 2026,
    location: { el: 'Ενδεικτική τοποθεσία', en: 'Example location' },
    title: { el: 'Φωτισμός σύγχρονης κατοικίας', en: 'Contemporary residential lighting' },
    description: { el: 'Ενδεικτικό τελικό αποτέλεσμα φωτισμού, διακοπτών και ηλεκτρικών σημείων.', en: 'Example finished lighting, switches and electrical points.' },
    cover: '/images/finished-lighting.webp', images: ['/images/finished-lighting.webp'],
    alt: { el: 'Ενδεικτικός φωτισμός ολοκληρωμένης κατοικίας', en: 'Example completed home lighting' }, featured: true,
  },
];

export const categoryLabel: Record<ProjectCategory, Record<Locale, string>> = {
  renovation: { el: 'Ανακαίνιση', en: 'Renovation' },
  'new-build': { el: 'Νέα κατασκευή', en: 'New build' },
  repair: { el: 'Επισκευή', en: 'Repair' },
  lighting: { el: 'Φωτισμός', en: 'Lighting' },
};
