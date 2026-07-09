import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrowEasy CSV Importer — AI-Powered CRM Lead Import',
  description: 'Upload any CSV from Facebook, Google Ads, or spreadsheets. AI maps your data to GrowEasy CRM fields.',
  keywords: ['CRM', 'CSV import', 'lead management', 'GrowEasy', 'AI'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}