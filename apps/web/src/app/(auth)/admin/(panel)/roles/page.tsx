'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusIcon, Pencil, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

// Schema for role form
const RoleFormSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  permissions: z.array(z.string()),
});

type RoleFormData = z.infer<typeof RoleFormSchema>;

export default function RolesPage() {
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);
  const [open, setOpen] = useState(false);
  const queryClient = authClient.useQueryClient();
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<{ roleId: number; name: string; permissions: string[] }[]>([]);
  const [selectedRole, setSelectedRole] = useState<{ roleId: number; name: string; permissions: string[] } | null>(null);

  const form = useForm<RoleFormData>({
    resolver: zodResolver(RoleFormSchema),
    defaultValues: {
      name: '',
      permissions: [],
    },
  });

  // Select all
  const allSelected =
    availablePermissions.length > 0 &&
    form.watch('permissions').length === availablePermissions.length;

  // Fetch permissions
  const { data: permissionsData } = authClient.auth.getPermissions.useQuery({
    queryKey: ['permissions'],
  });

  // Fetch roles
  const { data: rolesData, refetch: refetchRoles } = authClient.auth.getRoles.useQuery({
    queryKey: ['roles', page, pageSize],
  });

  // Create role mutation
  const { mutate: createRole } = authClient.auth.createRole.useMutation();

  // Update role mutation
  const { mutate: updateRole } = authClient.auth.updateRole.useMutation();

  // Delete role Mutation
  const { mutate: deleteRole } = authClient.auth.deleteRole.useMutation();

  useEffect(() => {
    if (permissionsData?.status === 200) {
      setAvailablePermissions(permissionsData.body);
    }
  }, [permissionsData]);

  useEffect(() => {
    if (rolesData?.status === 200) {
      setRoles(
        rolesData.body.map((role: { roleId: string; name: string; permissions: string[] }) => ({
          ...role,
          roleId: Number(role.roleId),
        }))
      );
    }
  }, [rolesData]);

  useEffect(() => {
    if (selectedRole) {
      form.reset({
        name: selectedRole.name,
        permissions: selectedRole.permissions,
      });
    } else {
      form.reset({
        name: '',
        permissions: [],
      });
    }
  }, [selectedRole, form]);

  const processForm: SubmitHandler<RoleFormData> = (data) => {
    const payload = {
      body: {
        name: data.name,
        permissions: data.permissions,
      },
    };

    const onSuccess = () => {
      toast.success(selectedRole ? 'Role updated successfully' : 'Role created successfully');
      setOpen(false);
      refetchRoles();
      resetForm();
    };

    const onError = (error: any) => {
      console.error('Error:', error);
      toast.error('Failed to save role');
    };

    if (selectedRole) {
      updateRole(
        {
          ...payload,
          params: { roleId: Number(selectedRole.roleId) },
        },
        { onSuccess, onError }
      );
    } else {
      createRole(payload, { onSuccess, onError });
    }
  };

  const resetForm = () => {
    setSelectedRole(null);
    form.reset({
      name: '',
      permissions: [],
    });
  };

  const handleEditRole = (role: { roleId: number; name: string; permissions: string[] }) => {
    setSelectedRole(role);
    setOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
          <p className=" mt-2 text-gray-600">
            Create, edit, and manage user roles and their permissions.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedRole ? 'Edit Role' : 'Add New Role'}</DialogTitle>
              <DialogDescription>
                {selectedRole
                  ? 'Update the role details and permissions'
                  : 'Create a new role with specific permissions'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(processForm)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter role name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium leading-none">
                      Permissions
                    </label>

                    {/* ✅ ADDED (no removals) */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        form.setValue(
                          'permissions',
                          allSelected ? [] : availablePermissions,
                          { shouldValidate: true }
                        );
                      }}
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-2 border rounded-md">
                    {availablePermissions.map((permission) => (
                      <FormField
                        key={permission}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(permission)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    field.onChange([...field.value, permission]);
                                  } else {
                                    field.onChange(
                                      field.value.filter((value) => value !== permission)
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {permission}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {selectedRole ? 'Update Role' : 'Create Role'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-white border-white">
        <CardHeader>
          <CardTitle className="font-bold text-gray-900">Roles</CardTitle>
          <CardDescription className=" mt-2 text-gray-600">
            Manage user roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-black">ID</TableHead>
                <TableHead className=" mt-2 text-black">Name</TableHead>
                <TableHead className=" mt-2 text-black">Permissions</TableHead>
                <TableHead className="text-right mt-2 text-black">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length > 0 ? (
                roles.map((role) => (
                  <TableRow key={role.roleId}>
                    <TableCell className="text-gray-600">{role.roleId}</TableCell>
                    <TableCell className="text-gray-600">{role.name}</TableCell>
                    <TableCell className="text-gray-600">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission}
                            className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-full"
                          >
                            {permission}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-full">
                            +{role.permissions.length - 3} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-black">
                      <Button variant="ghost" size="sm" onClick={() => handleEditRole(role)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          const confirmed = confirm(
                            `Are you sure you want to delete the role "${role.name}"?`
                          );
                          if (confirmed) {
                            deleteRole(
                              {
                                params: { roleId: Number(role.roleId) },
                                body: {},
                              },
                              {
                                onSuccess: () => {
                                  toast.success(`Role "${role.name}" deleted.`);
                                  refetchRoles();
                                },
                                onError: () => {
                                  toast.error(`Failed to delete role "${role.name}".`);
                                },
                              }
                            );
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No roles found. Create your first role to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* {paginationMeta && (
            <DataTablePagination
              pagination={paginationMeta}
              onPageChange={goToPage}
              onPageSizeChange={changePageSize}
            />
          )} */}
        </CardContent>
      </Card>
    </div>
  );
}
