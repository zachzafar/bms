'use client';

import { SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Search, PlusCircle, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InsertUserSchema } from '@repo/api-contract';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { USERS_QUERY_KEY } from '@/lib/api/queryKeys';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Schema
const UserFormSchema = z.object({
  user: InsertUserSchema.extend({
    role: z.string().min(1, 'Role is required'),
  }),
  customer: z.boolean(),
  owner: z.boolean(),
  roles: z.array(z.number()),
});

type UserFormData = z.infer<typeof UserFormSchema>;

export default function Component() {

  const router = useRouter();

  const { data: users } = authClient.users.getUsers.useQuery({ queryKey: USERS_QUERY_KEY });
  const { mutate, isPending } = authClient.users.createUser.useMutation();
  const { mutate: deleteUserMutation, isPending: isDeleting } = authClient.users.deleteUser.useMutation();


  const form = useForm<UserFormData>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      user: {
        name: '',
        email: '',
        password: '',
        role: '',
      },
      customer: false,
      owner: false,
      roles: [],
    },
  });

  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const usersPerPage = 10;

  const isEditMode = !!selectedUser?.user?.id;

  const processForm: SubmitHandler<UserFormData> = async (data) => {
    mutate(
      {
        body: {
          user: data.user,
          customer: data.customer,
          owner: data.owner,
          roles: data.roles,
        }
      },
      {
        onSuccess: (response) => {
          toast.success(isEditMode ? 'User updated successfully' : 'User added successfully');
          router.push(`/users/${response.body.id}`);
          form.reset();
        },
        onError: (error) => {
          console.log('Error:', error);
          toast.error('Failed to add user');
        },
      }
    );
  };

  const resetForm = () => {
    setSelectedUser(null);
    form.reset({});
  };

  const editUser = (user: UserFormData) => {
    setSelectedUser(user);
    form.reset(user);
  };


  const deleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    deleteUserMutation(
      {
        params: { id: userId },
      },
      {
        onSuccess: () => {
          toast.success('User deleted successfully');
          router.refresh(); // Refresh data
        },
        onError: (error) => {
          console.error('Delete failed:', error);
          toast.error('Failed to delete user');
        },
      }
    );
  };

  const parsedUsers = users?.body.map((user) => ({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      password: user.password,
      role: 'user', // default or pull from API if available
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    customer: false, // default value
    owner: false,    // default value
    roles: [],      // default value or populate if you have role IDs
  }));

  const filteredUsers = parsedUsers?.filter(
    (user) =>
      user.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user.role.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];


  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber: SetStateAction<number>) => setCurrentPage(pageNumber);

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
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedUser ? 'Edit User' : 'Add New User'}
                    </DialogTitle>
                    <DialogDescription>
                      Enter user details below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(processForm)} className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Name</Label>
                        <Input
                          id='name'
                          {...form.register('user.name')}
                          // onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email</Label>
                        <Input
                          id='email'
                          type='email'
                          {...form.register('user.email')}
                          // onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='password'>Password</Label>
                        <Input
                          id='password'
                          type='password'
                          {...form.register('user.password')}
                          // onChange={handleInputChange}
                          required={!selectedUser}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='role'>Role</Label>
                        <Select
                          name='role'
                          onValueChange={(value) => form.setValue('user.role', value)}
                        // onValueChange={handleRoleChange}
                        >
                          <SelectTrigger id='role'>
                            <SelectValue placeholder='Select role' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='Admin'>Admin</SelectItem>
                            <SelectItem value='Manager'>Manager</SelectItem>
                            <SelectItem value='Customer'>Customer</SelectItem>
                            <SelectItem value='Owner'>Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className='flex justify-end space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={resetForm}
                      >
                        Cancel
                      </Button>
                      <Button type='submit'>
                        {selectedUser ? 'Update User' : 'Add User'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
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
                  <TableRow key={user.user.id}>
                    <TableCell>{user.user.name}</TableCell>
                    <TableCell>{user.user.email}</TableCell>
                    <TableCell>{user.user.role}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={`View details for ${user.user.name}`}
                          >
                            <Search className='h-4 w-4' />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>User Details</DialogTitle>
                          </DialogHeader>
                          <div className='space-y-4'>
                            <div>
                              <h3 className='font-semibold'>
                                Basic Information
                              </h3>
                              <p>Name: {user.user.name}</p>
                              <p>Email: {user.user.email}</p>
                              <p>Role: {user.user.role}</p>
                            </div>
                            {user.customerDetails && (
                              <div>
                                <h3 className='font-semibold'>
                                  Customer Details
                                </h3>
                                <p>
                                  First Name: {user.customerDetails.firstName}
                                </p>
                                <p>
                                  Last Name: {user.customerDetails.lastName}
                                </p>
                                <p>Phone: {user.customerDetails.phone}</p>
                                <p>
                                  Date of Birth:{' '}
                                  {user.customerDetails.dateOfBirth}
                                </p>
                                <p>Address: {user.customerDetails.address}</p>
                              </div>
                            )}
                            {user.ownerDetails && (
                              <div>
                                <h3 className='font-semibold'>Owner Details</h3>
                                <p>
                                  Company Name: {user.ownerDetails.companyName}
                                </p>
                                <p>Tax ID: {user.ownerDetails.taxId}</p>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => editUser(user)}
                        aria-label={`Edit ${user.user.name}`}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => deleteUser(user.user.id)}
                        aria-label={`Delete ${user.user.name}`}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className='flex justify-between items-center mt-4'>
              <p>
                Showing {indexOfFirstUser + 1} to{' '}
                {Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
                {filteredUsers.length} users
              </p>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  onClick={() => paginate(currentPage + 1)}
                  disabled={indexOfLastUser >= filteredUsers.length}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
