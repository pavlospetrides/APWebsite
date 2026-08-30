import { Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from './logo';
import { contactHref, siteConfig } from '@/config/site';
import { messages, type Locale } from '@/lib/i18n';

export function SiteFooter({ locale }: { locale: Locale }) {
  const m = messages[locale];
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div><Logo /><p>{m.footer}</p></div>
        <div><h2>{m.nav.contact}</h2><a href={contactHref.phone}><Phone /> {siteConfig.phone}</a><a href={contactHref.email}><Mail /> {siteConfig.email}</a><span><MapPin /> {siteConfig.serviceArea}</span></div>
        <div><h2>{m.nav.projects}</h2><a href={`/${locale}/renovations`}>{m.nav.renovations}</a><a href={`/${locale}/new-builds`}>{m.nav.builds}</a><a href={`/${locale}/repairs`}>{m.nav.repairs}</a></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} {siteConfig.businessName}</span><span>{m.privacy}</span></div>
    </footer>
  );
}
