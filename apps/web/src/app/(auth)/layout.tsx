import Link from 'next/link'
import { Button } from '@/components/ui/button'


export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <span className="text-2xl font-bold">BookingOS</span>
            </div>
            <nav className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Button asChild>
                <Link href="/signup">Start Free Trial</Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
        {children}      
  </>
  )
}

