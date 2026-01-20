import TanstackProvider from '@/providers/tanstack';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <TanstackProvider>
                        {children}
                    </TanstackProvider>
                    <Toaster />
                </ThemeProvider>
            </body>
        </html>
    );
}
