'use client';

import { useParams, useRouter } from 'next/navigation';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, CheckCircle2, Loader2, ImageIcon, Plus, Minus } from 'lucide-react';
import Image from 'next/image';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { DynamicFormField } from '@/components/forms/DynamicFormField';
import { useMemo, useState } from 'react';
import { useTagBookingData } from './_hooks/useTagBookingData';
import { useBookingPriceQuote } from './_hooks/useBookingPriceQuote';
import { buildDynamicSchema, CustomerTagBookingFormData } from './_lib/buildDynamicSchema';
import { PriceSummary } from './_components/PriceSummary';

export default function TagBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const tagSlug = params.tagId as string;

  const {
    tenantId,
    assetType,
    assetTypeId,
    forms,
    blockedDates,
    availableAddons,
    isLoading,
  } = useTagBookingData(subdomain, tagSlug);

  const [selectedAddons, setSelectedAddons] = useState<Record<number, number>>({});

  const updateAddonQty = (addonId: number, delta: number) => {
    setSelectedAddons((prev) => {
      const next = Math.max(0, (prev[addonId] ?? 0) + delta);
      if (next === 0) {
        const { [addonId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: next };
    });
  };

  const dynamicSchema = useMemo(() => buildDynamicSchema(forms), [forms]);

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

  const selectedDates = form.watch('dateRange');

  const { quote, isLoading: isQuoteLoading, error: quoteError } = useBookingPriceQuote(
    subdomain,
    assetTypeId,
    selectedDates?.from,
    selectedDates?.to,
    selectedAddons,
  );

  const onSubmit = (data: CustomerTagBookingFormData) => {
    if (!tenantId) {
      toast.error('Unable to process booking. Please try again.');
      return;
    }

    const formResponses = forms.flatMap((formData) =>
      formData.fields.flatMap((field) => {
        const value = data[`form_${formData.form.id}_${field.id}`];
        if (value === undefined || value === null || value === '') return [];
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        return [{ formFieldId: field.id, value: stringValue }];
      }),
    );

    const addonSelections = Object.entries(selectedAddons)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ addonItemId: Number(id), quantity: qty }));

    createBookingByTag(
      {
        params: { tenantId },
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
            setTimeout(() => router.push(`/customer/${subdomain}`), 2000);
          } else if (response.status === 404) {
            toast.error(response.body.message || 'No available options for the selected dates.');
          }
        },
        onError: (err: any) => {
          toast.error(err?.body?.message || err?.message || 'Failed to create booking. Please try again.');
          console.error(err);
        },
      },
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
              <p className="text-muted-foreground mb-6">We couldn't find the category you're trying to book.</p>
              <Button asChild>
                <Link href={`/customer/${subdomain}`}>Back to Categories</Link>
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
              <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                {assetType.image ? (
                  <Image src={assetType.image} alt={assetType.name} fill className="object-cover" />
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
                  <PriceSummary
                    quote={quote}
                    isLoading={isQuoteLoading}
                    error={quoteError}
                  />
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
                            <span className="w-8 text-center font-medium">{selectedAddons[addon.id] ?? 0}</span>
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

                {/* Dynamic Forms */}
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
                          {formData.fields.map((field) => (
                            <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                              <DynamicFormField
                                control={form.control}
                                name={`form_${formData.form.id}_${field.id}` as any}
                                label={field.name}
                                type={field.type as any}
                                required={field.required}
                              />
                            </div>
                          ))}
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

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <Button type="submit" disabled={isPending} className="flex-1">
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
                  <Button type="button" variant="outline" asChild>
                    <Link href={`/customer/${subdomain}/tag/${tagSlug}`}>Cancel</Link>
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
