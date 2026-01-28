'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Loading from '@/components/custom/Loading';
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
  dateOfBirth: z.string().optional(), // ISO date string
});

type DetailsForm = z.infer<typeof DetailsSchema>;

export default function Details({ userId }: { userId: string }) {
  const tenant = StorageService.getTenant();
  const [open, setOpen] = useState(false);

  const { data: customersData, isLoading: customersLoading } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
    enabled: !!tenant,
  });
  const { data: usersData } = authClient.users.getUsers.useQuery({
    queryKey: ['users'],
    enabled: !!tenant,
  });

  const customers = customersData?.body.data ?? [];
  const users = usersData?.body.data ?? [];

  const selected = useMemo(() => customers.find((c: any) => c.user.id === userId), [customers, userId]);
  const selectedUserWithRoles = useMemo(() => users.find((u: any) => u.id === userId), [users, userId]);
  const roles: number[] = (selectedUserWithRoles?.roles ?? []).map((r: any) => r.roleId as number);

  const { mutate: updateUser, isPending } = authClient.users.updateUser.useMutation();
  const queryClient = authClient.useQueryClient();

  const form = useForm<DetailsForm>({
    resolver: zodResolver(DetailsSchema),
    defaultValues: {
      name: selected?.user?.name ?? '',
      email: selected?.user?.email ?? '',
      phone: selected?.customer?.phone ?? '',
      address: selected?.customer?.address ?? '',
      dateOfBirth: selected?.customer?.dateOfBirth ? new Date(selected.customer.dateOfBirth).toISOString().split('T')[0] : '',
    },
    values: {
      name: selected?.user?.name ?? '',
      email: selected?.user?.email ?? '',
      phone: selected?.customer?.phone ?? '',
      address: selected?.customer?.address ?? '',
      dateOfBirth: selected?.customer?.dateOfBirth ? new Date(selected.customer.dateOfBirth).toISOString().split('T')[0] : '',
    }
  });

  if (customersLoading || !selected) return <Loading />;

  const onSubmit = (values: DetailsForm) => {
    updateUser(
      {
        params: { id: userId },
        body: {
          user: { name: values.name, email: values.email },
          roles,
          customer: {
            userId,
            phone: values.phone || null,
            address: values.address || null,
            dateOfBirth: values?.dateOfBirth ? new Date(values.dateOfBirth) : null,
          },
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

  const user = selected.user;
  const customer = selected.customer;

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
            <div className="text-sm text-muted-foreground">Date of Birth</div>
            <div className="font-medium">
              {customer?.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : '-'}
            </div>
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
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
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