import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rifa Solidária — Rotary Club Butantã',
  description: 'Participe da rifa solidária e apoie os projetos sociais do Rotary Club Butantã.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
