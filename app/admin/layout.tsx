import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { auth } from '@/lib/auth';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get session for UI rendering (sidebar/header) but don't enforce
  // role checks here to avoid redirect loops on /admin/login.
  // Middleware and page-level guards handle auth.
  const session = await auth();
  
  return <AdminLayoutClient session={session}>{children}</AdminLayoutClient>;
}
