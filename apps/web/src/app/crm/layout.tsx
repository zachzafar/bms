'use client'
import { DashboardLayout } from '@/components/crm/dashboard-layout'

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {


  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}

