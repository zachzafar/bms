'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Loader2,
  X
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

// Available permissions for roles
const AVAILABLE_PERMISSIONS = [
  'users:read',
  'users:write',
  'users:delete',
  'roles:read',
  'roles:write',
  'roles:delete',
  'api-keys:read',
  'api-keys:write',
  'api-keys:delete',
  'billing:read',
  'billing:write',
  'settings:read',
  'settings:write',
  'analytics:read',
  'reports:read',
  'reports:write'
];

// Available scopes for API keys
const AVAILABLE_SCOPES = [
  'users:read',
  'users:write',
  'billing:read',
  'billing:write',
  'analytics:read',
  'reports:read',
  'settings:read'
];

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const [activeTab, setActiveTab] = useState('overview');
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showCreateApiKeyModal, setShowCreateApiKeyModal] = useState(false);

  // Form states
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    userType: 'user',
    roleIds: [] as number[]
  });

  const [newApiKey, setNewApiKey] = useState({
    name: '',
    scopes: [] as string[]
  });

  // State for real data
  const [tenantDetails, setTenantDetails] = useState<TenantDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

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

  const { data: permissionsData } = authClient.systemAdmin.getPermissions.useQuery({
    queryKey: ['permissions'],
  });


  // API key mutations
  const createApiKeyMutation = authClient.systemAdmin.createTenantApiKey.useMutation({
    onSuccess: () => {
      toast.success('API key created successfully');
      refetchApiKeys();
      setShowCreateApiKeyModal(false);
      setNewApiKey({ name: '', scopes: [] });
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

  // Role creation mutation (you'll need to implement this endpoint)
  const createRoleMutation = {
    mutate: async (data: any) => {
      // Simulate API call - replace with actual endpoint
      try {
        // const response = await authClient.systemAdmin.createTenantRole.mutate(data);
        toast.success('Role created successfully');
        refetchRoles();
        setShowCreateRoleModal(false);
        setNewRole({ name: '', description: '', permissions: [] });
      } catch (error) {
        toast.error('Failed to create role');
        console.error('Create role error:', error);
      }
    },
    isPending: false
  };

  // User creation mutation (you'll need to implement this endpoint)
  const createUserMutation = {
    mutate: async (data: any) => {
      // Simulate API call - replace with actual endpoint
      try {
        // const response = await authClient.systemAdmin.createTenantUser.mutate(data);
        toast.success('User added successfully');
        refetchUsers();
        setShowAddUserModal(false);
        setNewUser({ email: '', name: '', userType: 'user', roleIds: [] });
      } catch (error) {
        toast.error('Failed to add user');
        console.error('Add user error:', error);
      }
    },
    isPending: false
  };

  // Update state when API data changes
  useEffect(() => {
    if (tenantData?.body) {
      setTenantDetails(tenantData.body);
      setIsLoading(false);
    }
  }, [tenantData]);

  useEffect(() => {
    if (permissionsData?.body) {
      setPermissions(permissionsData.body);
    }
  }, [permissionsData]);

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
    if (!newApiKey.name.trim()) {
      toast.error('Please enter an API key name');
      return;
    }

    createApiKeyMutation.mutate({
      params: { tenantId },
      body: { name: newApiKey.name, scopes: newApiKey.scopes },
    });
  };

  // Handle role creation
  const handleCreateRole = () => {
    if (!newRole.name.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    createRoleMutation.mutate({
      params: { tenantId },
      body: { 
        name: newRole.name, 
        description: newRole.description, 
        permissions: newRole.permissions 
      },
    });
  };

  // Handle user creation
  const handleCreateUser = () => {
    if (!newUser.email.trim() || !newUser.name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    createUserMutation.mutate({
      params: { tenantId },
      body: { 
        email: newUser.email, 
        name: newUser.name, 
        userType: newUser.userType,
        roleIds: newUser.roleIds
      },
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

  // Permission toggle helper
  const togglePermission = (permission: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Scope toggle helper
  const toggleScope = (scope: string) => {
    setNewApiKey(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope]
    }));
  };

  // Role toggle helper
  const toggleRole = (roleId: number) => {
    setNewUser(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
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
            <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Add a new user to this tenant organization.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="user-name" className="text-slate-300">Name *</Label>
                    <Input
                      id="user-name"
                      value={newUser.name}
                      onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter user's full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-email" className="text-slate-300">Email *</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter user's email address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-type" className="text-slate-300">User Type</Label>
                    <Select value={newUser.userType} onValueChange={(value) => setNewUser(prev => ({ ...prev, userType: value }))}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-slate-300">Roles</Label>
                    <div className="space-y-2 mt-2">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`role-${role.id}`}
                            checked={newUser.roleIds.includes(role.id)}
                            onCheckedChange={() => toggleRole(role.id)}
                            className="border-slate-600"
                          />
                          <Label htmlFor={`role-${role.id}`} className="text-slate-300 text-sm">
                            {role.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddUserModal(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={createUserMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {createUserMutation.isPending ? 'Adding...' : 'Add User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            <Dialog open={showCreateRoleModal} onOpenChange={setShowCreateRoleModal}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Role
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Role</DialogTitle>
                  <DialogDescription>
                    Create a new role with specific permissions for this tenant.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="role-name" className="text-slate-300">Role Name *</Label>
                    <Input
                      id="role-name"
                      value={newRole.name}
                      onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter role name (e.g., Editor, Viewer)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-description" className="text-slate-300">Description</Label>
                    <Textarea
                      id="role-description"
                      value={newRole.description}
                      onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Describe what this role can do"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Permissions</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-60 overflow-y-auto">
                      {permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={`perm-${permission}`}
                            checked={newRole.permissions.includes(permission)}
                            onCheckedChange={() => togglePermission(permission)}
                            className="border-slate-600"
                          />
                          <Label htmlFor={`perm-${permission}`} className="text-slate-300 text-sm">
                            {permission}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateRoleModal(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateRole}
                    disabled={createRoleMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {createRoleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
            <Dialog open={showCreateApiKeyModal} onOpenChange={setShowCreateApiKeyModal}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate API Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Generate New API Key</DialogTitle>
                  <DialogDescription>
                    Create a new API key with specific scopes for this tenant.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key-name" className="text-slate-300">API Key Name *</Label>
                    <Input
                      id="api-key-name"
                      value={newApiKey.name}
                      onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Enter a descriptive name for this API key"
                    />
                  </div>
                  <div>
                    <Label className="text-slate-300">Scopes</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {AVAILABLE_SCOPES.map((scope) => (
                        <div key={scope} className="flex items-center space-x-2">
                          <Checkbox
                            id={`scope-${scope}`}
                            checked={newApiKey.scopes.includes(scope)}
                            onCheckedChange={() => toggleScope(scope)}
                            className="border-slate-600"
                          />
                          <Label htmlFor={`scope-${scope}`} className="text-slate-300 text-sm">
                            {scope}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateApiKeyModal(false)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </Button>
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
                    {createApiKeyMutation.isPending ? 'Generating...' : 'Generate API Key'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                      <th className="text-left p-3 text-slate-300 font-medium">Scopes</th>
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
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {apiKey.scopes.slice(0, 2).map((scope) => (
                              <Badge key={scope} variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                {scope}
                              </Badge>
                            ))}
                            {apiKey.scopes.length > 2 && (
                              <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs">
                                +{apiKey.scopes.length - 2} more
                              </Badge>
                            )}
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
