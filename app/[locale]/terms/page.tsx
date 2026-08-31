import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getLegalMetadata, LegalPage } from '@/components/legal-page';
import { isLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return getLegalMetadata(locale, 'terms');
}

export default async function Terms({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <LegalPage locale={locale} kind="terms" />;
}
