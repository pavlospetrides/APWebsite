import { ArrowUpRight, Phone } from 'lucide-react';
import { contactHref } from '@/config/site';
import { messages, type Locale } from '@/lib/i18n';

export function CtaBand({ locale, title, text }: { locale: Locale; title: string; text: string }) {
  const m = messages[locale];
  return <section className="cta-band"><div><p className="eyebrow"><span /> AP Electrical Services</p><h2>{title}</h2><p>{text}</p></div><div className="cta-actions"><a className="button button-primary" href={contactHref.phone}><Phone />{m.call}</a><a className="button button-light" href={`/${locale}/contact`}>{m.appointment}<ArrowUpRight /></a></div></section>;
}
