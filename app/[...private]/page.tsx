import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { AdminLogin } from '@/components/admin-login';
import { getAdminAuthorization } from '@/lib/admin/authorization';
import { getPrivateAdminLoginPath } from '@/lib/admin/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: { absolute: 'AP Electrical Services' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  openGraph: { title: 'AP Electrical Services', description: '', images: [] },
  twitter: { title: 'AP Electrical Services', description: '', images: [] },
};

type Props = { params: Promise<{ private: string[] }> };

export default async function PrivateEntryPage({ params }: Props) {
  const configuredPath = getPrivateAdminLoginPath();
  const { private: segments } = await params;
  if (!configuredPath || `/${segments.join('/')}` !== configuredPath) notFound();

  const access = await getAdminAuthorization();
  if (access.authorized) redirect('/admin');
  return <AdminLogin />;
}
