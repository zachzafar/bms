import { Inter } from 'next/font/google';

import { Package2Icon } from 'lucide-react';
;
import Logout from '@/components/custom/Logout';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <>
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
              <a className='text-gray-500 dark:text-gray-400' href='/bookings'>
                Bookings
              </a>
              <a
                className='text-gray-500 dark:text-gray-400'
                href='/maintenance'
              >
                Maintenance
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/assets'>
                Assets
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/reports'>
                Reports
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/users'>
                Users
              </a>
              <a className='text-gray-500 dark:text-gray-400' href='/settings'>
                Settings
              </a>
              <div className='flex-end'>
              <Logout/>
              </div>
            </nav>
          </header>
          {children}
          </>
  );
}
