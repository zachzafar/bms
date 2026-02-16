"use client"

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Shield,
  Users,
  Building,
  LogOut,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import { useStorage } from '@/hooks/useStorage';
import { authClient } from '@/lib/api/publicClient';
import { StorageService } from '@/lib/api/storage';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    // { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Tenants', href: '/dashboard/tenants', icon: Building },
  ];

  const { mutate, isPending } = authClient.systemAdmin.logout.useMutation();
  const { user } = useStorage()

  const handleLogout = () => {
    console.log(user)
    if (user) {
      mutate({
        body: {
          userId: user.id
        }
      }, {
        onSuccess: async () => {
          await StorageService.clearAll();
          const authUrl = process.env.NODE_ENV === 'production'
            ? 'https://app.bookos.xyz'
            : 'http://localhost:3000';
          window.location.href = authUrl;
        }
      });
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard' || href === '/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-foreground" />
                </div>
                <span className="text-xl font-bold text-foreground">System Admin</span>
              </div>

              {/* Navigation Links */}
              <nav className="hidden md:flex space-x-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActiveRoute(item.href)
                          ? 'bg-primary text-foreground'
                          : 'text-card-foreground hover:bg-muted hover:text-foreground'
                        }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Logout Button */}
            <div className="flex items-center">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-card-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
