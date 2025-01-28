import { Inter } from 'next/font/google';

import { Package2Icon } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import Logout from '@/components/custom/Logout';


const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang='en'>
      <body className={inter.className}>
        <div className='flex flex-col min-h-screen'>
          <header className='flex items-center h-16 px-4 border-b shrink-0 md:px-6'>
            <nav className='flex-col hidden gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6'>
              <a
                className='flex items-center gap-2 text-lg font-semibold md:text-base'
                href='#'
              >
                <Package2Icon className='w-6 h-6' />
                <span className=''>AssetBook</span>
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/dashboard'>
                Dashboard
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/dashboard/bookings'>
                Bookings
              </a>
              <a
                className='text-gray-500 dark:text-gray-400'
                href='/dashboard/maintenance'
              >
                Maintenance
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/dashboard/assets'>
                Assets
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/dashboard/reports'>
                Reports
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/dashboard/users'>
                Users
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/dashboard/settings'>
                Settings
              </a>
              <div className='flex-end'>
              <Logout/>
              </div>
            </nav>
          </header>
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}
