'use client';

import { SetStateAction, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { OWNERS_QUERY_KEY } from '@/lib/api/queryKeys';
import { Table, TableBody,  TableHead, TableHeader, TableRow } from '@/components/ui/table';


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

  // Use owners data as the primary data source
  const { data: owners } = authClient.users.getOwners.useQuery({ queryKey: OWNERS_QUERY_KEY });


  const { mutate: createUserMutation } = authClient.users.createUser.useMutation();
  const { mutate: updateUserMutation, isPending } = authClient.users.updateUser.useMutation();
  const { mutate: deleteUserMutation, isPending: isDeleting } = authClient.users.deleteUser.useMutation();

  const form = useForm<UserFormData>({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      user: {
        name: '',
        email: '',
        password: '',
      },
      customer: false,
      owner: true, // Default to true for owner page
      roles: [],
    },
  });

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const usersPerPage = 10;

  const isEditMode = !!selectedUser?.user?.id;

  const processForm: SubmitHandler<UserFormData> = async (data) => {
    // Ensure owner flag is set to true
    const payload = {
      user: data.user,
      customer: data.customer,
      owner: true, // Always set to true on owner page
      roles: data.roles,
    };
  
    if (isEditMode && selectedUser?.user.id) {
      updateUserMutation(
        {
          params: { id: selectedUser.user.id },
          body: payload,
        },
        {
          onSuccess: (response) => {
            toast.success('User updated successfully');
            router.push(`/users`);
            form.reset();
          },
          onError: (error) => {
            console.error('Update error:', error);
            toast.error('Failed to update user');
          },
        }
      );
    } else {
      createUserMutation(
        {
          body: payload,
        },
        {
          onSuccess: (response) => {
            toast.success('Owner created successfully');
            router.push(`/users/owners`); // Redirect to owners page
            setOpen(false);
            form.reset();
          },
          onError: (error) => {
            console.error('Create error:', error);
            toast.error('Failed to create owner');
          },
        }
      );
    }
  };

  const resetForm = () => {
    setSelectedUser(null);
    form.reset({});
  };

  const editUser = (user: UserFormData) => {
    setSelectedUser(user);
    form.setValue('user.name', user.user.name);
    form.setValue('user.email', user.user.email);
    form.setValue('user.role', user.user.role);
    setOpen(true);
  };


  const deleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this owner?')) return;

    deleteUserMutation(
      {
        params: { id: userId },
      },
      {
        onSuccess: () => {
          toast.success('Owner deleted successfully');
          router.refresh(); // Refresh data
        },
        onError: (error) => {
          console.error('Delete failed:', error);
          toast.error('Failed to delete owner');
        },
      }
    );
  };

  // Parse owners data instead of users
  const parsedOwners = owners?.body.map((owner) => ({
    user: {
      id: owner.id,
      name: owner.name,
      email: owner.email,
      password: owner.password,
      role: 'Owner', // Set role to Owner
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    },
    customer: false,
    owner: true,
    roles: [],
    ownerDetails: owner.ownerDetails || null,
  })) || [];

  const filteredOwners = parsedOwners.filter(
    (owner) =>
      owner.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastOwner = currentPage * usersPerPage;
  const indexOfFirstOwner = indexOfLastOwner - usersPerPage;
  const currentOwners = filteredOwners.slice(indexOfFirstOwner, indexOfLastOwner);

  const paginate = (pageNumber: SetStateAction<number>) => setCurrentPage(pageNumber);

  return (
    <>
      <div className='container mx-auto py-10'>
        <h1 className='text-3xl font-bold mb-8'>Owner Management</h1>

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Owner List</CardTitle>
            <CardDescription>Manage property owners</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-center mb-4'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-8'
                  placeholder='Search owners...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { 
                    setSelectedUser(null); 
                    // Reset form with owner defaults
                    form.reset({
                      user: {
                        name: '',
                        email: '',
                        password: '',
                        role: 'Owner',
                      },
                      customer: false,
                      owner: true,
                      roles: [],
                    });
                    setOpen(true); 
                  }}>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add Owner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedUser ? 'Edit Owner' : 'Add New Owner'}
                    </DialogTitle>
                    <DialogDescription>
                      Enter owner details below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={form.handleSubmit(processForm)} className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Name</Label>
                        <Input
                          id='name'
                          {...form.register('user.name')}
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email</Label>
                        <Input
                          id='email'
                          type='email'
                          {...form.register('user.email')}
                          required
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='password'>Password</Label>
                        <Input
                          id='password'
                          type='password'
                          {...form.register('user.password')}
                          required={!selectedUser}
                        />
                      </div>
                      {/* Hidden field for owner role */}
                      <input type="hidden" {...form.register('user.role')} value="Owner" />
                      <input type="hidden" {...form.register('owner')} value="true" />
                      
                      {/* Additional owner fields could be added here */}
                      <div className='space-y-2'>
                        <Label htmlFor='companyName'>Company Name (Optional)</Label>
                        <Input
                          id='companyName'
                          {...form.register('ownerDetails.companyName')}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='taxId'>Tax ID (Optional)</Label>
                        <Input
                          id='taxId'
                          {...form.register('ownerDetails.taxId')}
                        />
                      </div>
                    </div>

                    <div className='flex justify-end space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        onClick={() => {
                          resetForm();
                          setOpen(false);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type='submit' disabled={isPending}>
                        {isPending ? 'Saving...' : (selectedUser ? 'Update Owner' : 'Add Owner')}
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
                  <TableHead>Company</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentOwners.length > 0 ? (
                  currentOwners.map((owner) => (
                    <TableRow key={owner.user.id}>
                      <TableCell>{owner.user.name}</TableCell>
                      <TableCell>{owner.user.email}</TableCell>
                      <TableCell>{owner.ownerDetails?.companyName || '-'}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              aria-label={`View details for ${owner.user.name}`}
                            >
                              <Search className='h-4 w-4' />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Owner Details</DialogTitle>
                            </DialogHeader>
                            <div className='space-y-4'>
                              <div>
                                <h3 className='font-semibold'>
                                  Basic Information
                                </h3>
                                <p>Name: {owner.user.name}</p>
                                <p>Email: {owner.user.email}</p>
                                <p>Role: Owner</p>
                              </div>
                              {owner.ownerDetails && (
                                <div>
                                  <h3 className='font-semibold'>Owner Details</h3>
                                  <p>
                                    Company Name: {owner.ownerDetails.companyName || 'Not specified'}
                                  </p>
                                  <p>Tax ID: {owner.ownerDetails.taxId || 'Not specified'}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => editUser(owner)}
                          aria-label={`Edit ${owner.user.name}`}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => deleteUser(owner.user.id)}
                          aria-label={`Delete ${owner.user.name}`}
                          disabled={isDeleting}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No owners found. Add your first owner to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className='flex justify-between items-center mt-4'>
              <p>
                Showing {filteredOwners.length > 0 ? indexOfFirstOwner + 1 : 0} to{' '}
                {Math.min(indexOfLastOwner, filteredOwners.length)} of{' '}
                {filteredOwners.length} owners
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
                  disabled={indexOfLastOwner >= filteredOwners.length}
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
