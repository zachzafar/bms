'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import TanstackProvider from '@/providers/tanstack'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {


  return (
    <html lang="en">
      <body className={inter.className}>
      <div className="flex flex-col min-h-screen">
        <TanstackProvider>
        {children}
        </TanstackProvider>
        </div>
        <Toaster />
        </body>  
    </html>
  )
}

