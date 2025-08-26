import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import TanstackProvider from '@/providers/tanstack';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BookOS System Admin',
  description: 'System administration dashboard for BookOS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TanstackProvider>
          {children}
          <Toaster />
        </TanstackProvider>
      </body>
    </html>
  );
}
