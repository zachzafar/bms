'use client';

import { useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Loading from '@/components/custom/Loading';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const ownerFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type OwnerFormValues = z.infer<typeof ownerFormSchema>;

export default function Details({ userId }: { userId: string }) {
  const tenant = StorageService.getTenant();

  // Fetch owners for display and refetch support
  const { data: ownersData, isLoading: ownersLoading, refetch } = authClient.users.getOwners.useQuery({
    queryKey: ['owners'],
    enabled: !!tenant,
  });

  // Preserve roles on update
  const { data: usersData } = authClient.users.getUsers.useQuery({
    queryKey: ['users'],
    enabled: !!tenant,
  });

  const owners = ownersData?.body.data ?? [];
  const selected = useMemo(() => owners.find((o: any) => o.user.id === userId), [owners, userId]);
  const rolesForUser: number[] = useMemo(() => {
    const users = usersData?.body.data ?? [];
    const u = users.find((u: any) => u.id === userId);
    return (u?.roles ?? []).map((r: any) => r.roleId as number);
  }, [usersData, userId]);

  const form = useForm<OwnerFormValues>({
    resolver: zodResolver(ownerFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
    },
  });

  // Reset form when selected owner changes
  useEffect(() => {
    if (selected) {
      form.reset({
        name: selected.user?.name ?? '',
        email: selected.user?.email ?? '',
        phone: selected.owner?.phone ?? '',
        address: selected.owner?.address ?? '',
      });
    }
  }, [selected, form]);

  const { mutate: updateUser } = authClient.users.updateUser.useMutation();

  if (ownersLoading || !selected) return <Loading />;

  const onSubmit = (values: OwnerFormValues) => {
    updateUser(
      {
        params: { id: userId },
        body: {
          user: { name: values.name, email: values.email, userType: 'owner' },
          roles: rolesForUser,
          owner: {
            userId,
            phone: values.phone || null,
            address: values.address || null,
          },
        },
      },
      {
        onSuccess: async () => {
          toast.success('Owner profile updated');
          await refetch();
          form.reset(values); // Reset dirty state with new values
        },
        onError: () => {
          toast.error('Failed to update owner profile');
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={form.formState.isSubmitting} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="email" {...field} disabled={form.formState.isSubmitting} />
                  </FormControl>
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
                  <FormControl>
                    <Input {...field} disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={form.formState.isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.isDirty && (
              <div className="md:col-span-2">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}