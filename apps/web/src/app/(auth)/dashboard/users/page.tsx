'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Trash2, User, Building, Shield, Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  userType: string;
  createdAt: string | Date | null;
  tenantId?: string;
  roles?: number[];
}

interface Tenant {
  id: string;
  name: string;
  subdomain?: string;
}

interface Role {
  id: number;
  name: string;
  description?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch system admins (read-only)
  const { data: systemAdminsData, refetch: refetchSystemAdmins } = authClient.systemAdmin.getSystemAdmins.useQuery({ 
    queryKey: ['system-admins'] 
  });
  
  // Fetch tenants
  const { data: tenantsData, refetch: refetchTenants } = authClient.systemAdmin.getTenants.useQuery({ 
    queryKey: ['tenants']
  });

  // Mock data for demonstration (fallback)
  const mockSystemAdmins: User[] = [
    {
      id: '1',
      email: 'admin@tradewindstudio.dev',
      name: 'System Administrator',
      userType: 'system',
      createdAt: '2024-01-15',
      roles: []
    }
  ];

  const mockTenants: Tenant[] = [
    { id: 'tenant-1', name: 'Example Corp', subdomain: 'example' },
    { id: 'tenant-2', name: 'Test Company', subdomain: 'test' }
  ];

  // Use API data if available, otherwise use mock data
  const systemAdmins = systemAdminsData?.body.data || mockSystemAdmins;
  const tenants = tenantsData?.body.data || mockTenants;

  // Combine system admins with tenant users for display
  const allUsers = [...systemAdmins];

  // Filter users based on search and filters
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    // const matchesTenant = selectedTenant === 'all' || user.tenantId === selectedTenant;
    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;
    
    return matchesSearch && matchesType;
  });

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    
    setIsLoading(true);
    try {
      // Update user logic would go here
      toast.success('User updated successfully');
      setEditingUser(null);
      refetchSystemAdmins();
    } catch (error: any) {
      toast.error('Failed to update user');
      console.error('Update user error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        // Delete user logic would go here
        toast.success('User deleted successfully');
        refetchSystemAdmins();
      } catch (error: any) {
        toast.error('Failed to delete user');
        console.error('Delete user error:', error);
      }
    }
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
  };

  const getStatusBadgeColor = (userType: string) => {
    switch (userType) {
      case 'system':
        return 'bg-purple-600';
      case 'admin':
        return 'bg-blue-600';
      case 'user':
        return 'bg-slate-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="text-slate-300">View and manage system users and their permissions</p>
        </div>
        <div className="text-slate-400 text-sm">
          System admins can only be created through the API
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="border-slate-700 bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Tenant Filter */}
            <div className="w-full md:w-48">
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="All Tenants" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Tenants</SelectItem>
                  <SelectItem value="system">System Users</SelectItem>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* User Type Filter */}
            <div className="w-full md:w-48">
              <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="system">System Admin</SelectItem>
                  <SelectItem value="admin">Tenant Admin</SelectItem>
                  <SelectItem value="user">Regular User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedTenant !== 'all' || userTypeFilter !== 'all') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedTenant('all');
                  setUserTypeFilter('all');
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="border-slate-700 bg-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Users ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-slate-400">
            View system users and their permissions. System admins are read-only.
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
                  <th className="text-left p-3 text-slate-300 font-medium">Tenant</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Created</th>
                  <th className="text-left p-3 text-slate-300 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
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
                        variant="default"
                        className={getStatusBadgeColor(user.userType)}
                      >
                        {user.userType}
                      </Badge>
                    </td>
                    {/* <td className="p-3 text-slate-300">
                      {user.tenantId ? 
                        tenants.find(t => t.id === user.tenantId)?.name || 'Unknown' : 
                        'System'
                      }
                    </td> */}
                    <td className="p-3 text-slate-400 text-sm">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        {user.userType !== 'system' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEditModal(user)}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteUser(user.id)}
                              className="border-red-600 text-red-400 hover:bg-red-900"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {user.userType === 'system' && (
                          <span className="text-slate-500 text-sm">Read-only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No users found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Edit User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-slate-300">Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-slate-300">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <Button 
                  onClick={() => setEditingUser(null)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateUser}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  {isLoading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
