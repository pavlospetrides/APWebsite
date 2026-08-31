'use client';

import { useEffect, useState } from 'react';
import { Menu, Phone, X } from 'lucide-react';
import { Logo } from './logo';
import { contactHref } from '@/config/site';
import { messages, paths, type Locale } from '@/lib/i18n';

export function SiteHeader({ locale, active, languagePath }: { locale: Locale; active?: keyof typeof paths; languagePath?: string }) {
  const [open, setOpen] = useState(false);
  const m = messages[locale];
  const other = locale === 'el' ? 'en' : 'el';
  const nav = [
    ['home', m.nav.home], ['renovations', m.nav.renovations], ['builds', m.nav.builds],
    ['repairs', m.nav.repairs], ['projects', m.nav.projects], ['contact', m.nav.contact],
  ] as const;

  useEffect(() => { document.documentElement.lang = locale; }, [locale]);

  return (
    <header className="site-header">
      <a href={`/${locale}`} aria-label={`${m.nav.home} — AP Electrical Services`}><Logo /></a>
      <nav className="desktop-nav" aria-label={locale === 'el' ? 'Κύρια πλοήγηση' : 'Main navigation'}>
        {nav.map(([key, label]) => <a key={key} className={active === key ? 'active' : ''} aria-current={active === key ? 'page' : undefined} href={`/${locale}/${paths[key]}`}>{label}</a>)}
      </nav>
      <div className="header-tools">
        <a className="language" href={`/${other}/${languagePath ?? (active ? paths[active] : '')}`} lang={other} hrefLang={other}>{other.toUpperCase()}</a>
        <a className="header-appointment" href={`/${locale}/contact`}>{m.appointment}</a>
        <a className="mobile-call" href={contactHref.phone} aria-label={m.call}><Phone aria-hidden="true" /></a>
        <button className="menu-toggle" type="button" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X /> : <Menu />}</button>
      </div>
      <div id="mobile-menu" className={`mobile-menu ${open ? 'open' : ''}`}>
        {nav.map(([key, label]) => <a key={key} className={active === key ? 'active' : ''} href={`/${locale}/${paths[key]}`} onClick={() => setOpen(false)}>{label}</a>)}
        <a className="button button-primary" href={`/${locale}/contact`}>{m.appointment}</a>
      </div>
    </header>
  );
}
