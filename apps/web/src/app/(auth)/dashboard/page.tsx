"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building, 
  Shield, 
  Key,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { authClient } from '@/lib/api/publicClient';


export default function DashboardPage() {

  const { data: stats, isLoading, error } = authClient.systemAdmin.getSystemStats.useQuery({
    queryKey: ['system-stats'],
  });

  const quickActions = [
    {
      title: 'Create New Admin',
      description: 'Add a new system administrator',
      icon: Shield,
      href: '/dashboard/users',
      color: 'bg-primary',
      action: 'Create Admin'
    },
    {
      title: 'Create New Tenant',
      description: 'Set up a new tenant with admin user',
      icon: Building,
      href: '/dashboard/tenants',
      color: 'bg-primary',
      action: 'Create Tenant'
    },
    {
      title: 'Manage Roles',
      description: 'Create and manage user roles',
      icon: Users,
      href: '/dashboard/tenants',
      color: 'bg-primary',
      action: 'Manage Roles'
    },
    {
      title: 'API Keys',
      description: 'Generate and manage API keys',
      icon: Key,
      href: '/dashboard/tenants',
      color: 'bg-primary',
      action: 'Manage Keys'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Failed to load dashboard data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const statsData = stats?.body;


  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">System Administration Dashboard</h1>
        <p className="text-card-foreground text-lg">
          Manage your system, tenants, users, and configurations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Tenants</CardTitle>
            <Building className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statsData?.totalTenants || 0}</div>
            <p className="text-xs text-muted-foreground">
              {statsData?.activeTenants || 0} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statsData?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">System Admins</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statsData?.totalSystemAdmins || 0}</div>
            <p className="text-xs text-muted-foreground">
              System administrators
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">API Keys</CardTitle>
            <Key className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{statsData?.totalApiKeys || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active API keys
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-foreground">{action.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={action.href}>
                    <Button
                      variant="outline"
                      className="w-full text-card-foreground hover:text-foreground"
                    >
                      {action.action}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Recent Activity</h2>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">System Overview</CardTitle>
            <CardDescription className="text-muted-foreground">
              Recent system activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-card-foreground">System running normally</span>
                </div>
                <span className="text-sm text-muted-foreground">Just now</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-card-foreground">Dashboard data refreshed</span>
                </div>
                <span className="text-sm text-muted-foreground">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-card-foreground">Authentication system active</span>
                </div>
                <span className="text-sm text-muted-foreground">5 minutes ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
