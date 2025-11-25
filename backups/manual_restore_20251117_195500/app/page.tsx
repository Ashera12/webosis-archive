import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Redirecting…',
};

export default function Page() {
  // Temporary safe redirect to the design-system preview.
  // This file is reversible and does not modify admin UI.
  redirect('/design-system/preview');
}
