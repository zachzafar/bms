'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { TENANTS_QUERY_KEY } from '@/lib/api/queryKeys';

interface TenantRolesProps {
  tenantId: string;
}

export function TenantRoles({ tenantId }: TenantRolesProps) {
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Fetch roles data
  const { data: rolesData , isLoading: rolesLoading, refetch: refetchRoles } = authClient.systemAdmin.getTenantRoles.useQuery({
    queryData: { params: { tenantId } },
    queryKey: [...TENANTS_QUERY_KEY, tenantId, 'roles']
  });

  const roles = rolesData?.body || [];

  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const { data: permissionsData, isLoading: permissionsLoading } = authClient.systemAdmin.getPermissions.useQuery({
    queryKey: ['permissions']
  });

  const permissions = permissionsData?.body || [];

  const createRoleMutation = authClient.systemAdmin.createTenantRole.useMutation({
    onSuccess: () => {
      toast.success('Role created successfully');
      refetchRoles();
      setShowCreateRoleModal(false);
      setNewRole({ name: '', description: '', permissions: [] });
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to create role');
      console.error('Create role error:', error);
    }
  });

  const handleCreateRole = () => {
    if (!newRole.name) {
      toast.error('Please enter a role name');
      return;
    }

    createRoleMutation.mutate({
      params: { tenantId },
      body: {
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions
      }
    });
  };

  const togglePermission = (permission: string) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  // Add state for editing role
  const [editRole, setEditRole] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  // Add mutation for updating role
  const updateRoleMutation = authClient.systemAdmin.updateTenantRole.useMutation({
    onSuccess: () => {
      toast.success('Role updated successfully');
      refetchRoles();
      setShowEditRoleModal(false);
      setEditingRole(null);
    },
    onError: (error: any) => {
      toast.error(error?.body?.message || 'Failed to update role');
      console.error('Update role error:', error);
    }
  });

  // Add mutation for deleting role
  // const deleteRoleMutation = authClient.systemAdmin.deleteTenantRole.useMutation({
  //   onSuccess: () => {
  //     toast.success('Role deleted successfully');
  //     refetchRoles();
  //   },
  //   onError: (error: any) => {
  //     toast.error(error?.body?.message || 'Failed to delete role');
  //     console.error('Delete role error:', error);
  //   }
  // });

  const handleEditRole = (role: any) => {
    setEditingRole(role);
    setEditRole({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || []
    });
    setShowEditRoleModal(true);
  };

  const handleUpdateRole = () => {
    if (!editRole.name.trim() || !editingRole) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateRoleMutation.mutate({
      params: { tenantId, roleId: editingRole.id.toString() },
      body: {
        name: editRole.name,
        description: editRole.description,
        permissions: editRole.permissions
      }
    });
  };

  // const handleDeleteRole = (roleId: number) => {
  //   if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
  //     deleteRoleMutation.mutate({
  //       params: { tenantId, roleId: roleId.toString() }
  //     });
  //   }
  // };

  const toggleEditRolePermission = (permission: string) => {
    setEditRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  if (rolesLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Role Management</h2>
        </div>
        <Card className="border-slate-700 bg-slate-800">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-600 rounded"></div>
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

      {/* Add Edit Role Modal */}
      <Dialog open={showEditRoleModal} onOpenChange={setShowEditRoleModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-role-name" className="text-slate-300">Role Name *</Label>
              <Input
                id="edit-role-name"
                value={editRole.name}
                onChange={(e) => setEditRole(prev => ({ ...prev, name: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="edit-role-description" className="text-slate-300">Description</Label>
              <Textarea
                id="edit-role-description"
                value={editRole.description}
                onChange={(e) => setEditRole(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter role description"
                rows={3}
              />
            </div>
            <div>
              <Label className="text-slate-300">Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                {permissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-permission-${permission}`}
                      checked={editRole.permissions.includes(permission)}
                      onCheckedChange={() => toggleEditRolePermission(permission)}
                      className="border-slate-600"
                    />
                    <Label htmlFor={`edit-permission-${permission}`} className="text-slate-300 text-sm">
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
              onClick={() => setShowEditRoleModal(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateRole}
              disabled={updateRoleMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateRoleMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              {updateRoleMutation.isPending ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update the roles table actions */}
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
                          onClick={() => handleEditRole(role)}
                          className="border-slate-600 text-slate-300 hover:bg-slate-700"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          // onClick={() => handleDeleteRole(role.id)}
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
            
            {roles.length === 0 && (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">No roles found in this tenant</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}