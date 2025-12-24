'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TanstackProvider from '@/providers/tanstack'
import { Toaster } from '@/components/ui/sonner'
import { DashboardLayout } from '@/components/crm/dashboard-layout'

const inter = Inter({ subsets: ['latin'] })


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {


  return (
    <html lang="en">
      <body className={inter.className}>

        <TanstackProvider>
          <DashboardLayout>
        {children}
        </DashboardLayout>
        </TanstackProvider>
        <Toaster />
        </body>  
    </html>
  )
}

