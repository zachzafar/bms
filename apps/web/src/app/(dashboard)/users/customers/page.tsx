'use client';

import {  useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Search, PlusCircle, } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/api/publicClient';
import { CUSTOMERS_QUERY_KEY, } from '@/lib/api/queryKeys';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InsertCustomerSchema, InsertUserSchema } from '@repo/api-contract';
import { date, z } from 'zod';

// Schema for creating customers
// const CreateCustomerSchema = InsertUserSchema.merge(InsertCustomerSchema.omit({ id: true, dateOfBirth: true})).extend({
//   dateOfBirth: z.string().optional(),
// })

const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required'),
  address: z.string().min(1, 'Address is required'),
  dateOfBirth: z.string().optional(),
  userType: z.array(z.string()).default(['customer']),
})

type CreateCustomerFormData = z.infer<typeof CreateCustomerSchema>;

export default function Component() {
  const router = useRouter();
  const queryClient = authClient.useQueryClient();
  const { data: customerData } = authClient.users.getCustomers.useQuery({ queryKey: CUSTOMERS_QUERY_KEY });
  const { mutate: createUserMutation, isPending } = authClient.users.createUser.useMutation();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const customers = customerData?.body || []

  const createForm = useForm<CreateCustomerFormData>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      userType: ['customer'],
    }
  });



  const handleCreateCustomer: SubmitHandler<CreateCustomerFormData> = async (data) => {
    createUserMutation(
      {
        body: {
          ...data,
          password: 'password',
          userType: ['customer'], 
          roles: [],
          customerDetails: {
            phone: data?.phone || null,
            address: data?.address || null,
            dateOfBirth: data?.dateOfBirth ? data.dateOfBirth.toString() : undefined,
          }
        },
      },
      {
        onSuccess: (response) => {
          toast.success('Customer created successfully');
          setOpen(false);
          queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
          createForm.reset();
        },
        onError: (error) => {
          console.error('Create error:', error);
          toast.error('Failed to create customer');
        },
      }
    );
  };

  // const handleUpdateCustomer: SubmitHandler<> = async (data) => {
  //   if (selectedCustomer?.id) {
  //     updateUserMutation(
  //       {
  //         params: { id: selectedCustomer.id },
  //         body: {
  //           ...data,
  //           customer: true, // Always ensure customer flag is true
  //         },
  //       },
  //       {
  //         onSuccess: () => {
  //           toast.success('Customer updated successfully');
  //           setOpen(false);
  //           router.refresh();
  //           updateForm.reset();
  //         },
  //         onError: (error) => {
  //           console.error('Update error:', error);
  //           toast.error('Failed to update customer');
  //         },
  //       }
  //     );
  //   }
  // };


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
                  <Button onClick={() => setOpen(true)}>
                    <PlusCircle className='mr-2 h-4 w-4' />
                    Add Customer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                   Add New Customer
                    </DialogTitle>
                    <DialogDescription>
                      Enter customer details below
                    </DialogDescription>
                  </DialogHeader>
                  
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(handleCreateCustomer)} className='space-y-4'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                          <FormField
                            control={createForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field} 
                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className='flex justify-end space-x-2'>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => {                        
                              setOpen(false);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type='submit' disabled={isPending}>
                            Add Customer
                          </Button>
                        </div>
                      </form>
                    </Form>
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
                {customers?.length > 0 ? (
                  customers.map((customer) => (
                    <TableRow key={customer.user.id}>
                      <TableCell>{customer.user.name}</TableCell>
                      <TableCell>{customer.user.email}</TableCell>
                      <TableCell>{customer.customer?.phone || '-'}</TableCell>
                      <TableCell>
                        {/* <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              aria-label={`View details for ${customer.name}`}
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
                                <p>Name: {customer.name}</p>
                                <p>Email: {customer.email}</p>
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
                        </Dialog> */}
                        {/* <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => editCustomer(customer)}
                          aria-label={`Edit ${customer.name}`}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button> */}
                        {/* <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => deleteCustomer(customer.id)}
                          aria-label={`Delete ${customer.name}`}
                          disabled={isDeleting}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button> */}
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
            {/* <div className='flex justify-between items-center mt-4'>
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
            </div> */}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
