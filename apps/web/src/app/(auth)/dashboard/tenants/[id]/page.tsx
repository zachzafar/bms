'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { authClient } from '@/lib/api/publicClient';
import { TENANTS_QUERY_KEY } from '@/lib/api/queryKeys';
import { TenantApiKeys } from '@/components/admin/custom/assetComponents/components/TenantApiKeys';
import AssetConfig from '@/components/admin/custom/assetComponents/components/TenantAssetConfig';
import TenantAssets from '@/components/admin/custom/assetComponents/components/TenantAssets';
import { TenantOverview } from '@/components/admin/custom/assetComponents/components/TenantOverview';
import { TenantRoles } from '@/components/admin/custom/assetComponents/components/TenantRoles';
import { TenantUsers } from '@/components/admin/custom/assetComponents/components/TenantUsers';

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');

  // Only fetch basic tenant info for the header
  const { data: tenantData, isLoading: tenantLoading, error: tenantError } = authClient.systemAdmin.getTenant.useQuery({
    queryData: { params: {id: tenantId} },
    queryKey: [...TENANTS_QUERY_KEY, tenantId]
  });

  const tenant = tenantData?.body

  if (tenantLoading) {
    return (
      <div className="min-h-screen bg-card p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen bg-card p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Tenant Not Found</h1>
            <p className="text-muted-foreground mb-6">The tenant you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/dashboard/tenants">
              <Button className="bg-primary hover:bg-primary/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tenants
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin/tenants">
              <Button variant="outline" size="sm" className="text-card-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{tenant.tenant.name}</h1>
              <p className="text-muted-foreground">Tenant ID: {tenant.tenant.id}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Link href={`/dashboard/tenants/${tenantId}/settings`}>
              <Button variant="outline" className="text-card-foreground">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            {/* <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Tenant
            </Button> */}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border-border">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
              Users
            </TabsTrigger>
            <TabsTrigger value="roles" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
              Roles
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
              API Keys
            </TabsTrigger>
            <TabsTrigger value="asset-config" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
              Asset Config
            </TabsTrigger>
            <TabsTrigger value="assets" className="data-[state=active]:bg-primary data-[state=active]:text-foreground">
              Assets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TenantOverview tenantId={tenantId} />
          </TabsContent>

          <TabsContent value="users">
            <TenantUsers tenantId={tenantId} />
          </TabsContent>

          <TabsContent value="roles">
            <TenantRoles tenantId={tenantId} />
          </TabsContent>

          <TabsContent value="api-keys">
            <TenantApiKeys tenantId={tenantId} />
          </TabsContent>
          <TabsContent value="asset-config">
            <AssetConfig tenantId={tenantId} />
          </TabsContent>
          <TabsContent value="assets">
            <TenantAssets tenantId={tenantId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}