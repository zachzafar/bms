'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Users, Settings, LogOut, User, Shield, Key, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { getSession, deleteSession } from '@/lib/api/session';
import { toast } from 'sonner';
import { queryClient } from '@/providers/tanstack';

interface AppOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  url: string;
  color: string;
}

const appOptions: AppOption[] = [
  {
    id: 'booking',
    name: 'Booking Platform',
    description: 'Manage property bookings, availability, and reservations',
    icon: <Building className="h-8 w-8" />,
    url: '/bookings',
    color: 'bg-primary/50'
  },
  {
    id: 'crm',
    name: 'CRM System',
    description: 'Customer relationship management and lead tracking',
    icon: <Users className="h-8 w-8" />,
    url: '/crm',
    color: 'bg-primary/50'
  }
];

const adminFeatures = [
  {
    id: 'users',
    name: 'User Management',
    description: 'Create, edit, and manage user accounts and permissions',
    icon: <User className="h-6 w-6" />,
    href: '/admin/users',
    color: 'bg-purple-500'
  },
  {
    id: 'roles',
    name: 'Role Management',
    description: 'Define and manage user roles and access levels',
    icon: <Shield className="h-6 w-6" />,
    href: '/admin/roles',
    color: 'bg-indigo-500'
  },
  {
    id: 'api-keys',
    name: 'API Key Management',
    description: 'Generate and manage API keys for integrations',
    icon: <Key className="h-6 w-6" />,
    href: '/admin/api-keys',
    color: 'bg-orange-500'
  },
  // {
  //   id: 'tenants',
  //   name: 'Tenant Management',
  //   description: 'Manage multi-tenant organizations and settings',
  //   icon: <Globe className="h-6 w-6" />,
  //   href: '/admin/tenants',
  //   color: 'bg-teal-500'
  // }
];

export default function AuthHubPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tenants, setTenants] = useState<any[]>([]);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const session = await getSession();
        console.log('Session check result:', session);
        
        if (!session) {
          console.log('No session found, redirecting to login');
          router.push('/login');
          return;
        }

        // Get user info from session or make API call
        // For now, we'll use the session data
        setUser({ id: 'user-id', email: 'user@example.com', name: 'Admin User' });
        setTenants([{ id: 'tenant-1', name: 'Default Tenant' }]);
        setCurrentTenant({ id: 'tenant-1', name: 'Default Tenant' });
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  const handleAppRedirect = (app: AppOption) => {
    // Set a cross-domain cookie or use a different approach for subdomain auth
    // For now, we'll redirect with a token parameter
    const token = localStorage.getItem('auth_token') || '';
    const redirectUrl = `${app.url}?token=${token}&tenant=${currentTenant?.id}`;
    window.location.href = redirectUrl;
  };

  const handleLogout = async () => {
    try {
      await deleteSession();
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenant');
      localStorage.clear()

      queryClient.clear();

      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    }
  };

  const handleAdminFeature = (feature: typeof adminFeatures[0]) => {
    router.push(feature.href);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-2xl font-bold text-foreground">BookOS Auth Hub</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-foreground">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <span className="text-sm font-medium text-foreground">{user?.name || 'User'}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome to BookOS</h2>
          <p className="text-lg text-muted-foreground">
            Manage your account and access your applications from one central location.
          </p>
        </div>

        {/* Application Access Section */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">Access Your Applications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {appOptions.map((app) => (
              <Card key={app.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={`${app.color} p-3 rounded-lg`}>
                      {app.icon}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAppRedirect(app)}
                    >
                      Launch App
                    </Button>
                  </div>
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                  <CardDescription>{app.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Admin Features Section */}
        <section className="mb-12">
          <h3 className="text-xl font-semibold text-foreground mb-6">Administrative Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {adminFeatures.map((feature) => (
              <Card
                key={feature.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleAdminFeature(feature)}
              >
                <CardHeader className="pb-3">
                  <div className={`${feature.color} p-3 rounded-lg w-fit`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-base">{feature.name}</CardTitle>
                  <CardDescription className="text-sm">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h3 className="text-xl font-semibold text-foreground mb-6">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" onClick={() => router.push('/admin/users')}>
              <User className="h-4 w-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/roles')}>
              <Shield className="h-4 w-4 mr-2" />
              Manage Roles
            </Button>
            <Button variant="outline" onClick={() => router.push('/admin/api-keys')}>
              <Key className="h-4 w-4 mr-2" />
              API Keys
            </Button>
            {/* <Button className="bg-white border-white text-gray-900" variant="outline" onClick={() => router.push('/admin/tenants')}>
              <Globe className="h-4 w-4 mr-2" />
              Tenants
            </Button> */}
          </div>
        </section>
      </main>
    </div>
  );
}
