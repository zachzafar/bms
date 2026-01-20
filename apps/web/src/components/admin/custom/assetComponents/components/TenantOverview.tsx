'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Key } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { TENANTS_QUERY_KEY } from '@/lib/api/queryKeys';



export function TenantOverview({tenantId}: {tenantId: string}) {
  const { data: tenantData, isLoading: tenantLoading, error: tenantError } = authClient.systemAdmin.getTenant.useQuery({
    queryData: { params: {id: tenantId} },
    queryKey: [...TENANTS_QUERY_KEY, tenantId]
  });

  const tenantDetails = tenantData?.body;


  if (tenantLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border bg-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!tenantDetails) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Unable to load tenant details</p>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: tenantDetails.userCount,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary'
    },
    {
      title: 'Roles',
      value: tenantDetails.roleCount,
      icon: Shield,
      color: 'text-green-500',
      bgColor: 'bg-green-500'
    },
    {
      title: 'API Keys',
      value: tenantDetails.apiKeyCount,
      icon: Key,
      color: 'text-orange-400',
      bgColor: 'bg-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Overview</h2>
        <p className="text-muted-foreground">
          Tenant created on {tenantDetails.tenant.createdAt ? new Date(tenantDetails.tenant.createdAt).toLocaleDateString() : 'Unknown'}
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-card-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`w-8 h-8 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}