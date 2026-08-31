import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AdminDashboard } from '@/components/admin-dashboard';
import { getAdminAuthorization } from '@/lib/admin/authorization';
import { getPrivateAdminLoginPath } from '@/lib/admin/config';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: { absolute: 'AP Electrical Services' }, robots: { index: false, follow: false, nocache: true } };

export default async function AdminPage() {
  const access = await getAdminAuthorization();
  if (!access.authorized) notFound();
  return <AdminDashboard loginPath={getPrivateAdminLoginPath() || '/'} />;
}
