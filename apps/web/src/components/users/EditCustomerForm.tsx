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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UpdateCustomer } from '@repo/api-contract';

const UpdateCustomerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().nullable(),
    address: z.string().nullable(),
    customerTypeId: z.coerce.number().nullable().optional(),
});

type UpdateCustomerFormData = z.infer<typeof UpdateCustomerSchema>;

export interface EditCustomerFormProps {
    customer: UpdateCustomer;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditCustomerForm({ customer, onClose, onSuccess }: EditCustomerFormProps) {
    const { mutate: updateCustomer, isPending } = authClient.customers.updateCustomer.useMutation();
    const { data: customerTypesData } = authClient.customers.getCustomerTypes.useQuery({
      queryKey: ['customerTypes'],
    });
    const customerTypes = customerTypesData?.status === 200 ? customerTypesData.body.data : [];

    const form = useForm<UpdateCustomerFormData>({
        resolver: zodResolver(UpdateCustomerSchema),
        defaultValues: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            address: customer.address,
            customerTypeId: customer.customerTypeId ?? undefined,
        },
    });

    const handleUpdateCustomer: SubmitHandler<UpdateCustomerFormData> = async (data) => {
  updateCustomer(
    {
      params: { id: customer.id },
      body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          customerTypeId: data.customerTypeId ?? null,
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
        <DialogContent className="sm:max-w-[550px]">
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
                            name='customerTypeId'
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Customer Type</FormLabel>
                                    <Select
                                        value={field.value?.toString() ?? ""}
                                        onValueChange={(value) => field.onChange(value ? Number(value) : null)}
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
