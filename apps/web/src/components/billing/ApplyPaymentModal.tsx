'use client';

import React, { useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { StorageService } from '@/lib/api/storage';
import { QuickCreatePaymentMethod } from '../custom/QuickCreate';

type InvoiceSummary = {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  customerId: number;
};

type PaymentMethod = {
  id: number;
  name: string;
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
  /**
   * ----------------------------
   * Fetch payment methods
   * ----------------------------
   */
  const { data: paymentMethodsData } =
    authClient.billing.getPaymentMethods.useQuery({
      queryKey: ['paymentMethods'],
    });

  const paymentMethods: PaymentMethod[] =
    paymentMethodsData?.status === 200
      ? paymentMethodsData.body.data
      : [];

  /**
   * ----------------------------
   * Zod schema
   * ----------------------------
   */
  const paymentFormSchema = useMemo(
    () =>
      z.object({
        amount: z
          .string()
          .min(1, 'Amount is required')
          .refine(
            (val) => !isNaN(Number(val)) && Number(val) > 0,
            'Enter a valid positive amount'
          ),

        paymentMethod: z
          .string()
          .min(1, 'Payment method is required')
          .refine(
            (val) =>
              paymentMethods.some((pm) => pm.id === Number(val)),
            'Invalid payment method'
          ),

        reference: z.string().optional(),
        notes: z.string().optional(),
      }),
    [paymentMethods]
  );

  type PaymentFormValues = z.infer<typeof paymentFormSchema>;

  /**
   * ----------------------------
   * Form
   * ----------------------------
   */
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: '',
      paymentMethod: '',
      reference: '',
      notes: '',
    },
  });

  /**
   * ----------------------------
   * Reset on invoice / methods
   * ----------------------------
   */
  useEffect(() => {
    if (!invoice || paymentMethods.length === 0) return;

    form.reset({
      amount: invoice.totalAmount,
      paymentMethod: String(paymentMethods[0].id),
      reference: '',
      notes: '',
    });
  }, [invoice, paymentMethods, form]);

  /**
   * ----------------------------
   * Create payment mutation
   * ----------------------------
   */
  const { mutate: createPayment, isPending } =
    authClient.billing.createPayment.useMutation({
      onSuccess: () => {
        toast.success('Payment applied successfully!');
        onOpenChange(false);
        onApplied?.();
      },
      onError: (error) => {
        console.error(error);
        toast.error('Failed to apply payment');
      },
    });

  /**
   * ----------------------------
   * Submit
   * ----------------------------
   */
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
          paymentDate: new Date(),

          // convert string → number
          paymentMethod: (values.paymentMethod),

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

  /**
   * ----------------------------
   * UI
   * ----------------------------
   */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply Payment</DialogTitle>
          <DialogDescription>
            Record a payment for the selected invoice.
          </DialogDescription>
        </DialogHeader>

        {invoice && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <div>
                Invoice #: <span className="font-medium">{invoice.invoiceNumber}</span>
              </div>
              <div>
                Customer:{' '}
                <span className="font-medium">
                  {customerName ?? invoice.customerId}
                </span>
              </div>
              <div>
                Total:{' '}
                <span className="font-medium">
                  ${Number(invoice.totalAmount).toFixed(2)}
                </span>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="0.00" />
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
                      <FormLabel>Method *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select method">
                              {
                                paymentMethods.find(
                                  (m) => String(m.id) === field.value
                                )?.name
                              }
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem
                              key={method.id}
                              value={String(method.id)}
                            >
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <QuickCreatePaymentMethod />
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
                        <Input {...field} placeholder="Optional reference" />
                      </FormControl>
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
                        <Textarea {...field} placeholder="Optional notes" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Applying…' : 'Apply Payment'}
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
