import type { Metadata } from 'next';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { notFound } from 'next/navigation';
import { AppointmentForm } from '@/components/appointment-form';
import { PageHero } from '@/components/page-hero';
import { PublicPage } from '@/components/public-page';
import { contactHref, siteConfig } from '@/config/site';
import { isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const el = locale === 'el';
  return {
    title: el
      ? 'Επικοινωνία και αίτημα ραντεβού'
      : 'Contact and appointment request',
    description: el
      ? 'Επικοινωνήστε τηλεφωνικά ή στείλτε αίτημα για ηλεκτρολογική εργασία.'
      : 'Call or send an appointment request for residential electrical work.',
    alternates: {
      canonical: `/${locale}/contact`,
      languages: { el: '/el/contact', en: '/en/contact' },
    },
  };
}
export default async function Contact({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const el = locale === 'el';
  return (
    <PublicPage locale={locale} active="contact">
      <PageHero
        eyebrow={el ? 'Επικοινωνία' : 'Contact'}
        title={
          el
            ? 'Πείτε μας τι χρειάζεται ο χώρος σας.'
            : 'Tell us what your property needs.'
        }
        description={
          el
            ? 'Καλέστε απευθείας ή συμπληρώστε τη φόρμα για να οργανωθεί μια επίσκεψη.'
            : 'Call directly or complete the form to arrange a visit.'
        }
        image="/images/finished-lighting.webp"
        alt={
          el
            ? 'Ενδεικτικό ολοκληρωμένο οικιακό σύστημα φωτισμού'
            : 'Example completed home lighting system'
        }
      />
      <section className="section contact-layout">
        <aside className="contact-card">
          <p className="section-kicker">{el ? 'Στοιχεία' : 'Details'}</p>
          <h2>{siteConfig.businessName}</h2>
          <a href={contactHref.phone}>
            <Phone />{' '}
            <span>
              <small>{el ? 'Τηλέφωνο' : 'Phone'}</small>
              {siteConfig.phone}
            </span>
          </a>
          <a href={contactHref.email}>
            <Mail />{' '}
            <span>
              <small>Email</small>
              {siteConfig.email}
            </span>
          </a>
          <span>
            <MapPin />{' '}
            <span>
              <small>{el ? 'Περιοχή εξυπηρέτησης' : 'Service area'}</small>
              {siteConfig.serviceArea}
            </span>
          </span>
          {contactHref.whatsapp && (
            <a href={contactHref.whatsapp} target="_blank" rel="noreferrer">
              <MessageCircle />
              <span>
                <small>WhatsApp</small>
                {siteConfig.whatsapp}
              </span>
            </a>
          )}
          <p className="placeholder-note">
            {el
              ? 'Τα στοιχεία σε αγκύλες είναι placeholders και πρέπει να αντικατασταθούν πριν τη δημοσίευση.'
              : 'Bracketed details are placeholders and must be replaced before launch.'}
          </p>
        </aside>
        <div>
          <p className="section-kicker">
            {el ? 'Αίτημα ραντεβού' : 'Appointment request'}
          </p>
          <h2>
            {el
              ? 'Στείλτε τις βασικές πληροφορίες'
              : 'Send the key information'}
          </h2>
          <p className="form-intro">
            {el
              ? 'Δεν χρειάζεται να γνωρίζετε τεχνικούς όρους. Περιγράψτε με απλά λόγια την εργασία ή το πρόβλημα.'
              : 'You do not need technical terminology. Simply describe the work or the problem.'}
          </p>
          <AppointmentForm locale={locale} />
        </div>
      </section>
    </PublicPage>
  );
}
