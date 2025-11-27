import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Alias for members management; canonical path under /admin/data/members
export default function MembersAliasPage() {
  redirect('/admin/data/members');
}
