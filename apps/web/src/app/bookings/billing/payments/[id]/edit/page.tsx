'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';

const EditPaymentSchema = z.object({
  paymentMethod: z.string().min(1, 'Payment method is required'),
  status: z.string().min(1, 'Status is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().min(1, 'Payment date is required'),
});

type EditPaymentFormValues = z.infer<typeof EditPaymentSchema>;

export default function EditPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

  const [payment, setPayment] = useState<any>(null);

  const { data: paymentData, isLoading: paymentLoading } = authClient.billing.getPayment.useQuery({
    queryKey: ['payment', paymentId],
    queryData: { params: { id: Number(paymentId) } },
  });

  const { data: customersData } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  const customers = customersData?.body.data ?? [];

  const customerName = useMemo(() => {
    if (!payment) return '';
    const found = customers.find((c: any) => Number(c.customer.id) === Number(payment.customerId));
    return found ? (found.user?.name || found.user?.email || `#${payment.customerId}`) : `#${payment.customerId}`;
  }, [customers, payment]);

  const form = useForm<EditPaymentFormValues>({
    resolver: zodResolver(EditPaymentSchema),
    defaultValues: {
      paymentMethod: 'credit_card',
      status: 'completed',
      reference: '',
      notes: '',
      paymentDate: new Date().toISOString(),
    },
  });

  useEffect(() => {
    if (paymentData?.body) {
      setPayment(paymentData.body);
      form.reset({
        paymentMethod: paymentData.body.paymentMethod ?? 'credit_card',
        status: paymentData.body.status ?? 'completed',
        reference: paymentData.body.reference ?? '',
        notes: paymentData.body.notes ?? '',
        paymentDate: (paymentData.body.paymentDate ?? paymentData.body.createdAt) ?? new Date().toISOString(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentData]);

  const handleSave = (values: EditPaymentFormValues) => {
    toast.info('Updating payments is not available yet. This form allows you to review and stage changes, but saving requires an update endpoint.');
  };

  if (paymentLoading) return <div className="container mx-auto py-10 text-center">Loading payment...</div>;
  if (!payment) return <div className="container mx-auto py-10 text-center text-red-500">Payment not found.</div>;

  const isRefund = (payment.type ?? '').toLowerCase() === 'refund';
  const amountNumber = Number(payment.amount);
  const amountAbs = Math.abs(amountNumber).toFixed(2);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push(`/bookings/billing/payments/${paymentId}/view`)} className="mr-4">
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Payment #{payment.id}</h1>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Update editable fields for this payment</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Input value={customerName} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Entry Type</Label>
                  <Input value={payment.type} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input value={`${isRefund ? '-' : ''}$${amountAbs}`} readOnly />
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit_card">Credit Card</SelectItem>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="check">Check</SelectItem>
                            <SelectItem value="paypal">PayPal</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value).toISOString())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Reference</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional reference" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Optional notes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => router.push(`/bookings/billing/payments/${paymentId}/view`)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}