'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const UpdateCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    dateOfBirth: z.string().optional(), // sent as string
});

type UpdateCustomerFormData = z.infer<typeof UpdateCustomerSchema>;

export interface EditCustomerFormProps {
  customer: {
    id: string; // user ID
    name: string;
    email: string;
    customerDetails: {
      id?: number; // customer record ID
      phone: string | null;
      address: string | null;
      dateOfBirth: Date | null;
    }
  };
    onClose: () => void;
    onSuccess: () => void;
}

export function EditCustomerForm({ customer, onClose, onSuccess }: EditCustomerFormProps) {
    const { mutate: updateUserMutation, isPending } = authClient.users.updateUser.useMutation();

    const form = useForm<UpdateCustomerFormData>({
        resolver: zodResolver(UpdateCustomerSchema),
        defaultValues: {
            name: customer.name,
            email: customer.email,
            phone: customer.customerDetails.phone,
            address: customer.customerDetails.address,
            dateOfBirth: customer.customerDetails.dateOfBirth
                ? new Date(customer.customerDetails.dateOfBirth).toISOString().split('T')[0]
                : '',
        },
    });

    const handleUpdateCustomer: SubmitHandler<UpdateCustomerFormData> = async (data) => {
  updateUserMutation(
    {
      params: { id: customer.id },
      body: {
        user: {
          id: customer.id,
          name: data.name,
          email: data.email,
          userType: ['customer'], 
        },
        customer: {
          id: customer.customerDetails.id, 
          userId: customer.id,             
          phone: data.phone,
          address: data.address,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        },
        roles: [],
      },
    },
    {
      onSuccess: () => {
        toast.success('Customer updated successfully');
        form.reset();
        onSuccess();
      },
      onError: (error) => {
        console.error('Update error:', error);
        toast.error('Failed to update customer');
      },
    }
  );
};

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogDescription>Update customer details below</DialogDescription>
            </DialogHeader>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleUpdateCustomer)} className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                            control={form.control}
                            name='name'
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
                            control={form.control}
                            name='email'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type='email' {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name='phone'
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
                            control={form.control}
                            name='address'
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
                            control={form.control}
                            name='dateOfBirth'
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Birth</FormLabel>
                                    <FormControl>
                                        <Input
                                            type='date'
                                            {...field}
                                            value={field.value || ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className='flex justify-end space-x-2'>
                        <Button type='button' variant='outline' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type='submit' disabled={isPending}>
                            Update Customer
                        </Button>
                    </div>
                </form>
            </Form>
        </DialogContent>
    );
}
