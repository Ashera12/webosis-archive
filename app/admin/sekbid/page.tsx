import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Alias path for convenience and to ensure presence of sekbid management
export default function SekbidAliasPage() {
  redirect('/admin/data/sekbid');
}
