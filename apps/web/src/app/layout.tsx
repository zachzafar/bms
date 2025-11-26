import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/custom/AppSidebar';
import { AppHeader } from '@/components/app-header';
import TanstackProvider from '@/providers/tanstack';
import { Inter } from 'next/font/google';
import './globals.css'
import { Toaster } from '@/components/ui/sonner'




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
    {/* Set a thinner sidebar width via CSS variable */}
    <SidebarProvider style={{ '--sidebar-width': '14rem' } as React.CSSProperties}>
      <AppSidebar />
      <main className="w-full h-screen flex flex-col">
        <nav className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg">BookingOS</h1>
          </div>
          <AppHeader />
        </nav>
        <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-8 overflow-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
    </TanstackProvider>
    <Toaster />
    </body>
    </html>
  );
}
