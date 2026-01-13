import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/custom/AppSidebar'
import { AppHeader } from '@/components/app-header'

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={{ '--sidebar-width': '14rem' } as React.CSSProperties}
    >
      <AppSidebar />

      <SidebarInset className="h-screen flex flex-col">
        <nav className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg">BookingOS</h1>
          </div>
          <AppHeader />
        </nav>

        <main className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-8 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
