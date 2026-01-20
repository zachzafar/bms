'use client'

import { useEffect, useState } from 'react'
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { CrmSidebar } from '@/components/custom/CrmSidebar'
import { AppHeader } from '@/components/crm/app-header'

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <SidebarProvider
      style={{ '--sidebar-width': '14rem' } as React.CSSProperties}
    >
      <CrmSidebar />

      <SidebarInset className="h-screen flex flex-col">
        <nav className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="font-semibold text-lg">CRM System</h1>
          </div>
          <AppHeader />
        </nav>

        <div className="flex-1 p-4 md:p-6 flex flex-col gap-4 md:gap-8 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
