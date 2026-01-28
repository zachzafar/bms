'use client';

import { SetStateAction, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Search, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { z } from 'zod';
import { SelectUser, SelectUserSchema } from '@repo/api-contract';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { ROLES_QUERY_KEY, USERS_QUERY_KEY } from '@/lib/api/queryKeys';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { CreateUserForm } from '@/components/users/CreateUserForm';
// import { EditUserForm } from '@/components/users/EditUserForm';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
// import { queryClient } from '@/lib/react-query';

// Schema extensions
const ExtendedSelectUserSchema = SelectUserSchema.extend({
  roles: z.array(z.object({ roleId: z.number(), roleName: z.string() })).default([])
});
type ExtendedSelectUser = z.infer<typeof ExtendedSelectUserSchema>;

export default function Component() {
  const router = useRouter();
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);
  const queryClient = authClient.useQueryClient();
  const { data: users } = authClient.users.getUsers.useQuery({
    queryKey: [...USERS_QUERY_KEY, page, pageSize],
    queryData: { query: queryParams },
  });
  const { data: roles } = authClient.auth.getRoles.useQuery({ queryKey: ROLES_QUERY_KEY });

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const parsedUsers = users?.status === 200 ? users.body.data.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles
  })) : [];

  const paginationMeta = users?.status === 200 ? users.body.pagination : undefined;

  const rolesMap: Record<string, string | undefined> =
    roles?.body?.reduce((acc, type) => {
      acc[type.roleId] = type.name;
      return acc;
    }, {} as Record<string, string | undefined>) ?? {};

  const handleEditUser = (user: ExtendedSelectUser) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setOpen(false);
  };

  return (
    <>
      <div className='container mx-auto py-10'>
        <h1 className='text-3xl font-bold mb-8'>User Management</h1>

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>Manage existing users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-center mb-4'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-8'
                  placeholder='Search users...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {/* <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { setSelectedUser(null); setOpen(true); }}>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add User
                  </Button>
                </DialogTrigger>

                {selectedUser ? (
                  <EditUserForm
                    user={selectedUser}
                    roles={roles?.body || []}
                    onClose={handleCloseDialog}
                    onSuccess={() => {
                      handleCloseDialog();
                      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
                    }}
                  />
                ) : (
                  <CreateUserForm
                    roles={roles?.body || []}
                    onClose={handleCloseDialog}
                    onSuccess={() => {
                      handleCloseDialog();
                      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
                    }}
                  />
                )}
              </Dialog> */}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.roles.map(r => r.roleName).join(', ') || '-'}</TableCell>
                    {/* <TableCell>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => handleEditUser({
                          id: user.id,
                          name: user.name,
                          email: user.email,
                          password: '',
                          userType: {},
                          createdAt: null,
                          updatedAt: null,
                          roles: user.roles
                        })}
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {paginationMeta && (
              <DataTablePagination
                pagination={paginationMeta}
                onPageChange={goToPage}
                onPageSizeChange={changePageSize}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
