'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { authClient } from '@/lib/api/publicClient';
import { TENANTS_QUERY_KEY } from '@/lib/api/queryKeys';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const TenantSettingsSchema = z.object({
  enableAutomaticConfirmation: z.boolean(),
  booksByAssetType: z.boolean(),
  logoUrl: z.string().optional(),
  backgroundImage: z.string().optional(),
});

type TenantSettingsFormValues = z.infer<typeof TenantSettingsSchema>;

export default function TenantSettingsPage() {
  const params = useParams();
  const tenantId = params.id as string;

  // Fetch tenant data
  const { data: tenantData, isLoading, refetch } = authClient.systemAdmin.getTenant.useQuery({
    queryData: { params: { id: tenantId } },
    queryKey: [...TENANTS_QUERY_KEY, tenantId],
    enabled: !!tenantId,
  });

  const tenant = tenantData?.body?.tenant;

  const form = useForm<TenantSettingsFormValues>({
    resolver: zodResolver(TenantSettingsSchema),
    defaultValues: {
      enableAutomaticConfirmation: true,
      booksByAssetType: false,
      logoUrl: '',
      backgroundImage: '',
    },
  });

  // Update form when tenant data loads
  useEffect(() => {
    if (tenant) {
      form.reset({
        enableAutomaticConfirmation: tenant.enableAutomaticConfirmation ?? true,
        booksByAssetType: tenant.booksByAssetType ?? false,
        logoUrl: tenant.logoUrl ?? '',
        backgroundImage: tenant.backgroundImage ?? '',
      });
    }
  }, [tenant, form]);

  const { mutate: updateTenant, isPending: isSaving } = authClient.systemAdmin.updateTenant.useMutation();

  const onSubmit = (values: TenantSettingsFormValues) => {
    if (!tenantId) {
      toast.error('Tenant information not found');
      return;
    }

    updateTenant(
      {
        params: { id: tenantId },
        body: {
          tenant: {
            enableAutomaticConfirmation: values.enableAutomaticConfirmation,
            booksByAssetType: values.booksByAssetType,
            logoUrl: values.logoUrl || null,
            backgroundImage: values.backgroundImage || null,
          },
        },
      },
      {
        onSuccess: () => {
          toast.success('Settings updated successfully!');
          refetch();
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
      <div className="min-h-screen bg-card p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-muted rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-card p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Tenant Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The tenant you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/dashboard/tenants">
              <Button className="bg-primary hover:bg-primary/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tenants
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href={`/dashboard/tenants/${tenantId}`}>
            <Button variant="outline" size="sm" className="text-card-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">{tenant.name}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Confirmation</CardTitle>
                <CardDescription>
                  Control how bookings are confirmed for this tenant
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

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> When automatic confirmation is disabled:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>New bookings will have a "Pending" status</li>
                    <li>Customers will receive an email indicating their booking is awaiting confirmation</li>
                    <li>Admins will be notified to review and confirm the booking</li>
                    <li>Bookings can be manually confirmed or cancelled from the bookings list</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Booking Page</CardTitle>
                <CardDescription>
                  Configure how customers browse and book assets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="booksByAssetType"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Book by Asset Type
                        </FormLabel>
                        <FormDescription>
                          When enabled, customers will select an asset type instead of a specific asset.
                          The system will automatically assign an available asset from that type.
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

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>How it works:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Customers see asset types with images on the booking page</li>
                    <li>They select a type and choose their dates</li>
                    <li>The system automatically assigns the first available asset of that type</li>
                    <li>Great for rental businesses where customers don't need to choose specific items</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>
                  Customize the look of your customer and owner portals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Logo URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/logo.png"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the URL of your company logo. This will be displayed in the header of the customer and owner portals.
                      </FormDescription>
                      <FormMessage />
                      {field.value && (
                        <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                          <div className="relative h-16 w-40">
                            <Image
                              src={field.value}
                              alt="Logo preview"
                              fill
                              className="object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="backgroundImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Background Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/background.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the URL of a background image. This will be used as the page background in the customer and owner portals.
                      </FormDescription>
                      <FormMessage />
                      {field.value && (
                        <div className="mt-2 p-4 border rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                          <div className="relative h-32 w-full rounded overflow-hidden">
                            <Image
                              src={field.value}
                              alt="Background preview"
                              fill
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> For best results:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                    <li>Use a transparent PNG for your logo</li>
                    <li>Recommended logo size: 200x80 pixels or similar aspect ratio</li>
                    <li>Background images should be high resolution (at least 1920x1080)</li>
                    <li>Use images with subtle patterns or gradients for better text readability</li>
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
    </div>
  );
}
