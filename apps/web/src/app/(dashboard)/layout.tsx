import { Inter } from 'next/font/google';

import { Package2Icon } from 'lucide-react';
;
import Logout from '@/components/custom/Logout';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/custom/AppSidebar';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full h-screen p-4 flex flex-col gap-4 p-4 md:gap-8 md:p-6">
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
    // </>
  );
}
