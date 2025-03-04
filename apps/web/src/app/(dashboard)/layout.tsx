import { Inter } from 'next/font/google';

import { Package2Icon } from 'lucide-react';
;
import Logout from '@/components/custom/Logout';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/custom/AppSidebar';
import { useTenant } from '@/lib/api/useTenant';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full h-screen flex flex-col">
        <nav className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg">BookingOS</h1>
          </div>
          <div className="flex items-center gap-4">
            <Logout />
          </div>
        </nav>
        <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-8 overflow-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
