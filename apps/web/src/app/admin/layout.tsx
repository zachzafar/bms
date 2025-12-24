
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Shield, Key, Globe } from 'lucide-react';
import Link from 'next/link';
import TanstackProvider from '@/providers/tanstack';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import '../globals.css';

const inter = Inter({ subsets: ['latin'] });

const adminNavItems = [
  {
    title: 'User Management',
    description: 'Create, edit, and manage user accounts',
    icon: <Users className="h-6 w-6" />,
    href: '/admin/users',
    color: 'bg-purple-500'
  },
  {
    title: 'Role Management',
    description: 'Define and manage user roles and permissions',
    icon: <Shield className="h-6 w-6" />,
    href: '/admin/roles',
    color: 'bg-indigo-500'
  },
  {
    title: 'API Key Management',
    description: 'Generate and manage API keys for integrations',
    icon: <Key className="h-6 w-6" />,
    href: '/admin/api-keys',
    color: 'bg-orange-500'
  },
  {
    title: 'Tenant Management',
    description: 'Manage multi-tenant organizations',
    icon: <Globe className="h-6 w-6" />,
    href: '/admin/tenants',
    color: 'bg-teal-500'
  }
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <TanstackProvider>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center">
                    <Link href="/">
                      <Button variant="ghost" size="sm" className="mr-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Hub
                      </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">BookOS Admin</h1>
                  </div>
                </div>
              </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {/* Admin Navigation */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Administrative Tools</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {adminNavItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className={`${item.color} p-3 rounded-lg w-fit`}>
                            {item.icon}
                          </div>
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <CardDescription className="text-sm">{item.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Page Content */}
              {children}
            </main>
          </div>
          <Toaster />
        </TanstackProvider>
      </body>
    </html>
  );
}
