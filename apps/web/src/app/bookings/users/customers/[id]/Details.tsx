'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Loading from '@/components/custom/Loading';
import { QuickCreateCustomerType } from '@/components/custom/QuickCreate';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

const DetailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  customerTypeId: z.coerce.number().nullable().optional(),
});

type DetailsForm = z.infer<typeof DetailsSchema>;

export default function Details({ customerId }: { customerId: number }) {
  const tenant = StorageService.getTenant();
  const [open, setOpen] = useState(false);

  const { data: customersData, isLoading: customersLoading } = authClient.customers.getCustomers.useQuery({
    queryKey: ['customers'],
    enabled: !!tenant,
  });
  const { data: customerTypesData } = authClient.customers.getCustomerTypes.useQuery({
    queryKey: ['customerTypes'],
  });
  const customerTypes = customerTypesData?.status === 200 ? customerTypesData.body.data : [];

  const customers = customersData?.body.data ?? [];

  const selected = useMemo(() => customers.find((c: any) => c.id === customerId), [customers, customerId]);


  const { mutate: updateCustomer, isPending } = authClient.customers.updateCustomer.useMutation();
  const queryClient = authClient.useQueryClient();

  const form = useForm<DetailsForm>({
    resolver: zodResolver(DetailsSchema),
    defaultValues: {
      name: selected?.name ?? '',
      email: selected?.email ?? '',
      phone: selected?.phone ?? '',
      address: selected?.address ?? '',
      customerTypeId: selected?.customerTypeId ?? undefined,
    },
    values: {
      name: selected?.name ?? '',
      email: selected?.email ?? '',
      phone: selected?.phone ?? '',
      address: selected?.address ?? '',
      customerTypeId: selected?.customerTypeId ?? undefined,
    }
  });

  if (customersLoading || !selected) return <Loading />;

  const onSubmit = (values: DetailsForm) => {
    updateCustomer(
      {
        params: { id: customerId },
        body: {
          name: values.name,
          address: values.address || null,
          phone: values.phone || null,
          email: values.email,
          customerTypeId: values.customerTypeId ?? null
          },
      },
      {
        onSuccess: () => {
          toast.success('Customer updated');
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          queryClient.invalidateQueries({ queryKey: ['users'] });
          setOpen(false);
        },
        onError: (e) => {
          console.error(e);
          toast.error('Failed to update customer');
        },
      }
    );
  };

  const user = selected;
  const customer = selected;

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Profile</CardTitle>
          <Button variant="outline" onClick={() => setOpen(true)}>Edit Details</Button>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Name</div>
            <div className="font-medium">{user?.name || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Email</div>
            <div className="font-medium">{user?.email || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Phone</div>
            <div className="font-medium">{customer?.phone || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Address</div>
            <div className="font-medium">{customer?.address || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Customer Type</div>
            <div className="font-medium">{customerTypes.find((ct: any) => ct.id === customer?.customerTypeId)?.name || '-'}</div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer Details</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input type="email" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="customerTypeId"
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
                                <QuickCreateCustomerType />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isPending}>Save</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}