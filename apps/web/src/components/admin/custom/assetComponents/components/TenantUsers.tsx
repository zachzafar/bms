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
import { Plus, Edit, UserMinus, Users, User, Loader2, Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { TENANT_ROLES_QUERY_KEY, TENANT_USERS_QUERY_KEY } from '@/lib/api/queryKeys';
import { formatDisplayDate } from '@/lib/utils/date';

interface TenantUsersProps {
  tenantId: string;
}

export function TenantUsers({ tenantId }: TenantUsersProps) {
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showAssignUserModal, setShowAssignUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  // const [searchEmail, setSearchEmail] = useState('');
  const [selectedUserToAssign, setSelectedUserToAssign] = useState<any>(null);
  const [assignUserRoles, setAssignUserRoles] = useState<number[]>([]);
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

  // Search users for assignment
  // const { data: searchUsersData, refetch: refetchSearchUsers } = authClient.systemAdmin.searchUsers.useQuery({
  //   queryData: { query: { email: searchEmail, tenantId } },
  //   queryKey: ['search-users', searchEmail, tenantId],
  //   enabled: searchEmail.length >= 2,
  // });

  // const searchedUsers = searchUsersData?.body?.data || [];

  // // Assign existing user mutation
  // const assignUserMutation = authClient.systemAdmin.assignUserToTenant.useMutation({
  //   onSuccess: () => {
  //     toast.success('User assigned to tenant successfully');
  //     refetchUsers();
  //     setShowAssignUserModal(false);
  //     setSelectedUserToAssign(null);
  //     setAssignUserRoles([]);
  //     setSearchEmail('');
  //   },
  //   onError: (error: any) => {
  //     toast.error(error?.body?.message || 'Failed to assign user');
  //     console.error('Assign user error:', error);
  //   }
  // });

  const createUserMutation = authClient.systemAdmin.createUserForTenant.useMutation({
    onSuccess: (data) => {
      toast.success(data.body.message || 'User added to tenant successfully');
      refetchUsers();
      setShowAddUserModal(false);
      setNewUser({ email: '', name: '', userType: 'user', roleIds: [], password: '' });
    },
    onError: (error: any) => {
      const message = error?.body?.message || 'Failed to add user';
      if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('already assigned')) {
        toast.error('This user is already assigned to this tenant');
      } else {
        toast.error(message);
      }
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

  // Add mutation for unassigning user from tenant
  const removeUserMutation = authClient.systemAdmin.removeUserFromTenant.useMutation({
    onSuccess: () => {
      toast.success('User unassigned from tenant successfully');
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to unassign user');
      console.error('Unassign user error:', error);
    }
  });

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

  const handleRemoveUser = (userId: string) => {
    if (confirm('Are you sure you want to unassign this user from the tenant? The user account will not be deleted.')) {
      removeUserMutation.mutate({
        params: { tenantId, userId },
        body: undefined
      });
    }
  };

  const toggleEditUserRole = (roleId: number) => {
    setEditUserRoles(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  const toggleAssignUserRole = (roleId: number) => {
    setAssignUserRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    );
  };

  // const handleAssignUser = () => {
  //   if (!selectedUserToAssign) {
  //     toast.error('Please select a user to assign');
  //     return;
  //   }

  //   assignUserMutation.mutate({
  //     params: { tenantId },
  //     body: {
  //       userId: selectedUserToAssign.id,
  //       roleIds: assignUserRoles,
  //       isAdmin: false,
  //     }
  //   });
  // };

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
        <div className="flex gap-2">
          {/* <Dialog open={showAssignUserModal} onOpenChange={(open) => {
            setShowAssignUserModal(open);
            if (!open) {
              setSearchEmail('');
              setSelectedUserToAssign(null);
              setAssignUserRoles([]);
            }
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border text-card-foreground hover:bg-card">
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Existing User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Existing User</DialogTitle>
                <DialogDescription>
                  Search for an existing user by email and assign them to this tenant.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="search-email" className="text-card-foreground">Search by Email</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="bg-card border-border text-white pl-8"
                      placeholder="Enter email to search..."
                    />
                  </div>
                </div>

                {searchEmail.length >= 2 && (
                  <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                    {searchedUsers.length > 0 ? (
                      searchedUsers.map((user) => (
                        <div
                          key={user.id}
                          className={`p-3 cursor-pointer hover:bg-muted ${
                            selectedUserToAssign?.id === user.id ? 'bg-muted' : ''
                          }`}
                          onClick={() => setSelectedUserToAssign(user)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{user.name}</p>
                              <p className="text-muted-foreground text-sm">{user.email}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No users found matching this email
                      </div>
                    )}
                  </div>
                )}

                {selectedUserToAssign && (
                  <div className="border border-primary rounded-lg p-3 bg-primary/10">
                    <p className="text-sm text-muted-foreground mb-1">Selected user:</p>
                    <p className="text-white font-medium">{selectedUserToAssign.name} ({selectedUserToAssign.email})</p>
                  </div>
                )}

                {selectedUserToAssign && (
                  <div>
                    <Label className="text-card-foreground">Assign Roles</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                      {roles.map((role) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`assign-role-${role.id}`}
                            checked={assignUserRoles.includes(role.id)}
                            onCheckedChange={() => toggleAssignUserRole(role.id)}
                            className="border-border"
                          />
                          <Label htmlFor={`assign-role-${role.id}`} className="text-card-foreground text-sm">
                            {role.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAssignUserModal(false)}
                  className="border-border text-card-foreground hover:bg-card"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAssignUser}
                  disabled={assignUserMutation.isPending || !selectedUserToAssign}
                  className="bg-primary hover:bg-primary"
                >
                  {assignUserMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  {assignUserMutation.isPending ? 'Assigning...' : 'Assign User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog> */}

          <Dialog open={showAddUserModal} onOpenChange={setShowAddUserModal}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create New User
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
                      {user.user.createdAt ? formatDisplayDate(user.user.createdAt) : 'N/A'}
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
                          onClick={() => handleRemoveUser(user.user.id)}
                          disabled={removeUserMutation.isPending}
                          className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                          title="Unassign from tenant"
                        >
                          <UserMinus className="h-3 w-3" />
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