'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Users, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { TENANT_ROLES_QUERY_KEY, TENANT_USERS_QUERY_KEY } from '@/lib/api/queryKeys';

interface TenantUsersProps {
  tenantId: string;
}

export function TenantUsers({ tenantId }: TenantUsersProps) {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    password: '',
    userType: 'user' as 'user' | 'admin',
    roleIds: [] as number[]
  });

  // Fetch users data
  const { data: usersData , isLoading: usersLoading, refetch: refetchUsers } = authClient.systemAdmin.getTenantUsers.useQuery({
    queryData: { params: { tenantId } },
    queryKey: [...TENANT_USERS_QUERY_KEY, tenantId]
  });

  const users = usersData?.body || [];

  // Fetch roles data
  const { data: rolesData , isLoading: rolesLoading, refetch: refetchRoles } = authClient.systemAdmin.getTenantRoles.useQuery({
    queryData: { params: { tenantId } },
    queryKey: [...TENANT_ROLES_QUERY_KEY, tenantId]
  });

  const roles = rolesData?.body || [];


  const createUserMutation = authClient.systemAdmin.createUserForTenant.useMutation({
    onSuccess: () => {
      toast.success('User added successfully');
      refetchUsers();
      setShowAddUserModal(false);
      setNewUser({ email: '', name: '', userType: 'user', roleIds: [], password: '' });
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to add user');
      console.error('Add user error:', error);
    }
  });

  const handleAddUser = () => {
    if (!newUser.email || !newUser.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    createUserMutation.mutate({
      body: {
        roleIds: newUser.roleIds,
        name: newUser.name,
        email: newUser.email,
        password: newUser.password
      },
      params: { tenantId }
    });
  };

  const toggleUserRole = (roleId: number) => {
    setNewUser(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  // Add new state for editing user roles
  const [editUserRoles, setEditUserRoles] = useState({
    userId: '',
    roleIds: [] as number[]
  });

  // Add mutation for removing user from tenant
  // const removeUserMutation = authClient.systemAdmin.removeUserFromTenant.useMutation({
  //   onSuccess: () => {
  //     toast.success('User removed successfully');
  //     refetchUsers();
  //   },
  //   onError: (error: any) => {
  //     toast.error(error?.body?.message || 'Failed to remove user');
  //     console.error('Remove user error:', error);
  //   }
  // });

  // Add mutation for updating user roles (remove and re-assign)
  const updateUserRolesMutation = authClient.systemAdmin.updateUserRoles.useMutation({
    onSuccess: () => {
      toast.success('User roles updated successfully');
      refetchUsers();
      setShowEditUserModal(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to update user roles');
      console.error('Update user roles error:', error);
    }
  });

  const handleUpdateUserRoles = () => {
    if (!editingUser) return;

    updateUserRolesMutation.mutate({
      params: { tenantId, userId: editingUser.user.id },
      body: {
        roleIds: editUserRoles.roleIds,
        isAdmin: editingUser.isAdmin
      }
    });
  };

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditUserRoles({
      userId: user.user.id,
      roleIds: user.roles?.map((role: any) => role.id) || []
    });
    setShowEditUserModal(true);
  };

  // const handleUpdateUserRoles = async () => {
  //   if (!editingUser) return;

  //   try {
  //     // First remove user from tenant
  //     await removeUserMutation.mutateAsync({
  //       params: { tenantId, userId: editingUser.user.id }
  //     });

  //     // Then re-assign with new roles
  //     await updateUserRolesMutation.mutateAsync({
  //       params: { tenantId },
  //       body: {
  //         userId: editingUser.user.id,
  //         roleIds: editUserRoles.roleIds,
  //         isAdmin: editingUser.isAdmin
  //       }
  //     });
  //   } catch (error) {
  //     console.error('Error updating user roles:', error);
  //   }
  // };

  // const handleRemoveUser = (userId: string) => {
  //   if (confirm('Are you sure you want to remove this user from the tenant?')) {
  //     removeUserMutation.mutate({
  //       params: { tenantId, userId }
  //     });
  //   }
  // };

  const toggleEditUserRole = (roleId: number) => {
    setEditUserRoles(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  if (usersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">User Management</h2>
        </div>
        <Card className="border-border bg-card">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Add a new user to this tenant with specific roles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user-name" className="text-card-foreground">Full Name *</Label>
                  <Input
                    id="user-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-card border-border text-white"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="user-email" className="text-card-foreground">Email Address *</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-card border-border text-white"
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-card-foreground">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="bg-card border-border text-white"
                    placeholder="Enter password"
                  />
              </div>
              <div>
                <Label htmlFor="user-type" className="text-card-foreground">User Type</Label>
                <Select value={newUser.userType} onValueChange={(value: 'user' | 'admin') => setNewUser(prev => ({ ...prev, userType: value }))}>
                  <SelectTrigger className="bg-card border-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-card-foreground">Roles</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={newUser.roleIds.includes(role.id)}
                        onCheckedChange={() => toggleUserRole(role.id)}
                        className="border-border"
                      />
                      <Label htmlFor={`role-${role.id}`} className="text-card-foreground text-sm">
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
                className="border-border text-card-foreground hover:bg-card"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={createUserMutation.isPending}
                className="bg-primary hover:bg-primary"
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

      {/* Add Edit User Modal */}
      <Dialog open={showEditUserModal} onOpenChange={setShowEditUserModal}>
        <DialogContent className="bg-card border-border text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User Roles</DialogTitle>
            <DialogDescription>
              Update roles for {editingUser?.user?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-card-foreground">Roles</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                {roles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-role-${role.id}`}
                      checked={editUserRoles.roleIds.includes(role.id)}
                      onCheckedChange={() => toggleEditUserRole(role.id)}
                      className="border-border"
                    />
                    <Label htmlFor={`edit-role-${role.id}`} className="text-card-foreground text-sm">
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
              onClick={() => setShowEditUserModal(false)}
              className="border-border text-card-foreground hover:bg-card"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUserRoles}
              disabled={updateUserRolesMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              {updateUserRolesMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              {updateUserRolesMutation.isPending ? 'Updating...' : 'Update Roles'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-white">Users ({users.length})</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage users within this tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-card-foreground font-medium">User</th>
                  <th className="text-left p-3 text-card-foreground font-medium">Email</th>
                  <th className="text-left p-3 text-card-foreground font-medium">Type</th>
                  <th className="text-left p-3 text-card-foreground font-medium">Roles</th>
                  <th className="text-left p-3 text-card-foreground font-medium">Joined</th>
                  <th className="text-left p-3 text-card-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user.id} className="border-b border-border hover:bg-card">
                    <td className="p-3 text-white">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                        <span>{user.user.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-card-foreground">{user.user.email}</td>
                    <td className="p-3">
                      <Badge 
                        variant={user.user.userType === 'admin' ? 'default' : 'secondary'}
                        className={user.user.userType === 'admin' ? 'bg-purple-500' : 'bg-muted'}
                      >
                        {user.user.userType}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-1">
                        {user.roles?.map((role_) => {
                          const role = roles.find(r => r.id === role_.id);
                          return role ? (
                            <Badge key={role_.id} variant="outline" className="border-border text-card-foreground">
                              {role.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground text-sm">
                      {user.user.createdAt ? new Date(user.user.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditUser(user)}
                          className="border-border text-card-foreground hover:bg-card"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          // onClick={() => handleRemoveUser(user.user.id)}
                          className="border-destructive text-destructive hover:bg-destructive/90"
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
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users found in this tenant</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}