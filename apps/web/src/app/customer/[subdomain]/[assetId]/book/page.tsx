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
import { ArrowLeft, Calendar, CheckCircle2, Loader2 } from 'lucide-react';
import { DynamicFormField } from '@/components/forms/DynamicFormField';
import { useMemo } from 'react';
import { DateRangePicker, BlockedDateRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { parseAsLocalDate } from '@/lib/utils/date';

// Base schema
const BaseCustomerBookingObjectSchema = z.object({
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

type CustomerBookingFormData = z.infer<typeof BaseCustomerBookingObjectSchema> & Record<string, any>;

export default function CustomerBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const assetId = params.assetId as string;

  // Asset details
  const { data: response, isLoading, error: queryError } = client.assets.getAssetDetailsBySubdomain.useQuery({
    queryKey: ['asset-details', subdomain, assetId],
    queryData: { params: { subdomain, assetId } },
  });

  const asset = response?.status === 200 ? {
    id: response.body.id,
    name: response.body.name,
    description: response.body.description,
    tenantId: response.body.tenantId,
  } : null;

  // Forms for asset
  const { data: formsResponse, isLoading: isLoadingForms } = client.settings.form.getFormsForAssetPublic.useQuery({
    queryKey: ['forms-for-asset', assetId],
    queryData: { params: { assetId } },
    enabled: !!assetId,
  });

  const forms = formsResponse?.status === 200 ? formsResponse.body.forms : [];

  // Blocked dates
  const { data: blockedDatesResponse } = client.blockedDates.getBlockedDatesForAssetPublic.useQuery({
    queryKey: ['blocked-dates', assetId],
    queryData: { params: { assetId } },
    enabled: !!assetId,
  });

  const blockedDates: BlockedDateRange[] = blockedDatesResponse?.status === 200
    ? blockedDatesResponse.body.map(d => ({
      startDate: parseAsLocalDate(d.startDate as unknown as string),
      endDate: parseAsLocalDate(d.endDate as unknown as string),
    }))
    : [];

  // React Hook Form
  const dynamicSchema = useMemo(() => {
    const dynamicFields: Record<string, z.ZodTypeAny> = {};
    forms.forEach((formData) => {
      formData.fields.forEach((field) => {
        const key = `form_${formData.form.id}_${field.id}`;
        let schema: z.ZodTypeAny;
        switch (field.type) {
          case 'number':
            schema = field.required
              ? z.coerce.number({ required_error: `${field.name} is required`, invalid_type_error: `${field.name} must be a number` })
              : z.coerce.number().optional();
            break;
          case 'text':
          case 'textarea':
          case 'time':
          case 'date':
            schema = field.required ? z.string().min(1, `${field.name} is required`) : z.string().optional();
            break;
          case 'date_range':
            schema = field.required
              ? z.object({ start: z.string().min(1), end: z.string().min(1) })
              : z.object({ start: z.string().optional(), end: z.string().optional() }).optional();
            break;
          case 'range':
            schema = field.required
              ? z.number({ required_error: `${field.name} is required`, invalid_type_error: `${field.name} must be a number` })
              : z.number().optional();
            break;
          case 'boolean':
            schema = field.required ? z.boolean().refine(val => val === true, { message: `${field.name} must be checked` }) : z.boolean().optional();
            break;
          default:
            schema = field.required ? z.string().min(1, `${field.name} is required`) : z.string().optional();
        }
        dynamicFields[key] = schema;
      });
    });
    return BaseCustomerBookingObjectSchema.extend(dynamicFields);
  }, [forms]);

  const form = useForm<CustomerBookingFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: { dateRange: { from: undefined, to: undefined }, customerName: '', customerEmail: '', customerPhone: '' },
  });

  const { mutate: createBooking, isPending } = client.booking.customerCreateBooking.useMutation();

  // Watch selected dates
  const selectedDates = form.watch('dateRange');

  // Fetch rates for asset
  const { data: ratesResponse, isLoading: isRateLoading } = client.rates.getPublicRate.useQuery({
    queryKey: ['public-rate', subdomain, Number(assetId)],
    queryData: { params: { subdomain, id: Number(assetId) } },
    enabled: !!subdomain && !!assetId,
  });

  // Get the rates array from response
  const rate =
    ratesResponse?.status === 200 &&
      Array.isArray((ratesResponse.body as any).data)
      ? (ratesResponse.body as any).data[0]?.rate ?? null
      : null;

  // Find correct rate for selected start date

  const numberOfNights =
    selectedDates?.from && selectedDates?.to
      ? Math.ceil(
        (selectedDates.to.getTime() - selectedDates.from.getTime()) /
        (1000 * 60 * 60 * 24)
      )
      : 0;

  const pricePerUnit = rate ? Number(rate.pricePerUnit) : 0;

  const totalPrice = pricePerUnit * numberOfNights;


  const onSubmit = (data: CustomerBookingFormData) => {
    if (!asset) return;

    const formResponses: Array<{ formFieldId: number; value: string }> = [];
    forms.forEach((formData) => {
      formData.fields.forEach((field) => {
        const key = `form_${formData.form.id}_${field.id}`;
        const val = data[key];
        if (val !== undefined && val !== null && val !== '') {
          formResponses.push({ formFieldId: field.id, value: typeof val === 'object' ? JSON.stringify(val) : String(val) });
        }
      });
    });

    createBooking(
      {
        params: { tenantId: asset.tenantId },
        body: {
          booking: { assetId: asset.id, startDate: data.dateRange.from, endDate: data.dateRange.to },
          customer: { name: data.customerName, email: data.customerEmail, phone: data.customerPhone },
          formResponses: formResponses.length > 0 ? formResponses : undefined,
        },
      },
      {
        onSuccess: (response) => {
          if (response.status === 201) {
            toast.success('Booking confirmed! Check your email for details.');
            router.push(`/customer/${subdomain}`);
          } else toast.error('Failed to create booking. Please try again.');
        },
        onError: (err: any) => {
          toast.error(err?.body?.message || err?.message || 'Failed to create booking.');
          console.error(err);
        },
      }
    );
  };

  if (isLoading || isLoadingForms) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (queryError || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Asset Not Found</h2>
            <p className="text-muted-foreground mb-6">We couldn't find the asset you're trying to book.</p>
            <Button asChild><Link href={`/customer/${subdomain}`}>Back to Assets</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href={`/customer/${subdomain}/${assetId}`} className="inline-flex items-center text-primary hover:text-primary mb-6">
          <ArrowLeft className="w-5 h-5 mr-2" />Back to asset details
        </Link>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Book {asset.name}</CardTitle>
                <CardDescription>Fill out the form below to make a reservation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Date Picker */}
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

                {/* Rate & total */}
                {selectedDates?.from && selectedDates?.to && (
                  <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded">
                    {isRateLoading ? (
                      <p className="text-muted-foreground">Checking rate...</p>
                    ) : rate ? (
                      <>
                        <p className="text-green-800 font-medium">
                          Rate: ${pricePerUnit} per night
                        </p>
                        <p className="text-green-900 font-semibold">
                          Total for {numberOfNights} night{numberOfNights !== 1 ? 's' : ''}: $
                          {totalPrice}
                        </p>
                      </>
                    ) : (
                      <p className="text-red-600 font-medium">
                        No rate available
                      </p>
                    )}
                  </div>
                )}


                <Separator />

                {/* Customer info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Your Information</h3>
                  <FormField control={form.control} name="customerName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customerEmail" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl><Input type="email" placeholder="john@example.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="customerPhone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl><Input type="tel" placeholder="+1 (555) 123-4567" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                {/* Dynamic forms */}
                {forms.length > 0 && (
                  <>
                    <Separator />
                    {forms.map((formData) => (
                      <div key={formData.form.id} className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{formData.form.name}</h3>
                          {formData.form.description && <p className="text-sm text-muted-foreground mt-1">{formData.form.description}</p>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.fields.map((field) => {
                            const key = `form_${formData.form.id}_${field.id}` as any;
                            return (
                              <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                <DynamicFormField control={form.control} name={key} label={field.name} type={field.type as any} required={field.required} />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Submit / Cancel */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isPending} className="flex-1">
                    {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>) : (<><CheckCircle2 className="mr-2 h-4 w-4" />Confirm Booking</>)}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/customer/${subdomain}/${assetId}`}>Cancel</Link>
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center">* Required fields</p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
