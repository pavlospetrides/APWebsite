import Image from 'next/image';
import { Check, Phone } from 'lucide-react';
import { CtaBand } from './cta-band';
import { ExampleNote } from './example-note';
import { PageHero } from './page-hero';
import { PublicPage } from './public-page';
import { contactHref } from '@/config/site';
import { messages, paths, type Locale } from '@/lib/i18n';

export type ServicePageContent = { eyebrow: string; title: string; intro: string; heading: string; items: string[]; processTitle: string; process: string[]; ctaTitle: string; ctaText: string; image: string; alt: string };

export function ServicePage({ locale, active, content }: { locale: Locale; active: keyof typeof paths; content: ServicePageContent }) {
  const m = messages[locale];
  const gallery = [content.image, active === 'repairs' ? '/images/renovation.webp' : '/images/finished-lighting.webp'];
  return <PublicPage locale={locale} active={active}>
    <PageHero eyebrow={content.eyebrow} title={content.title} description={content.intro} image={content.image} alt={content.alt} />
    <section className="section service-detail"><div className="service-detail-copy"><p className="section-kicker">{locale === 'el' ? 'Αντικείμενο εργασιών' : 'Scope of work'}</p><h2>{content.heading}</h2><p>{content.intro}</p>{active === 'repairs' && <a className="button button-primary inline-button" href={contactHref.phone}><Phone />{m.call}</a>}</div><ul className="check-list">{content.items.map(item => <li key={item}><Check />{item}</li>)}</ul></section>
    <section className="section gallery-section"><div className="section-heading"><div><p className="section-kicker">{m.example}</p><h2>{locale === 'el' ? 'Εικόνες του αντικειμένου' : 'Images of the work'}</h2></div></div><ExampleNote locale={locale} /><div className="service-gallery">{gallery.map((src, i) => <div className={i === 0 ? 'wide' : ''} key={src}><Image src={src} alt={content.alt} fill sizes="(max-width: 800px) 100vw, 65vw" /></div>)}</div></section>
    <section className="section workflow"><p className="section-kicker">{locale === 'el' ? 'Πώς προχωρά η εργασία' : 'How the work proceeds'}</p><h2>{content.processTitle}</h2><ol>{content.process.map((step, i) => <li key={step}><span>0{i + 1}</span><p>{step}</p></li>)}</ol></section>
    <CtaBand locale={locale} title={content.ctaTitle} text={content.ctaText} />
  </PublicPage>;
}
