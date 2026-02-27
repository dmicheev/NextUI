import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Robot Control Panel',
  description: 'Панель управления роботом',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
