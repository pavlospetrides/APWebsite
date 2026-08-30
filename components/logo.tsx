import { siteConfig } from '@/config/site';

export function Logo() {
  return (
    <span className="brand" aria-label={siteConfig.businessName}>
      <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48"><path className="logo-a" d="M5 38 16 9h9l7 18-6 1.5-5.4-14L13 38H5Z"/><path className="logo-p" d="M27 9h8.5C41 9 44 12 44 17s-3 8-8.5 8H34v13h-7V9Zm7 6v4h1.2c1.3 0 2-.7 2-2s-.7-2-2-2H34Z"/><path className="logo-bolt" d="m21 22 10-2-6 8h5L17 41l4-11h-5l5-8Z"/></svg></span>
      <span><strong>AP</strong><small>{siteConfig.businessName.replace(/^AP\s*/i, '')}</small></span>
    </span>
  );
}
