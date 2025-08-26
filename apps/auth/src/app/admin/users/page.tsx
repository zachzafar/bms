'use client';

import { SetStateAction, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Search, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { z } from 'zod';
import { SelectUser, SelectUserSchema } from '@repo/api-contract';
import { authClient } from '@/lib/api/publicClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { EditUserForm } from '@/components/users/EditUserForm';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Schema extensions
const ExtendedSelectUserSchema = SelectUserSchema.extend({
  roles: z.array(z.number()).default([])
});
type ExtendedSelectUser = z.infer<typeof ExtendedSelectUserSchema>;

export default function UsersPage() {
  const queryClient = authClient.useQueryClient();
  const { data: users } = authClient.users.getUsers.useQuery({ 
    queryKey: ["users"] 
  });
  const { data: roles } = authClient.auth.getRoles.useQuery({ 
    queryKey: ["roles"] 
  });

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SelectUser | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const usersPerPage = 10;

  const parsedUsers = users?.body?.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles
  })) || [];

  const filteredUsers = parsedUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: SetStateAction<number>) => setCurrentPage(pageNumber);

  const handleEditUser = (user: ExtendedSelectUser) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setSelectedUser(null);
    setOpen(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Create, edit, and manage user accounts and permissions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>Manage existing users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedUser(null); setOpen(true); }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
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
                    queryClient.invalidateQueries({ queryKey: ["users"] });
                  }}
                />
              ) : (
                <CreateUserForm
                  roles={roles?.body || []}
                  onClose={handleCloseDialog}
                  onSuccess={() => {
                    handleCloseDialog();
                    queryClient.invalidateQueries({ queryKey: ["users"] });
                  }}
                />
              )}
            </Dialog>
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
              {currentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roles}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
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
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="flex justify-between items-center mt-4">
            <p>
              Showing {indexOfFirstUser + 1} to{' '}
              {Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
              {filteredUsers.length} users
            </p>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => paginate(currentPage + 1)}
                disabled={indexOfLastUser >= filteredUsers.length}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
