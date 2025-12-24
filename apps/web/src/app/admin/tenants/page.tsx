"use client"

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  Users, 
  Eye,
  MoreHorizontal,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';


export default function TenantsPage() {
  const { data: statsData, isLoading: isLoadingStats } = authClient.systemAdmin.getSystemStats.useQuery({
    queryKey: ['system-stats'],
  });

  const { data: tenantData, isLoading: isLoadingTenants } = authClient.systemAdmin.getTenants.useQuery({
    queryKey: ['tenants'],
  });


  const stats = statsData?.body;
  const tenants = tenantData?.body;

  // const [tenants] = useState(mockTenants);



  const handleEditTenant = (tenantId: string) => {
    // TODO: Implement edit tenant modal
    toast.info('Edit tenant functionality coming soon');
  };

  const handleDeleteTenant = (tenantId: string) => {
    // TODO: Implement delete tenant confirmation
    toast.info('Delete tenant functionality coming soon');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoadingStats || isLoadingTenants || !tenants || !stats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Tenant Management</h1>
          <p className="text-slate-300">Manage tenant organizations and their configurations</p>
        </div>
        <CreateTenantModal />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Tenants</CardTitle>
            <Building className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
       {/* <div className="text-2xl font-bold text-white">{stats?.totalTenants || tenants.length}</div> */}
            {/* <p className="text-xs text-slate-400">
              {tenants.filter(t => t.status === 'active').length} active
            </p> */}
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Users</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalUsers}
            </div>
            <p className="text-xs text-slate-400">
              Across all tenants
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">API Keys</CardTitle>
            <Building className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stats.totalApiKeys}
            </div>
            <p className="text-xs text-slate-400">
              Active API keys
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tenants Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Tenants</CardTitle>
          <CardDescription className="text-slate-400">
            Manage tenant organizations and their settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left p-3 text-slate-300 font-medium">Name</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Subdomain</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Status</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Users</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Roles</th>
                  <th className="text-left p-3 text-slate-300 font-medium">API Keys</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Created</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants ? tenants.map((tenant) => (
                  <TenantRow id={tenant.id} />
                )): null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader>
            <CardTitle className="text-white">Create New Tenant</CardTitle>
            <CardDescription className="text-slate-400">
              Set up a new tenant organization with admin user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateTenantModal />
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader>
            <CardTitle className="text-white">Bulk Operations</CardTitle>
            <CardDescription className="text-slate-400">
              Perform operations on multiple tenants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <MoreHorizontal className="mr-2 h-4 w-4" />
              Bulk Actions
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
          <CardHeader>
            <CardTitle className="text-white">Export Data</CardTitle>
            <CardDescription className="text-slate-400">
              Export tenant information and reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Building className="mr-2 h-4 w-4" />
              Export Tenants
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function TenantRow({id}:{id: string}) {
  const { data: tenantData } = authClient.systemAdmin.getTenant.useQuery({
    queryKey: ['tenant', id],
    queryData: {
      params: {
        id,
      },
    },
  });

  const tenant = tenantData?.body

  if (!tenant) {
    return null;
  }

  return (
    <tr key={tenant.tenant.id} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <Building className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{tenant.tenant.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-slate-300">{tenant.tenant.subdomain}</td>
                    <td className="p-3">
                      {/* <Badge 
                        className={`${getStatusColor(tenant.status)} text-white`}
                      >
                        {tenant.status}
                      </Badge> */}
                    </td>
                    <td className="p-3 text-slate-300">{tenant.userCount}</td>
                    <td className="p-3 text-slate-300">{tenant.roleCount}</td>
                    <td className="p-3 text-slate-300">{tenant.apiKeyCount}</td>
                    <td className="p-3 text-slate-300">{tenant.tenant.createdAt}</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <Link href={`/dashboard/tenants/${tenant.tenant.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTenant(tenant.id)}
                          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button> */}
                        {/* <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTenant(tenant.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button> */}
                      </div>
                    </td>
                  </tr>
  );
}


// Validation schema for creating a tenant
const createTenantSchema = z.object({
  tenant: z.object({
    name: z.string().min(1, 'Tenant name is required'),
    subdomain: z.string()
      .min(1, 'Subdomain is required')
      .regex(/^[a-z0-9-]+$/, 'Subdomain can only contain lowercase letters, numbers, and hyphens'),
  }),
  adminUser: z.object({
    name: z.string().min(1, 'Admin name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    userType: z.enum(['admin']),
  }),
});

type CreateTenantFormData = z.infer<typeof createTenantSchema>;

// API type to match the backend contract
type CreateTenantApiData = {
  tenant: {
    name: string;
    subdomain: string;
  };
  adminUser: {
    name: string;
    email: string;
    password: string;
    userType: 'admin';
  };
};

function CreateTenantModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = authClient.useQueryClient();

  const { mutate: createTenantMutation, isPending } = authClient.systemAdmin.createTenant.useMutation({
    onSuccess: (response) => {
      toast.success('Tenant created successfully');
      setOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      // Redirect to the new tenant page
      router.push(`/dashboard/tenants/${response.body.tenantId}`);
    },
    onError: (error) => {
      console.error('Create tenant error:', error);
      toast.error('Failed to create tenant');
      form.reset();
    },
  });

  const form = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      tenant: {
        name: '',
        subdomain: '',
      },
      adminUser: {
        name: '',
        email: '',
        password: '',
        userType: 'admin' as const,
      },
    },
  });

  const onSubmit = (data: CreateTenantFormData) => {
    // Construct API data with explicit typing
    const apiData: CreateTenantApiData = {
      tenant: {
        name: data.tenant.name,
        subdomain: data.tenant.subdomain,
      },
      adminUser: {
        name: data.adminUser.name,
        email: data.adminUser.email,
        password: data.adminUser.password,
        userType: 'admin',
      },
    };
    
    createTenantMutation({
      body: apiData as any, // Type assertion to handle API contract mismatch
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Tenant
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Tenant</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set up a new tenant organization with an admin user. This will create a new tenant and an administrative user account.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Tenant Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">
                Tenant Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tenant.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Tenant Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter tenant name" 
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tenant.subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Subdomain</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            placeholder="your-tenant" 
                            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 pr-20"
                            {...field} 
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">
                            .bookos.com
                          </span>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Admin User Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-white border-b border-slate-700 pb-2">
                Admin User Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="adminUser.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Admin Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter admin name" 
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="adminUser.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300">Admin Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="admin@example.com" 
                          className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="adminUser.password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Admin Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password"
                        placeholder="Enter password" 
                        className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
              
              {/* Hidden field for userType */}
              <FormField
                control={form.control}
                name="adminUser.userType"
                render={({ field }) => (
                  <Input type="hidden" {...field} />
                )}
              />
    </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isPending ? 'Creating...' : 'Create Tenant'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}