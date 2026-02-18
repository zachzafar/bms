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
import { useMemo, useState } from 'react';
import { DateRangePicker, BlockedDateRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { parseAsLocalDate } from '@/lib/utils/date';
import { Plus, Minus } from 'lucide-react';

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

  // Add-ons
  const { data: addonsResponse } = client.addons.getPublicAddons.useQuery({
    queryKey: ['public-addons', subdomain],
    queryData: { params: { subdomain } },
    enabled: !!subdomain,
  });
  const availableAddons = addonsResponse?.status === 200 ? addonsResponse.body : [];
  const [selectedAddons, setSelectedAddons] = useState<Record<number, number>>({});

  const updateAddonQty = (addonId: number, delta: number) => {
    setSelectedAddons(prev => {
      const current = prev[addonId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [addonId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: next };
    });
  };

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

  // Fetch all rates for asset
  const { data: ratesResponse, isLoading: isRateLoading } = client.rates.getPublicRates.useQuery({
    queryKey: ['public-rates', subdomain, assetId],
    queryData: { params: { subdomain }, query: { assetId, pageSize: 100 } },
    enabled: !!subdomain && !!assetId,
  });

  const allRates = ratesResponse?.status === 200 ? ratesResponse.body.data.map(d => d.rate) : [];

  // Compute split-rate pricing based on selected dates
  const { rateSegments, totalPrice, numberOfNights } = useMemo(() => {
    if (!selectedDates?.from || !selectedDates?.to || allRates.length === 0) {
      return { rateSegments: [] as Array<{ rateName: string; pricePerUnit: number; days: number; subtotal: number }>, totalPrice: 0, numberOfNights: 0 };
    }

    const nights = Math.ceil((selectedDates.to.getTime() - selectedDates.from.getTime()) / (1000 * 60 * 60 * 24));
    const segments: Array<{ rateName: string; pricePerUnit: number; days: number; subtotal: number }> = [];
    const current = new Date(selectedDates.from);
    let currentRate: any = null;
    let segDays = 0;

    while (current < selectedDates.to) {
      const dayRate = allRates
        .filter(r => {
          if (!r.startDate || !r.endDate) return false;
          const rs = new Date(r.startDate); rs.setHours(0, 0, 0, 0);
          const re = new Date(r.endDate); re.setHours(0, 0, 0, 0);
          const cd = new Date(current); cd.setHours(0, 0, 0, 0);
          return cd >= rs && cd <= re;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

      if (currentRate && dayRate && currentRate.id === dayRate.id) {
        segDays++;
      } else {
        if (currentRate && segDays > 0) {
          const ppu = Number(currentRate.pricePerUnit) || 0;
          segments.push({ rateName: currentRate.name, pricePerUnit: ppu, days: segDays, subtotal: ppu * segDays });
        }
        currentRate = dayRate;
        segDays = dayRate ? 1 : 0;
      }

      current.setDate(current.getDate() + 1);
    }

    if (currentRate && segDays > 0) {
      const ppu = Number(currentRate.pricePerUnit) || 0;
      segments.push({ rateName: currentRate.name, pricePerUnit: ppu, days: segDays, subtotal: ppu * segDays });
    }

    const total = segments.reduce((sum, s) => sum + s.subtotal, 0);
    return { rateSegments: segments, totalPrice: total, numberOfNights: nights };
  }, [selectedDates?.from, selectedDates?.to, allRates]);


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

    const addonSelections = Object.entries(selectedAddons)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ addonItemId: Number(id), quantity: qty }));

    createBooking(
      {
        params: { tenantId: asset.tenantId },
        body: {
          booking: { assetId: asset.id, startDate: data.dateRange.from, endDate: data.dateRange.to },
          customer: { name: data.customerName, email: data.customerEmail, phone: data.customerPhone },
          formResponses: formResponses.length > 0 ? formResponses : undefined,
          addons: addonSelections.length > 0 ? addonSelections : undefined,
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
                    ) : rateSegments.length > 0 ? (
                      <>
                        {rateSegments.map((seg, i) => (
                          <p key={i} className="text-green-800 font-medium">
                            {seg.days} night{seg.days !== 1 ? 's' : ''} at ${seg.pricePerUnit}/night = ${seg.subtotal}
                          </p>
                        ))}
                        {Object.entries(selectedAddons).map(([addonIdStr, qty]) => {
                          const addon = availableAddons.find((a: any) => a.id === Number(addonIdStr));
                          if (!addon || qty === 0) return null;
                          const price = Number(addon.price);
                          const addonTotal = addon.billingType === 'per_unit'
                            ? price * qty * numberOfNights
                            : price * qty;
                          return (
                            <p key={addonIdStr} className="text-green-800 font-medium">
                              {addon.name} x{qty}{addon.billingType === 'per_unit' ? ` x ${numberOfNights} night${numberOfNights !== 1 ? 's' : ''}` : ''} = ${addonTotal.toFixed(2)}
                            </p>
                          );
                        })}
                        <p className="text-green-900 font-semibold mt-1">
                          Total: ${(totalPrice + Object.entries(selectedAddons).reduce((sum, [id, qty]) => {
                            const addon = availableAddons.find((a: any) => a.id === Number(id));
                            if (!addon) return sum;
                            const price = Number(addon.price);
                            return sum + (addon.billingType === 'per_unit' ? price * qty * numberOfNights : price * qty);
                          }, 0)).toFixed(2)}
                        </p>
                      </>
                    ) : (
                      <p className="text-red-600 font-medium">
                        No rate available for the selected dates
                      </p>
                    )}
                  </div>
                )}

                {/* Add-ons */}
                {availableAddons.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground">Add-Ons</h3>
                    <div className="space-y-2">
                      {availableAddons.map((addon: any) => (
                        <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{addon.name}</p>
                            <p className="text-sm text-muted-foreground">
                              ${Number(addon.price).toFixed(2)} {addon.billingType === 'per_unit' ? '/ unit' : '(flat)'}
                            </p>
                            {addon.description && (
                              <p className="text-xs text-muted-foreground">{addon.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateAddonQty(addon.id, -1)}
                              disabled={!selectedAddons[addon.id]}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {selectedAddons[addon.id] || 0}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateAddonQty(addon.id, 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
