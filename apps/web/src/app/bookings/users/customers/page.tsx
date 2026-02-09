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
import { InsertCustomerSchema, InsertUserSchema, SelectCustomer, SelectCustomerSchema, UpdateCustomer } from '@repo/api-contract';
import { z } from 'zod';
import { EditCustomerForm } from '@/components/users/EditCustomerForm';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Schema for creating customers
// const CreateCustomerSchema = InsertUserSchema.merge(InsertCustomerSchema.omit({ id: true, dateOfBirth: true})).extend({
//   dateOfBirth: z.string().optional(),
// })








const CreateCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(1, 'Phone number is required').optional(),
  address: z.string().min(1, 'Address is required'),
  userType: z.string().default('customer'),
  customerTypeId: z.coerce.number().optional(),
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
  const { data: customerData } = authClient.customers.getCustomers.useQuery({
    queryKey: [...CUSTOMERS_QUERY_KEY, page, pageSize, searchTerm],
    queryData: { query: { ...queryParams, search: searchTerm || undefined } },
  });
  const { mutate: createCustomerMutation, isPending } = authClient.customers.createCustomer.useMutation();
  const { data: customerTypesData } = authClient.customers.getCustomerTypes.useQuery({
    queryKey: ['customerTypes'],
  });
  const customerTypes = customerTypesData?.status === 200 ? customerTypesData.body.data : [];

  const { mutate: deleteCustomer } = authClient.customers.deleteCustomer.useMutation();

  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<UpdateCustomer| null>(null);


  const customers = customerData?.status === 200 ? customerData.body.data : [];
  const paginationMeta = customerData?.status === 200 ? customerData.body.pagination : undefined;

  const createForm = useForm<CreateCustomerFormData>({ 
    resolver: zodResolver(CreateCustomerSchema),
    defaultValues: {
      userType: 'customer',
    }
  });



  const handleCreateCustomer: SubmitHandler<CreateCustomerFormData> = async (data) => {
    createCustomerMutation(
      {
        body: {
          ...data,
          phone: data?.phone || null,
          address: data?.address || null,
          customerTypeId: data?.customerTypeId || null,
        }
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

  const handleDeleteUser = async (userId: number) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        deleteCustomer({
          params: { id: userId },
          body: undefined
        }, {
          onSuccess: (response) => {
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

  const handleEditCustomer = (customer: UpdateCustomer) => {
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
                          <FormField
                            control={createForm.control}
                            name="customerTypeId"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Customer Type</FormLabel>
                                <Select
                                  value={field.value?.toString() ?? ""}
                                  onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a customer type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {customerTypes.map((ct: any) => (
                                      <SelectItem key={ct.id} value={ct.id.toString()}>
                                        {ct.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
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
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.length > 0 ? (
                  customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.name}</TableCell>
                      <TableCell>{customer.email}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>{customerTypes.find((ct: any) => ct.id === customer.customerTypeId)?.name || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() =>
                            handleEditCustomer({
                              id: customer.id,
                              name: customer.name,
                              email: customer.email,
                              createdAt: customer.createdAt,
                              updatedAt: customer.updatedAt,
                              phone: customer.phone,
                              address: customer.address,
                              customerTypeId: customer.customerTypeId,

                            })
                          }
                          aria-label={`Edit ${customer.name}`}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/bookings/users/customers/${customer.id}`)}
                          className="ml-2"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(customer.id)}
                          className="ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>

                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
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
