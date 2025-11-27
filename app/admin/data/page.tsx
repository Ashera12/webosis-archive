import { redirect } from 'next/navigation';

// Ensure the /admin/data segment is included in the build
// and guide users to the primary data section.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminDataIndex() {
  redirect('/admin/data/sekbid');
}
