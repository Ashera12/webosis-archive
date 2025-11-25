import React from 'react';

export const metadata = {
  title: 'Design System Preview',
};

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
