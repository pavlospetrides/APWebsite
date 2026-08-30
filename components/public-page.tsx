import type { ReactNode } from 'react';
import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';
import { paths, type Locale } from '@/lib/i18n';

export function PublicPage({ locale, active, children }: { locale: Locale; active: keyof typeof paths; children: ReactNode }) {
  return <><SiteHeader locale={locale} active={active} /><main>{children}</main><SiteFooter locale={locale} /></>;
}
