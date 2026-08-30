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
    eyebrow: 'Επισκευές και εντοπισμός βλαβών',
    title: 'Πρώτα βρίσκουμε την αιτία. Μετά προχωρά η επισκευή.',
    intro:
      'Η διάγνωση γίνεται μεθοδικά, με έλεγχο του προβληματικού σημείου και των σχετικών κυκλωμάτων πριν αποφασιστεί η κατάλληλη αποκατάσταση.',
    heading: 'Έλεγχος οικιακών ηλεκτρικών προβλημάτων',
    items: [
      'Διάγνωση ηλεκτρικών προβλημάτων',
      'Πτώση ασφάλειας ή διακόπτη',
      'Προβληματικές πρίζες και διακόπτες',
      'Βλάβες φωτισμού',
      'Εντοπισμός προβλημάτων σε οικιακά κυκλώματα',
      'Επισκευή ή αντικατάσταση ελαττωματικών εξαρτημάτων',
    ],
    processTitle: 'Μεθοδικός έλεγχος πριν την επέμβαση',
    process: [
      'Περιγραφή των συμπτωμάτων.',
      'Έλεγχος του σημείου και των σχετικών κυκλωμάτων.',
      'Ενημέρωση για την προτεινόμενη εργασία.',
      'Επισκευή ή αντικατάσταση και επανέλεγχος.',
    ],
    ctaTitle: 'Αντιμετωπίζετε ηλεκτρικό πρόβλημα;',
    ctaText:
      'Καλέστε ή στείλτε τα βασικά στοιχεία της βλάβης. Δεν προβάλλεται μη επιβεβαιωμένη υπόσχεση 24ωρης εξυπηρέτησης.',
    image: '/images/fault-diagnosis.webp',
    alt: 'Ενδεικτική ασφαλής διάγνωση προβλήματος σε ηλεκτρικό πίνακα',
  },
  en: {
    eyebrow: 'Repairs and fault finding',
    title: 'Find the cause first. Then repair it.',
    intro:
      'Diagnosis is methodical, checking the affected point and relevant circuits before deciding on the appropriate repair.',
    heading: 'Residential electrical problem checks',
    items: [
      'Electrical problem diagnosis',
      'Tripping fuse or breaker',
      'Problematic sockets and switches',
      'Lighting faults',
      'Fault finding in residential circuits',
      'Repair or replacement of defective components',
    ],
    processTitle: 'A methodical check before intervention',
    process: [
      'Describe the symptoms.',
      'Check the point and relevant circuits.',
      'Explain the proposed work.',
      'Repair or replace and test again.',
    ],
    ctaTitle: 'Dealing with an electrical problem?',
    ctaText:
      'Call or send the key details of the fault. No unconfirmed 24-hour service promise is made.',
    image: '/images/fault-diagnosis.webp',
    alt: 'Example safe fault diagnosis at an electrical board',
  },
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const el = locale === 'el';
  return {
    title: el
      ? 'Επισκευές και ηλεκτρικές βλάβες'
      : 'Electrical repairs and faults',
    description: el
      ? 'Διάγνωση και αποκατάσταση ηλεκτρικών προβλημάτων σε κατοικίες.'
      : 'Diagnosis and repair of residential electrical problems.',
    alternates: {
      canonical: `/${locale}/repairs`,
      languages: { el: '/el/repairs', en: '/en/repairs' },
    },
  };
}
export default async function Repairs({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <ServicePage locale={locale} active="repairs" content={content[locale]} />
  );
}
