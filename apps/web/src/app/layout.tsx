import TanstackProvider from '@/providers/tanstack';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <TanstackProvider>
                    {children}
                </TanstackProvider>
                <Toaster />
            </body>
        </html>
    );
}
