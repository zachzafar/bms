'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { StorageService } from '@/lib/api/storage';

type InvoiceSummary = {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  customerId: number;
};

type ApplyPaymentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceSummary | null;
  customerName?: string;
  onApplied?: () => void;
};

export default function ApplyPaymentModal({
  open,
  onOpenChange,
  invoice,
  customerName,
  onApplied,
}: ApplyPaymentModalProps) {
  const paymentFormSchema = z.object({
    amount: z
      .string()
      .min(1, 'Amount is required')
      .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
        message: 'Enter a valid positive amount',
      }),
    paymentMethod: z.enum(['credit_card', 'bank_transfer', 'cash', 'check', 'paypal', 'other']),
    reference: z.string().optional(),
    notes: z.string().optional(),
  });

  type PaymentFormValues = z.infer<typeof paymentFormSchema>;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: invoice?.totalAmount ?? '',
      paymentMethod: 'credit_card',
      reference: '',
      notes: '',
    },
  });

  useEffect(() => {
    form.reset({
      amount: invoice?.totalAmount ?? '',
      paymentMethod: 'credit_card',
      reference: '',
      notes: '',
    });
  }, [invoice]); // eslint-disable-line react-hooks/exhaustive-deps

  const { mutate: createPayment, isPending: creatingPayment } =
    authClient.billing.createPayment.useMutation({
      onSuccess: () => {
        toast.success('Payment applied successfully!');
        onOpenChange(false);
        if (onApplied) onApplied();
      },
      onError: (error) => {
        toast.error('Failed to apply payment');
        console.error(error);
      },
    });

  const onSubmit = (values: PaymentFormValues) => {
    if (!invoice) {
      toast.error('No invoice selected');
      return;
    }

    const tenantId = StorageService.getTenant()?.id || '';

    createPayment({
      body: {
        payment: {
          type: 'payment',
          status: 'completed',
          tenantId,
          paymentDate: new Date().toISOString(),
          paymentMethod: values.paymentMethod,
          reference: values.reference,
          notes: values.notes,
          amount: values.amount,
          customerId: invoice.customerId,
        },
        invoiceIds: [invoice.id],
        amountsApplied: [values.amount],
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Payment</DialogTitle>
          <DialogDescription>Record a payment for the selected invoice.</DialogDescription>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <div>
                Invoice #: <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div>
                Customer: <span className="font-medium">{customerName ?? String(invoice.customerId)}</span>
              </div>
              <div>
                Total: <span className="font-medium">${parseFloat(invoice.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="paymentAmount">Amount *</FormLabel>
                      <FormControl>
                        <Input id="paymentAmount" {...field} placeholder="0.00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="paymentMethod">Method *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger id="paymentMethod">
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="credit_card">Credit Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="check">Check</SelectItem>
                          <SelectItem value="paypal">PayPal</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel htmlFor="reference">Reference</FormLabel>
                      <FormControl>
                        <Input id="reference" {...field} placeholder="Optional reference" />
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
                      <FormLabel htmlFor="notes">Notes</FormLabel>
                      <FormControl>
                        <Textarea id="notes" {...field} placeholder="Optional notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 flex justify-end space-x-2 pt-2">
                  <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingPayment}>
                    {creatingPayment ? 'Applying...' : 'Apply Payment'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}