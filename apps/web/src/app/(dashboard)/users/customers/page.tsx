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
import { CUSTOMERS_QUERY_KEY, USERS_QUERY_KEY } from '@/lib/api/queryKeys';
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

  // Prioritize customers data instead of users
  const { data: customers } = authClient.users.getCustomers.useQuery({ queryKey: CUSTOMERS_QUERY_KEY });
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
      customer: true, // Default to true for customer page
      owner: false,
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
    // Ensure customer flag is set to true
    const payload = {
      user: data.user,
      customer: true, // Always set to true on customer page
      owner: false,
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
            toast.success('Customer updated successfully');
            router.push(`/users/customers`);
            setOpen(false);
            form.reset();
          },
          onError: (error) => {
            console.error('Update error:', error);
            toast.error('Failed to update customer');
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
            toast.success('Customer created successfully');
            router.push(`/users/customers`);
            setOpen(false);
            form.reset();
          },
          onError: (error) => {
            console.error('Create error:', error);
            toast.error('Failed to create customer');
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
    form.setValue('user.role', 'Customer'); // Always set to Customer
    form.setValue('customer', true);
    form.setValue('owner', false);
    setOpen(true);
  };

  const deleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;

    deleteUserMutation(
      {
        params: { id: userId },
      },
      {
        onSuccess: () => {
          toast.success('Customer deleted successfully');
          router.refresh(); // Refresh data
        },
        onError: (error) => {
          console.error('Delete failed:', error);
          toast.error('Failed to delete customer');
        },
      }
    );
  };

  // Parse customers data
  const parsedCustomers = customers?.body.map((customer) => ({
    user: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      password: customer.password,
      role: 'Customer',
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    },
    customer: true,
    owner: false,
    roles: [],
    customerDetails: customer.customerDetails || null,
  })) || [];

  const filteredCustomers = parsedCustomers.filter(
    (customer) =>
      customer.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.customerDetails?.phone && 
        customer.customerDetails.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastCustomer = currentPage * usersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - usersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);

  const paginate = (pageNumber: SetStateAction<number>) => setCurrentPage(pageNumber);

  return (
    <>
      <div className='container mx-auto py-10'>
        <h1 className='text-3xl font-bold mb-8'>Customers</h1>

        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>Manage existing customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex justify-between items-center mb-4'>
              <div className='relative'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  className='pl-8'
                  placeholder='Search customers...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { 
                    setSelectedUser(null); 
                    // Reset form with customer defaults
                    form.reset({
                      user: {
                        name: '',
                        email: '',
                        password: '',
                        role: 'Customer',
                      },
                      customer: true,
                      owner: false,
                      roles: [],
                    });
                    setOpen(true); 
                  }}>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {selectedUser ? 'Edit Customer' : 'Add New Customer'}
                    </DialogTitle>
                    <DialogDescription>
                      Enter customer details below
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
                      
                      {/* Hidden field for customer role */}
                      <input type="hidden" {...form.register('user.role')} value="Customer" />
                      <input type="hidden" {...form.register('customer')} value="true" />
                      
                      {/* Additional customer fields */}
                      <div className='space-y-2'>
                        <Label htmlFor='phone'>Phone</Label>
                        <Input
                          id='phone'
                          {...form.register('customerDetails.phone')}
                        />
                      </div>
                      <div className='space-y-2'>
                        <Label htmlFor='address'>Address</Label>
                        <Input
                          id='address'
                          {...form.register('customerDetails.address')}
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
                        {isPending ? 'Saving...' : (selectedUser ? 'Update Customer' : 'Add Customer')}
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
                  <TableHead>Phone</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCustomers.length > 0 ? (
                  currentCustomers.map((customer) => (
                    <TableRow key={customer.user.id}>
                      <TableCell>{customer.user.name}</TableCell>
                      <TableCell>{customer.user.email}</TableCell>
                      <TableCell>{customer.customerDetails?.phone || '-'}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              aria-label={`View details for ${customer.user.name}`}
                            >
                              <Search className='h-4 w-4' />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Customer Details</DialogTitle>
                            </DialogHeader>
                            <div className='space-y-4'>
                              <div>
                                <h3 className='font-semibold'>
                                  Basic Information
                                </h3>
                                <p>Name: {customer.user.name}</p>
                                <p>Email: {customer.user.email}</p>
                              </div>
                              {customer.customerDetails && (
                                <div>
                                  <h3 className='font-semibold'>
                                    Customer Details
                                  </h3>
                                  <p>Phone: {customer.customerDetails.phone || 'Not provided'}</p>
                                  <p>Address: {customer.customerDetails.address || 'Not provided'}</p>
                                  {customer.customerDetails.firstName && (
                                    <p>First Name: {customer.customerDetails.firstName}</p>
                                  )}
                                  {customer.customerDetails.lastName && (
                                    <p>Last Name: {customer.customerDetails.lastName}</p>
                                  )}
                                  {customer.customerDetails.dateOfBirth && (
                                    <p>Date of Birth: {customer.customerDetails.dateOfBirth}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => editUser(customer)}
                          aria-label={`Edit ${customer.user.name}`}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => deleteUser(customer.user.id)}
                          aria-label={`Delete ${customer.user.name}`}
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
                      No customers found. Add your first customer to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className='flex justify-between items-center mt-4'>
              <p>
                Showing {filteredCustomers.length > 0 ? indexOfFirstCustomer + 1 : 0} to{' '}
                {Math.min(indexOfLastCustomer, filteredCustomers.length)} of{' '}
                {filteredCustomers.length} customers
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
                  disabled={indexOfLastCustomer >= filteredCustomers.length}
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
