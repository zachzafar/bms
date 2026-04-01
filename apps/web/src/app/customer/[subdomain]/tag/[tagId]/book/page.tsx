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
import { ArrowLeft, Calendar, CheckCircle2, Loader2, ImageIcon, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { DateRangePicker, BlockedDateRange } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { DynamicFormField } from '@/components/forms/DynamicFormField';
import { parseAsLocalDate } from '@/lib/utils/date';
import { useMemo, useState } from 'react';

// Base schema for customer booking by tag (without refinement)
const BaseCustomerTagBookingSchema = z.object({
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

type CustomerTagBookingFormData = z.infer<typeof BaseCustomerTagBookingSchema> & Record<string, any>;

export default function TagBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const tagSlug = params.tagId as string;

  // Fetch tenant to get tenantId
  const { data: tenantResponse, isLoading: isTenantLoading } = client.tenants.getTenantBySubdomain.useQuery({
    queryKey: ['tenant-settings', subdomain],
    queryData: {
      params: { subdomain },
    },
  });

  const tenantId = tenantResponse?.status === 200 ? tenantResponse.body.id : null;

  const { data: assetTypesResponse, isLoading: AssetTypeLoading } = client.settings.assetType.customerGetAssetType.useQuery({
    queryKey: ['assetTypes-by-subdomain', subdomain, tagSlug],
    queryData: {
      params: { subdomain, id: tagSlug },
    },
  });

  const assetType = assetTypesResponse?.status === 200 ? assetTypesResponse.body : null;
  // Numeric id resolved from the response — used for all sub-queries that require a number
  const assetTypeId = assetType?.id ?? 0;

  // Fetch forms for this asset type
  const { data: formsResponse, isLoading: isLoadingForms } = client.settings.form.getFormsForAssetTypePublic.useQuery({
    queryKey: ['forms-for-asset-type', assetTypeId],
    queryData: {
      params: { assetTypeId },
    },
    enabled: !!assetTypeId,
  });

  const forms = formsResponse?.status === 200 ? formsResponse.body.forms : [];

  // Fetch blocked dates for this asset type (without date range filter to get all blocked dates)
  const { data: blockedDatesResponse } = client.blockedDates.getBlockedDatesForAssetTypePublic.useQuery({
    queryKey: ['blocked-dates-tag', assetTypeId],
    queryData: {
      params: { assetTypeId: assetTypeId },
      query: {}
    },
    enabled: !!assetTypeId,
  });

  const blockedDates: BlockedDateRange[] = blockedDatesResponse?.status === 200
    ? blockedDatesResponse.body.map(d => ({
        startDate: parseAsLocalDate(d.start as unknown as string),
        endDate: parseAsLocalDate(d.end as unknown as string),
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

  // Taxes & Fees
  const { data: taxFeesResponse } = client.taxesFees.getPublicTaxFees.useQuery({
    queryKey: ['public-tax-fees', subdomain],
    queryData: { params: { subdomain } },
    enabled: !!subdomain,
  });
  const availableTaxFees = taxFeesResponse?.status === 200 ? taxFeesResponse.body : [];

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

  // Build dynamic schema based on forms
  const dynamicSchema = useMemo(() => {
    const dynamicFields: Record<string, z.ZodTypeAny> = {};

    forms.forEach((formData) => {
      formData.fields.forEach((field) => {
        const fieldKey = `form_${formData.form.id}_${field.id}`;

        // Create appropriate zod validator based on field type and required status
        let fieldSchema: z.ZodTypeAny;

        switch (field.type) {
          case 'number':
            if (field.required) {
              fieldSchema = z.coerce.number({
                required_error: `${field.name} is required`,
                invalid_type_error: `${field.name} must be a number`
              });
            } else {
              fieldSchema = z.coerce.number().optional();
            }
            break;

          case 'text':
          case 'textarea':
          case 'time':
          case 'date':
            if (field.required) {
              fieldSchema = z.string().min(1, `${field.name} is required`);
            } else {
              fieldSchema = z.string().optional();
            }
            break;

          case 'date_range':
            if (field.required) {
              fieldSchema = z.object({
                start: z.string().min(1, `${field.name} start date is required`),
                end: z.string().min(1, `${field.name} end date is required`),
              });
            } else {
              fieldSchema = z.object({
                start: z.string().optional(),
                end: z.string().optional(),
              }).optional();
            }
            break;

          case 'range':
            if (field.required) {
              fieldSchema = z.number({
                required_error: `${field.name} is required`,
                invalid_type_error: `${field.name} must be a number`
              });
            } else {
              fieldSchema = z.number().optional();
            }
            break;

          case 'boolean':
            if (field.required) {
              fieldSchema = z.boolean().refine((val) => val === true, {
                message: `${field.name} must be checked`,
              });
            } else {
              fieldSchema = z.boolean().optional();
            }
            break;

          default:
            if (field.required) {
              fieldSchema = z.string().min(1, `${field.name} is required`);
            } else {
              fieldSchema = z.string().optional();
            }
        }

        dynamicFields[fieldKey] = fieldSchema;
      });
    });

    // Extend base schema with dynamic fields
    return BaseCustomerTagBookingSchema.extend(dynamicFields);
  }, [forms]);

  const isLoading = isTenantLoading || AssetTypeLoading || isLoadingForms;

  const form = useForm<CustomerTagBookingFormData>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      dateRange: { from: undefined, to: undefined },
      customerName: '',
      customerEmail: '',
      customerPhone: '',
    },
  });

  const { mutate: createBookingByTag, isPending } = client.booking.customerCreateBookingByAssetType.useMutation();

  // Watch selected dates
  const selectedDates = form.watch('dateRange');

  // Fetch all rates for asset type
  const { data: ratesResponse, isLoading: isRateLoading } = client.rates.getPublicRates.useQuery({
    queryKey: ['public-rates', subdomain, assetTypeId],
    queryData: { params: { subdomain }, query: { assetTypeId, pageSize: 100 } },
    enabled: !!subdomain && Number.isInteger(assetTypeId),
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
      const cursorMonth = current.getMonth() + 1;
      const cursorDay = current.getDate();
      const cursorProxy = cursorMonth * 32 + cursorDay;
      const dayRate = allRates
        .filter(r => {
          if (!r.startMonth || !r.startDay || !r.endMonth || !r.endDay) return false;
          const start = r.startMonth * 32 + r.startDay;
          const end = r.endMonth * 32 + r.endDay;
          return end < start
            ? cursorProxy >= start || cursorProxy <= end
            : cursorProxy >= start && cursorProxy <= end;
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

  const onSubmit = (data: CustomerTagBookingFormData) => {
    if (!tenantId) {
      toast.error('Unable to process booking. Please try again.');
      return;
    }

    // Collect form responses from the submitted data
    const formResponses: Array<{ formFieldId: number; value: string }> = [];

    forms.forEach((formData) => {
      formData.fields.forEach((field) => {
        const fieldKey = `form_${formData.form.id}_${field.id}`;
        const fieldValue = data[fieldKey];

        if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
          // Handle different field types
          let stringValue: string;

          if (typeof fieldValue === 'object' && fieldValue !== null) {
            // Handle date_range type
            if ('start' in fieldValue && 'end' in fieldValue) {
              stringValue = JSON.stringify(fieldValue);
            } else {
              stringValue = JSON.stringify(fieldValue);
            }
          } else if (typeof fieldValue === 'boolean') {
            stringValue = fieldValue.toString();
          } else {
            stringValue = String(fieldValue);
          }

          formResponses.push({
            formFieldId: field.id,
            value: stringValue
          });
        }
      });
    });

    const addonSelections = Object.entries(selectedAddons)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ addonItemId: Number(id), quantity: qty }));

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
          formResponses: formResponses.length > 0 ? formResponses : undefined,
          addons: addonSelections.length > 0 ? addonSelections : undefined,
        },
      },
      {
        onSuccess: (response: any) => {
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
          // Extract error message from API response
          const errorMessage = err?.body?.message || err?.message || 'Failed to create booking. Please try again.';
          toast.error(errorMessage);
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
          href={`/customer/${subdomain}/tag/${tagSlug}`}
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
                        {(() => {
                          const addonsTotal = Object.entries(selectedAddons).reduce((sum, [id, qty]) => {
                            const addon = availableAddons.find((a: any) => a.id === Number(id));
                            if (!addon) return sum;
                            const price = Number(addon.price);
                            return sum + (addon.billingType === 'per_unit' ? price * qty * numberOfNights : price * qty);
                          }, 0);
                          const subtotal = totalPrice + addonsTotal;
                          // Calculate taxes/fees (NET then GROSS)
                          const sorted = [...availableTaxFees].sort((a: any, b: any) => a.sortOrder - b.sortOrder);
                          const netItems = sorted.filter((tf: any) => tf.calculationBasis === 'net');
                          const grossItems = sorted.filter((tf: any) => tf.calculationBasis === 'gross');
                          const computeTf = (tf: any, base: number) => {
                            const rate = Number(tf.rate);
                            let amount = 0;
                            if (tf.calculationType === 'percentage') amount = base * (rate / 100);
                            else if (tf.calculationType === 'fixed_per_unit') {
                              const units = tf.maxUnits ? Math.min(numberOfNights, tf.maxUnits) : numberOfNights;
                              amount = rate * units;
                            } else amount = rate;
                            if (tf.minAmount) amount = Math.max(amount, Number(tf.minAmount));
                            if (tf.maxAmount) amount = Math.min(amount, Number(tf.maxAmount));
                            return Math.round(amount * 100) / 100;
                          };
                          let netTaxTotal = 0;
                          const taxLines: Array<{ name: string; amount: number; rate: string; calcType: string }> = [];
                          for (const tf of netItems) {
                            const amt = computeTf(tf, subtotal);
                            netTaxTotal += amt;
                            taxLines.push({ name: tf.name, amount: amt, rate: tf.rate, calcType: tf.calculationType });
                          }
                          const grossBase = subtotal + netTaxTotal;
                          let grossTaxTotal = 0;
                          for (const tf of grossItems) {
                            const amt = computeTf(tf, grossBase);
                            grossTaxTotal += amt;
                            taxLines.push({ name: tf.name, amount: amt, rate: tf.rate, calcType: tf.calculationType });
                          }
                          const totalTax = netTaxTotal + grossTaxTotal;
                          const grandTotal = subtotal + totalTax;
                          return (
                            <>
                              {taxLines.map((line, i) => (
                                <p key={`tax-${i}`} className="text-green-800 font-medium">
                                  {line.name}{line.calcType === 'percentage' ? ` (${Number(line.rate)}%)` : ''}: ${line.amount.toFixed(2)}
                                </p>
                              ))}
                              <p className="text-green-900 font-semibold mt-1">
                                Total: ${grandTotal.toFixed(2)}
                              </p>
                            </>
                          );
                        })()}
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

                {/* Dynamic Forms Section */}
                {forms.length > 0 && (
                  <>
                    <Separator />
                    {forms.map((formData) => (
                      <div key={formData.form.id} className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{formData.form.name}</h3>
                          {formData.form.description && (
                            <p className="text-sm text-muted-foreground mt-1">{formData.form.description}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {formData.fields.map((field) => {
                            const fieldKey = `form_${formData.form.id}_${field.id}` as any;
                            return (
                              <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                <DynamicFormField
                                  control={form.control}
                                  name={fieldKey}
                                  label={field.name}
                                  type={field.type as any}
                                  required={field.required}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </>
                )}

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
                    <Link href={`/customer/${subdomain}/tag/${tagSlug}`}>
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
