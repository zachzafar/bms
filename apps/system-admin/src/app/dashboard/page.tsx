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
      color: 'bg-purple-600',
      action: 'Create Admin'
    },
    {
      title: 'Create New Tenant',
      description: 'Set up a new tenant with admin user',
      icon: Building,
      href: '/dashboard/tenants',
      color: 'bg-blue-600',
      action: 'Create Tenant'
    },
    {
      title: 'Manage Roles',
      description: 'Create and manage user roles',
      icon: Users,
      href: '/dashboard/tenants',
      color: 'bg-green-600',
      action: 'Manage Roles'
    },
    {
      title: 'API Keys',
      description: 'Generate and manage API keys',
      icon: Key,
      href: '/dashboard/tenants',
      color: 'bg-orange-600',
      action: 'Manage Keys'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Failed to load dashboard data</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const statsData = stats?.body;


  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">System Administration Dashboard</h1>
        <p className="text-slate-300 text-lg">
          Manage your system, tenants, users, and configurations
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Tenants</CardTitle>
            <Building className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{statsData?.totalTenants || 0}</div>
            <p className="text-xs text-slate-400">
              {statsData?.activeTenants || 0} active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{statsData?.totalUsers || 0}</div>
            <p className="text-xs text-slate-400">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">System Admins</CardTitle>
            <Shield className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{statsData?.totalSystemAdmins || 0}</div>
            <p className="text-xs text-slate-400">
              System administrators
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">API Keys</CardTitle>
            <Key className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{statsData?.totalApiKeys || 0}</div>
            <p className="text-xs text-slate-400">
              Active API keys
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card key={index} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                <CardHeader>
                  <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-white">{action.title}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={action.href}>
                    <Button 
                      variant="outline" 
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
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
        <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">System Overview</CardTitle>
            <CardDescription className="text-slate-400">
              Recent system activities and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-slate-300">System running normally</span>
                </div>
                <span className="text-sm text-slate-400">Just now</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-slate-300">Dashboard data refreshed</span>
                </div>
                <span className="text-sm text-slate-400">2 minutes ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-slate-300">Authentication system active</span>
                </div>
                <span className="text-sm text-slate-400">5 minutes ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
