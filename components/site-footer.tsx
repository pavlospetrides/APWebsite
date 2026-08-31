import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './logo';
import { contactHref, siteConfig } from '@/config/site';
import { legalConfig } from '@/config/legal';
import { messages, type Locale } from '@/lib/i18n';

export function SiteFooter({ locale }: { locale: Locale }) {
  const m = messages[locale];
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div><Logo /><p>{m.footer}</p><p className="footer-identity">{locale === 'el' ? `${legalConfig.identity.providerNameEl} · ${legalConfig.identity.professionalTitleEl}` : `${legalConfig.identity.providerNameEn} · ${legalConfig.identity.professionalTitleEn}`}</p></div>
        <div><h2>{m.nav.contact}</h2><a href={contactHref.phone}><Phone /> {legalConfig.identity.phone}</a><a href={contactHref.email}><Mail /> {legalConfig.identity.email}</a><span><MapPin /> {locale === 'el' ? legalConfig.identity.serviceAreaEl : legalConfig.identity.serviceAreaEn}</span></div>
        <div><h2>{m.nav.projects}</h2><a href={`/${locale}/renovations`}>{m.nav.renovations}</a><a href={`/${locale}/new-builds`}>{m.nav.builds}</a><a href={`/${locale}/repairs`}>{m.nav.repairs}</a></div>
        <div><h2>{m.legal.heading}</h2><a href={`/${locale}/privacy`}>{m.legal.privacy}</a><a href={`/${locale}/cookies`}>{m.legal.cookies}</a><a href={`/${locale}/legal`}>{m.legal.notice}</a><a href={`/${locale}/terms`}>{m.legal.terms}</a></div>
      </div>
      <div className="footer-bottom">
        <span>© {year} {siteConfig.businessName}. {locale === 'el' ? 'Με επιφύλαξη παντός δικαιώματος.' : 'All rights reserved.'}</span>
        <span className="footer-credit">{locale === 'el' ? 'Σχεδιασμός & ανάπτυξη ιστοσελίδας από' : 'Website design & development by'} <a href="https://cpuclinic.eu" target="_blank" rel="noopener noreferrer">CPU Clinic</a></span>
      </div>
    </footer>
  );
}
