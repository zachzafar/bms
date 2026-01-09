'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { authClient } from '@/lib/api/publicClient';
import { StorageService } from '@/lib/api/storage';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';

const SettingsSchema = z.object({
  enableAutomaticConfirmation: z.boolean(),
});

type SettingsFormValues = z.infer<typeof SettingsSchema>;

export default function BookingSettingsPage() {
  const currentTenant = StorageService.getTenant();
  const tenantId = currentTenant?.id;

  // Fetch tenant data
  const { data: tenantData, isLoading } = authClient.tenants.getTenantsDetails.useQuery({
    queryKey: ['tenant', tenantId],
    queryData: { query: { tenants: tenantId ? [tenantId] : [] } },
    enabled: !!tenantId,
  });

  const tenant = tenantData?.body?.[0];

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      enableAutomaticConfirmation: true,
    },
  });

  // Update form when tenant data loads
  useEffect(() => {
    if (tenant) {
      form.reset({
        enableAutomaticConfirmation: tenant.enableAutomaticConfirmation ?? true,
      });
    }
  }, [tenant, form]);

  const { mutate: updateTenant, isPending: isSaving } = authClient.tenants.update.useMutation();

  const onSubmit = (values: SettingsFormValues) => {
    if (!tenantId || !tenant) {
      toast.error('Tenant information not found');
      return;
    }

    updateTenant(
      {
        params: { id: tenantId },
        body: {
          tenant: {
            ...tenant,
            enableAutomaticConfirmation: values.enableAutomaticConfirmation,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success('Settings updated successfully!');
        },
        onError: (error) => {
          console.error(error);
          toast.error('Failed to update settings');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center">
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Booking Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your booking preferences and configurations
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Confirmation</CardTitle>
              <CardDescription>
                Control how bookings are confirmed in your system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="enableAutomaticConfirmation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Automatic Confirmation
                      </FormLabel>
                      <FormDescription>
                        When enabled, new bookings will be automatically confirmed.
                        When disabled, bookings will require manual confirmation by an admin.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> When automatic confirmation is disabled:
                </p>
                <ul className="list-disc list-inside text-sm text-blue-800 mt-2 space-y-1">
                  <li>New bookings will have a "Pending" status</li>
                  <li>Customers will receive an email indicating their booking is awaiting confirmation</li>
                  <li>Admins will be notified to review and confirm the booking</li>
                  <li>You can manually confirm or cancel bookings from the bookings list</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
