import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  ServicePage,
  type ServicePageContent,
} from '@/components/service-page';
import { isLocale, type Locale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }> };
const content: Record<Locale, ServicePageContent> = {
  el: {
    eyebrow: 'Ηλεκτρολογικές εργασίες ανακαίνισης',
    title: 'Η εγκατάσταση προσαρμόζεται στον νέο χώρο.',
    intro:
      'Σε μια ανακαίνιση, η ηλεκτρολογική εγκατάσταση εξετάζεται μαζί με τη νέα διαρρύθμιση και τις ανάγκες κάθε χώρου.',
    heading: 'Από την παλιά καλωδίωση στα νέα σημεία χρήσης',
    items: [
      'Αντικατάσταση και αναβάθμιση παλιάς καλωδίωσης',
      'Νέα σημεία φωτισμού',
      'Πρίζες και διακόπτες',
      'Αναβάθμιση ηλεκτρικού πίνακα',
      'Προσαρμογή κουζίνας και άλλων χώρων',
      'Έλεγχος της εγκατάστασης μετά την ολοκλήρωση',
    ],
    processTitle: 'Συντονισμός με την πορεία της ανακαίνισης',
    process: [
      'Καταγραφή της νέας διαρρύθμισης και των αναγκών.',
      'Έλεγχος της υπάρχουσας εγκατάστασης.',
      'Προετοιμασία καλωδίωσης, σημείων και πίνακα.',
      'Τοποθέτηση τελικών υλικών και έλεγχος.',
    ],
    ctaTitle: 'Σχεδιάζετε ανακαίνιση;',
    ctaText: 'Περιγράψτε τον χώρο και το στάδιο στο οποίο βρίσκεται το έργο.',
    image: '/images/renovation.webp',
    alt: 'Ενδεικτική ηλεκτρολογική ανακαίνιση με νέα καλωδίωση',
  },
  en: {
    eyebrow: 'Electrical renovation work',
    title: 'An installation shaped around the renewed space.',
    intro:
      'During a renovation, the electrical installation is considered alongside the new layout and the practical needs of each room.',
    heading: 'From older wiring to new points of use',
    items: [
      'Replacement and upgrade of older wiring',
      'New lighting points',
      'Sockets and switches',
      'Distribution-board upgrade',
      'Electrical adaptation of kitchens and other rooms',
      'Installation check after completion',
    ],
    processTitle: 'Coordinated with the renovation programme',
    process: [
      'Record the new layout and requirements.',
      'Inspect the existing installation.',
      'Prepare wiring, points and distribution board.',
      'Fit final accessories and complete checks.',
    ],
    ctaTitle: 'Planning a renovation?',
    ctaText: 'Tell us about the space and the current stage of the project.',
    image: '/images/renovation.webp',
    alt: 'Example electrical renovation with new wiring',
  },
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const el = locale === 'el';
  return {
    title: el
      ? 'Ηλεκτρολογικές ανακαινίσεις | AP Electrical Services'
      : 'Electrical renovations | AP Electrical Services',
    description: el
      ? 'Καλωδίωση, φωτισμός, πρίζες, διακόπτες και πίνακες για ανακαινίσεις κατοικιών.'
      : 'Wiring, lighting, sockets, switches and distribution boards for home renovations.',
    alternates: {
      canonical: `/${locale}/renovations`,
      languages: { el: '/el/renovations', en: '/en/renovations' },
    },
  };
}
export default async function Renovations({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <ServicePage
      locale={locale}
      active="renovations"
      content={content[locale]}
    />
  );
}
