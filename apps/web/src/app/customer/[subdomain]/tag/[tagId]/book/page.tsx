'use client';

import { useParams, useRouter } from 'next/navigation';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, CheckCircle2, Loader2, ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { DateRangePicker, BlockedDateRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';

// Schema for customer booking by tag
const CustomerTagBookingSchema = z.object({
  dateRange: z.object({
    from: z.date({ required_error: 'Start date is required' }),
    to: z.date({ required_error: 'End date is required' }),
  }).refine((data) => data.from && data.to, {
    message: 'Please select both start and end dates',
  }),
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().min(10, 'Phone number must be at least 10 characters'),
});

type CustomerTagBookingFormData = z.infer<typeof CustomerTagBookingSchema>;

export default function TagBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const assetTypeId = parseInt(params.tagId as string);

  // Fetch tenant to get tenantId
  const { data: tenantResponse, isLoading: isTenantLoading } = client.tenants.getTenantBySubdomain.useQuery({
    queryKey: ['tenant-settings', subdomain],
    queryData: {
      params: { subdomain },
    },
  });

  const tenantId = tenantResponse?.status === 200 ? tenantResponse.body.id : null;


  const { data: assetTypesResponse, isLoading: AssetTypeLoading, error: tagsError, refetch: refetchTags } = client.settings.assetType.customerGetAssetType.useQuery({
      queryKey: ['assetTypes-by-subdomain', subdomain],
      queryData: {
        params: { subdomain, id: assetTypeId },
      },
    });

  const assetType = assetTypesResponse?.status === 200 ? assetTypesResponse.body : null;

  const startDate = new Date();
  const endDate = new Date(startDate.getDate() + 60) 
  // Fetch blocked dates for this tag
  const { data: blockedDatesResponse } = client.booking.getBlockedDatesForAssetTypePublic.useQuery({
    queryKey: ['blocked-dates-tag', assetTypeId],
    queryData: {
      params: { assetTypeId: assetTypeId, startDate, endDate },
    },
    enabled: !!assetTypeId,
  });

  const blockedDates: BlockedDateRange[] = blockedDatesResponse?.status === 200
    ? blockedDatesResponse.body.map(d => ({
        startDate: new Date(d.start),
        endDate: new Date(d.end),
      }))
    : [];

  const isLoading = isTenantLoading || AssetTypeLoading;

  const form = useForm<CustomerTagBookingFormData>({
    resolver: zodResolver(CustomerTagBookingSchema),
    defaultValues: {
      dateRange: { from: undefined, to: undefined },
      customerName: '',
      customerEmail: '',
      customerPhone: '',
    },
  });

  const { mutate: createBookingByTag, isPending } = client.booking.customerCreateBookingByAssetType.useMutation();

  const onSubmit = (data: CustomerTagBookingFormData) => {
    if (!tenantId) {
      toast.error('Unable to process booking. Please try again.');
      return;
    }

    createBookingByTag(
      {
        params: {
          tenantId,
        },
        body: {
          assetTypeId,
          startDate: data.dateRange.from,
          endDate: data.dateRange.to,
          customer: {
            name: data.customerName,
            email: data.customerEmail,
            phone: data.customerPhone,
          },
        },
      },
      {
        onSuccess: (response:any) => {
          if (response.status === 201) {
            toast.success(`Booking confirmed! You've been assigned: ${response.body.assetName}. Check your email for details.`);
            // Delay redirect to let user see the success message
            setTimeout(() => {
              router.push(`/customer/${subdomain}`);
            }, 2000);
          } else if (response.status === 404) {
            toast.error(response.body.message || 'No available options for the selected dates.');
          }
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to create booking. Please try again.');
          console.error(err);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!assetType || !tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Category Not Found</h2>
              <p className="text-muted-foreground mb-6">
                We couldn't find the category you're trying to book.
              </p>
              <Button asChild>
                <Link href={`/customer/${subdomain}`}>
                  Back to Categories
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href={`/customer/${subdomain}/tag/${assetTypeId}`}
          className="inline-flex items-center text-primary hover:text-primary mb-6"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to category details
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              {/* Tag Image Thumbnail */}
              <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {assetType.image ? (
                  <Image
                    src={assetType.image}
                    alt={assetType.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground opacity-50" />
                )}
              </div>
              <div>
                <CardTitle className="text-2xl">Book {assetType.name}</CardTitle>
                <CardDescription>We'll assign the best available option for your dates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Date Selection */}
                <FormField
                  control={form.control}
                  name="dateRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Dates *</FormLabel>
                      <FormControl>
                        <DateRangePicker
                          value={field.value as DateRange}
                          onChange={field.onChange}
                          blockedDates={blockedDates}
                          minDate={new Date()}
                          placeholder="Select your booking dates"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Your Information</h3>

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Info Notice */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">How it works</p>
                      <p className="text-muted-foreground">
                        When you submit this form, we'll automatically assign the best available option
                        from the "{assetType.name}" category for your selected dates. You'll receive a confirmation
                        email with the specific assignment details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Important Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Please note:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>You'll receive a confirmation email with booking details</li>
                        <li>Dates are subject to availability</li>
                        <li>The email will include a link to update your booking</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirm Booking
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/customer/${subdomain}/tag/${assetTypeId}`}>
                      Cancel
                    </Link>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  * Required fields
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
