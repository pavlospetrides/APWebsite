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
    eyebrow: 'Ηλεκτρολογικές εγκαταστάσεις νέων κατοικιών',
    title: 'Η υποδομή ξεκινά μαζί με την οικοδομή.',
    intro:
      'Η ηλεκτρολογική εγκατάσταση μιας νέας κατοικίας οργανώνεται από το αρχικό στάδιο, ώστε τα κυκλώματα και τα σημεία να εξυπηρετούν τη σημερινή χρήση και πιθανές μελλοντικές ανάγκες.',
    heading: 'Πλήρης πορεία από τις απαιτήσεις έως την παράδοση',
    items: [
      'Μελέτη απαιτήσεων του χώρου',
      'Σωληνώσεις και καλωδιώσεις',
      'Πίνακας και οργάνωση κυκλωμάτων',
      'Φωτισμός, διακόπτες και πρίζες',
      'Προβλέψεις για δίκτυο και εξωτερικούς χώρους ως πρόσθετες επιλογές, όπου συμφωνηθούν',
      'Έλεγχος και παράδοση',
    ],
    processTitle: 'Εργασία ανά στάδιο κατασκευής',
    process: [
      'Συζήτηση απαιτήσεων και σημείων.',
      'Σωληνώσεις και κουτιά πριν τα επιχρίσματα.',
      'Καλωδίωση, πίνακας και κυκλώματα.',
      'Τελικά σημεία, έλεγχος και παράδοση.',
    ],
    ctaTitle: 'Ξεκινά μια νέα κατασκευή;',
    ctaText:
      'Η έγκαιρη επικοινωνία βοηθά να οργανωθούν σωστά τα σημεία και οι διαδρομές.',
    image: '/images/hero-new-build.webp',
    alt: 'Ενδεικτική πλήρης ηλεκτρολογική εγκατάσταση νέας κατοικίας',
  },
  en: {
    eyebrow: 'New-home electrical installations',
    title: 'The electrical infrastructure begins with the build.',
    intro:
      'A new home’s electrical installation is organised from the earliest stage so that circuits and points support today’s use and possible future requirements.',
    heading: 'A complete path from requirements to handover',
    items: [
      'Assessment of household requirements',
      'Conduits and wiring',
      'Distribution board and circuit organisation',
      'Lighting, switches and sockets',
      'Provision for data, outdoor areas and future needs as optional agreed additions',
      'Testing and handover',
    ],
    processTitle: 'Work aligned with construction stages',
    process: [
      'Discuss requirements and points.',
      'Install conduits and boxes before plastering.',
      'Complete wiring, board and circuits.',
      'Fit final points, test and hand over.',
    ],
    ctaTitle: 'Starting a new build?',
    ctaText: 'Early contact helps organise points and cable routes correctly.',
    image: '/images/hero-new-build.webp',
    alt: 'Example complete new-home electrical installation',
  },
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const el = locale === 'el';
  return {
    title: el
      ? 'Ηλεκτρολογικές εγκαταστάσεις νέων κατοικιών'
      : 'New-home electrical installations',
    description: el
      ? 'Πλήρης οικιακή εγκατάσταση από τις σωληνώσεις και την καλωδίωση έως τον έλεγχο.'
      : 'Complete home installation from conduits and wiring through final testing.',
    alternates: {
      canonical: `/${locale}/new-builds`,
      languages: { el: '/el/new-builds', en: '/en/new-builds' },
    },
  };
}
export default async function NewBuilds({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <ServicePage locale={locale} active="builds" content={content[locale]} />
  );
}
