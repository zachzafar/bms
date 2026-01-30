'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, } from '@/components/ui/dialog';
import { Search, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Eye } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { CUSTOMERS_QUERY_KEY, } from '@/lib/api/queryKeys';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InsertCustomerSchema, InsertUserSchema, SelectCustomer, SelectCustomerSchema } from '@repo/api-contract';
import { z } from 'zod';
import { EditCustomerForm } from '@/components/users/EditCustomerForm';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

// Schema for creating customers
// const CreateCustomerSchema = InsertUserSchema.merge(InsertCustomerSchema.omit({ id: true, dateOfBirth: true})).extend({
//   dateOfBirth: z.string().optional(),
// })


type EditableCustomer = {
  id: string; // user ID
  name: string;
  email: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  customerDetails: {
    id?: number;
    userId: string;
    phone: string | null;
    address: string | null;
    createdAt?: Date | null;
    updatedAt?: Date | null;
  };
};





const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').optional(),
  address: z.string().min(1, 'Address is required'),
  userType: z.string().default('customer'),
})

type CreateCustomerFormData = z.infer<typeof CreateCustomerSchema>;
const ExtendedSelectCustomerSchema = SelectCustomerSchema.extend({
  roles: z.array(z.number()).default([])
});
type ExtendedSelectCustomer = z.infer<typeof ExtendedSelectCustomerSchema>;

export default function Component() {
  const router = useRouter();
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);

  const queryClient = authClient.useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: customerData } = authClient.users.getCustomers.useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, page, pageSize, searchTerm],
    queryData: {query: { ...queryParams, search: searchTerm || undefined }},
  });
  const { mutate: createUserMutation, isPending } = authClient.users.createUser.useMutation();

  const { mutate: deleteUser} = authClient.users.deleteUser.useMutation();

  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<EditableCustomer | null>(null);


  const customers = customerData?.status === 200 ? customerData.body.data : [];
  const paginationMeta = customerData?.status === 200 ? customerData.body.pagination : undefined;

  const createForm = useForm<CreateCustomerFormData>({
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      userType: 'customer',
    }
  });



  const handleCreateCustomer: SubmitHandler<CreateCustomerFormData> = async (data) => {
    createUserMutation(
      {
        body: {
          ...data,
          password: 'password',
          userType: 'customer',
          roles: [],
          customerDetails: {
            phone: data?.phone || null,
            address: data?.address || null,
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

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        deleteUser({
          params: { id: userId },
          body: undefined
        },{
          onSuccess:(response) =>{
            queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
            toast.success('User deleted successfully');
          },
          onError: (error) => {
            toast.error('Failed to delete user');
          }
        })
        
        
      } catch (error: any) {
        console.error('Delete user error:', error);
      }
    }
  };

  const handleEditCustomer = (customer: EditableCustomer) => {
    setSelectedCustomer(customer); // open modal or route to edit form
    setOpen(true);
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

                {selectedCustomer ? (
                  <DialogContent>
                    <EditCustomerForm
                      customer={selectedCustomer}
                      onClose={() => {
                        setOpen(false);
                        setSelectedCustomer(null);
                      }}
                      onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY });
                        setOpen(false);
                        setSelectedCustomer(null);
                      }}
                    />
                  </DialogContent>
                ) : (
                  <DialogContent className="sm:max-w-[550px]">
                    <DialogHeader>
                      <DialogTitle>Add New Customer</DialogTitle>
                      <DialogDescription>
                        Enter the customer details below.
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
                              <FormItem className="md:col-span-2">
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
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
                )}
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
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() =>
                            handleEditCustomer({
                              id: customer.user.id,
                              name: customer.user.name,
                              email: customer.user.email,
                              createdAt: customer.user.createdAt,
                              updatedAt: customer.user.updatedAt,
                              customerDetails: {
                                id: customer.customer.id,
                                userId: customer.user.id,
                                phone: customer.customer.phone,
                                address: customer.customer.address,
                                createdAt: customer.customer.createdAt,
                                updatedAt: customer.customer.updatedAt,
                              },
                            })
                          }
                          aria-label={`Edit ${customer.user.name}`}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/bookings/users/customers/${customer.user.id}`)}
                          className="ml-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(customer.user.id)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
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
