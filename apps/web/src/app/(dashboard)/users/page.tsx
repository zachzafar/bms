'use client';

import { SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

  const processForm: SubmitHandler<UserFormData> = async (data) => {
    mutate(
      {
        body: data,
        params: { id: '' },
      },
      {
        onSuccess: (response) => {
          toast.success('User added successfully');
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

  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const usersPerPage = 10;

  // const resetForm = () => {
  //   setSelectedUser(null);
  //   setFormData({
  //     name: '',
  //     email: '',
  //     password: '',
  //     role: '',
  //     firstName: '',
  //     lastName: '',
  //     phone: '',
  //     address: '',
  //     dateOfBirth: '',
  //     companyName: '',
  //     taxId: '',
  //   });
  // };

  const resetForm = () => {
    setSelectedUser(null);
    form.reset({});
  };

  const editUser = (user: UserFormData) => {
    setSelectedUser(user);
    form.reset(user); // Populate form with existing user data
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

  const filteredUsers = users?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
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
                          required
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

                    {/* <Tabs defaultValue='customer' className='w-full'>
                      <TabsList className='grid w-full grid-cols-2'>
                        <TabsTrigger value='customer'>
                          Customer Details
                        </TabsTrigger>
                        <TabsTrigger value='owner'>Owner Details</TabsTrigger>
                      </TabsList>
                      <TabsContent value='customer' className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='firstName'>First Name</Label>
                            <Input
                              id='firstName'
                              name='firstName'
                              value={formData.firstName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='lastName'>Last Name</Label>
                            <Input
                              id='lastName'
                              name='lastName'
                              value={formData.lastName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='phone'>Phone</Label>
                            <Input
                              id='phone'
                              name='phone'
                              type='tel'
                              value={formData.phone}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='dateOfBirth'>Date of Birth</Label>
                            <Input
                              id='dateOfBirth'
                              name='dateOfBirth'
                              type='date'
                              value={formData.dateOfBirth}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className='space-y-2'>
                          <Label htmlFor='address'>Address</Label>
                          <Input
                            id='address'
                            name='address'
                            value={formData.address}
                            onChange={handleInputChange}
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value='owner' className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <div className='space-y-2'>
                            <Label htmlFor='companyName'>Company Name</Label>
                            <Input
                              id='companyName'
                              name='companyName'
                              value={formData.companyName}
                              onChange={handleInputChange}
                            />
                          </div>
                          <div className='space-y-2'>
                            <Label htmlFor='taxId'>Tax ID</Label>
                            <Input
                              id='taxId'
                              name='taxId'
                              value={formData.taxId}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs> */}

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
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            aria-label={`View details for ${user.name}`}
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
                              <p>Name: {user.name}</p>
                              <p>Email: {user.email}</p>
                              <p>Role: {user.role}</p>
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
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => deleteUser(user.id)}
                        aria-label={`Delete ${user.name}`}
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
