'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Building, 
  Shield, 
  Key, 
  ArrowLeft,
  User,
  Eye,
  EyeOff,
  Copy,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';

interface Tenant {
  id: string;
  name: string;
  subdomain?: string | null;
  createdAt: string | Date | null;
  updatedAt?: string | Date | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  userType: string;
  createdAt: string | Date | null;
  roles?: number[];
}

interface Role {
  id: number;
  name: string;
  description?: string | null;
  permissions: string[];
  userCount: number;
  isSystem?: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  lastUsed?: string | null;
}

interface TenantDetails {
  tenant: Tenant;
  userCount: number;
  roleCount: number;
  apiKeyCount: number;
}

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);

  // State for real data
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Fetch tenant details
  const { data: tenantData, refetch: refetchTenant } = authClient.systemAdmin.getTenant.useQuery({
    queryKey: ['tenant', tenantId],
    queryData: {
      params: {
        id: tenantId,
      },
    },
  });

  // Fetch tenant users
  const { data: usersData, refetch: refetchUsers } = authClient.systemAdmin.getTenantUsers.useQuery({
    queryKey: ['tenant-users', tenantId],
    queryData: {
      params: {
        tenantId,
      },
    },
  });

  // Fetch tenant roles
  const { data: rolesData, refetch: refetchRoles } = authClient.systemAdmin.getTenantRoles.useQuery({
    queryKey: ['tenant-roles', tenantId],
    queryData: {
      params: {
        tenantId,
      },
    },
  });

  // Fetch tenant API keys
  const { data: apiKeysData, refetch: refetchApiKeys } = authClient.systemAdmin.getTenantApiKeys.useQuery({
    queryKey: ['tenant-api-keys', tenantId],
    queryData: {
      params: {
        tenantId,
      },
    },
  });

  // API key mutations
  const createApiKeyMutation = authClient.systemAdmin.createTenantApiKey.useMutation({
    onSuccess: () => {
      toast.success('API key created successfully');
      refetchApiKeys();
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to create API key');
      console.error('Create API key error:', error);
    }
  });

  const deleteApiKeyMutation = authClient.systemAdmin.deleteTenantApiKey.useMutation({
    onSuccess: () => {
      toast.success('API key deleted successfully');
      refetchApiKeys();
    },
    onError: (error: any) => {
      toast.error('Failed to delete API key');
      console.error('Delete API key error:', error);
    }
  });

  // Update state when API data changes
  useEffect(() => {
    if (tenantData?.body) {
      setTenantDetails(tenantData.body);
      setIsLoading(false);
    }
  }, [tenantData]);

  useEffect(() => {
    if (usersData?.body) {
      setUsers(usersData.body.map((item: any) => ({
        ...item.user,
        roles: item.roles.map((r: any) => r.id)
      })));
    }
  }, [usersData]);

  useEffect(() => {
    if (rolesData?.body) {
      setRoles(rolesData.body);
    }
  }, [rolesData]);

  useEffect(() => {
    if (apiKeysData?.body) {
      setApiKeys(apiKeysData.body);
    }
  }, [apiKeysData]);

  // Handle API key creation
  const handleCreateApiKey = () => {
    const name = prompt('Enter API key name:');
    if (!name) return;

    createApiKeyMutation.mutate({
      params: { tenantId },
      body: { name, scopes: [] },
    });
  };

  // Handle API key deletion
  const handleDeleteApiKey = (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    deleteApiKeyMutation.mutate({
      params: { tenantId, keyId }
    });
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600';
      case 'inactive':
        return 'bg-slate-600';
      case 'expired':
        return 'bg-red-600';
      default:
        return 'bg-slate-600';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  // Show error state if no tenant data
  if (!tenantDetails) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Building className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-slate-400">Tenant not found</p>
          <Button 
            onClick={() => router.back()}
            className="mt-4"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const tenant = tenantDetails.tenant;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tenants
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">{tenant.name}</h1>
            <p className="text-slate-300">Manage tenant organization and resources</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge 
            variant="default"
            className="bg-green-600"
          >
            Active
          </Badge>
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Tenant
          </Button>
        </div>
      </div>

      {/* Tenant Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">{tenantDetails.userCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Roles</p>
                <p className="text-2xl font-bold text-white">{tenantDetails.roleCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">API Keys</p>
                <p className="text-2xl font-bold text-white">{tenantDetails.apiKeyCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Subdomain</p>
                <p className="text-lg font-bold text-white">{tenant.subdomain || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different management sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="text-slate-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="users" className="text-slate-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-slate-300 data-[state=active]:bg-green-600 data-[state=active]:text-white">
            Roles
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="text-slate-300 data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            API Keys
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Tenant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-400">Name</label>
                  <p className="text-white">{tenant.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Subdomain</label>
                  <p className="text-white">{tenant.subdomain || 'Not configured'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Status</label>
                  <Badge className="bg-green-600">
                    Active
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">Created</label>
                  <p className="text-white">
                    {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">User Management</h2>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Users ({users.length})</CardTitle>
              <CardDescription className="text-slate-400">
                Manage users within this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-300 font-medium">Name</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Email</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Type</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Roles</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Created</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="p-3 text-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <span>{user.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">{user.email}</td>
                        <td className="p-3">
                          <Badge 
                            variant={user.userType === 'admin' ? 'default' : 'secondary'}
                            className={user.userType === 'admin' ? 'bg-purple-600' : 'bg-slate-600'}
                          >
                            {user.userType}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-1">
                            {user.roles?.map((roleId) => {
                              const role = roles.find(r => r.id === roleId);
                              return role ? (
                                <Badge key={roleId} variant="outline" className="border-slate-600 text-slate-300">
                                  {role.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-slate-400 text-sm">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {users.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No users found in this tenant</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Role Management</h2>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </div>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Roles ({roles.length})</CardTitle>
              <CardDescription className="text-slate-400">
                Manage roles and permissions within this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-300 font-medium">Role</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Description</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Permissions</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Users</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="p-3 text-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                              <Shield className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-slate-300 max-w-xs">
                          {role.description || 'No description'}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {role.permissions.slice(0, 3).map((permission) => (
                              <Badge key={permission} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-slate-300">{role.userCount}</td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-600 text-blue-400 hover:bg-blue-900"
                            >
                              <Shield className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {roles.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No roles found in this tenant</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">API Key Management</h2>
            <Button 
              onClick={handleCreateApiKey}
              disabled={createApiKeyMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createApiKeyMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {createApiKeyMutation.isPending ? 'Creating...' : 'Generate API Key'}
            </Button>
          </div>

          <Card className="border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">API Keys ({apiKeys.length})</CardTitle>
              <CardDescription className="text-slate-400">
                Manage API keys for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-300 font-medium">Name</th>
                      <th className="text-left p-3 text-slate-300 font-medium">API Key</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Status</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Created</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Last Used</th>
                      <th className="text-left p-3 text-slate-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.map((apiKey) => (
                      <tr key={apiKey.id} className="border-b border-slate-700 hover:bg-slate-700">
                        <td className="p-3 text-white">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center">
                              <Key className="h-4 w-4 text-white" />
                            </div>
                            <span>{apiKey.name}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <code className="text-sm bg-slate-700 px-2 py-1 rounded text-slate-300">
                              {showKeys[apiKey.id] ? apiKey.key : '••••••••••••••••'}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleKeyVisibility(apiKey.id)}
                              className="text-slate-400 hover:text-white"
                            >
                              {showKeys[apiKey.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(apiKey.key)}
                              className="text-slate-400 hover:text-white"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge 
                            variant="default"
                            className={apiKey.isActive ? 'bg-green-600' : 'bg-slate-600'}
                          >
                            {apiKey.isActive ? 'active' : 'inactive'}
                          </Badge>
                        </td>
                        <td className="p-3 text-slate-400 text-sm">
                          {new Date(apiKey.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 text-slate-400 text-sm">
                          {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="p-3">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteApiKey(apiKey.id)}
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {apiKeys.length === 0 && (
                  <div className="text-center py-8">
                    <Key className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No API keys found for this tenant</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
