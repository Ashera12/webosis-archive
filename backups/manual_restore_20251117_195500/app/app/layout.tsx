import React from 'react';
import './design-system/styles.css';
import ThemeProvider from './components/ThemeProvider';

export const metadata = {
  title: 'Webosis Preview',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="ds-root ds-variation-b">
        <ThemeProvider />
        {children}
      </body>
    </html>
  );
}
