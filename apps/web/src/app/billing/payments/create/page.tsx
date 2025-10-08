'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft, Save, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';

// Payment form schema
const paymentFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  amount: z.string().min(1, 'Payment amount is required'),
  reference: z.string().optional(),
  notes: z.string().optional(),
  invoiceIds: z.array(z.string()).min(1, 'At least one invoice is required'),
  amountsApplied: z.array(z.string()).min(1, 'Amounts must be specified'),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

interface Invoice {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  status: string;
  dueDate: string;
  customerId: string;
}

export default function CreatePaymentPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([]);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      paymentMethod: 'credit_card',
      invoiceIds: [],
      amountsApplied: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'invoiceIds',
  });

  // Fetch customers and invoices
  const { data: customersData } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  const { data: invoicesData } = authClient.billing.getInvoices.useQuery({
    queryKey: ['invoices'],
    query: {},
  });

  const { mutate: createPayment } = authClient.billing.createPayment.useMutation({
    onSuccess: (data) => {
      toast.success('Payment recorded successfully!');
      router.push('/billing/payments');
    },
    onError: (error) => {
      toast.error('Failed to record payment');
      console.error('Create payment error:', error);
    },
  });

  // Filter invoices by selected customer
  useEffect(() => {
    if (selectedCustomerId && invoicesData?.body) {
      const customerInvoices = invoicesData.body.filter(
        (invoice) => String(invoice.customerId) === selectedCustomerId
      );
      setAvailableInvoices(customerInvoices);
    } else {
      setAvailableInvoices([]);
    }
  }, [selectedCustomerId, invoicesData]);

  const addInvoice = () => {
    if (availableInvoices.length > 0) {
      const nextInvoice = availableInvoices.find(
        (inv) => !form.watch('invoiceIds').includes(inv.id.toString())
      );
      if (nextInvoice) {
        append(nextInvoice.id.toString());
        form.setValue('amountsApplied', [
          ...form.watch('amountsApplied'),
          nextInvoice.totalAmount,
        ]);
      }
    }
  };

  const removeInvoice = (index: number) => {
    remove(index);
    const newAmounts = form.watch('amountsApplied').filter((_, i) => i !== index);
    form.setValue('amountsApplied', newAmounts);
  };

  const updateAmountApplied = (index: number, amount: string) => {
    const newAmounts = [...form.watch('amountsApplied')];
    newAmounts[index] = amount;
    form.setValue('amountsApplied', newAmounts);
  };

  const getInvoiceById = (id: string) => {
    return availableInvoices.find((inv) => inv.id.toString() === id);
  };

  const getTotalApplied = () => {
    return form.watch('amountsApplied').reduce((sum, amount) => sum + parseFloat(amount || '0'), 0);
  };

  const getRemainingAmount = () => {
    const totalPayment = parseFloat(form.watch('amount') || '0');
    const totalApplied = getTotalApplied();
    return totalPayment - totalApplied;
  };

  const onSubmit = (data: PaymentFormValues) => {
    setIsSubmitting(true);

    const paymentData = {
      payment: {
        customerId: data.customerId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        reference: data.reference,
        notes: data.notes,
        status: 'completed',
      },
      invoiceIds: data.invoiceIds.map((id) => parseInt(id)),
      amountsApplied: data.amountsApplied,
    };

    createPayment(paymentData);
    setIsSubmitting(false);
  };

  const customers = customersData?.body || [];

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Record Payment</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
            <CardDescription>Basic payment information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select
                  value={selectedCustomerId}
                  onValueChange={(value) => {
                    setSelectedCustomerId(value);
                    form.setValue('customerId', value);
                    // Clear existing invoice selections when customer changes
                    form.setValue('invoiceIds', []);
                    form.setValue('amountsApplied', []);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.customer.id} value={customer.customer.id.toString()}>
                        {customer.user.name || customer.user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.customerId && (
                  <p className="text-sm text-red-500">{form.formState.errors.customerId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select
                  value={form.watch('paymentMethod')}
                  onValueChange={(value) => form.setValue('paymentMethod', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
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
                {form.formState.errors.paymentMethod && (
                  <p className="text-sm text-red-500">{form.formState.errors.paymentMethod.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...form.register('amount')}
                />
                {form.formState.errors.amount && (
                  <p className="text-sm text-red-500">{form.formState.errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  placeholder="Transaction reference or check number"
                  {...form.register('reference')}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this payment..."
                  {...form.register('notes')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Allocation */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Allocation</CardTitle>
            <CardDescription>Apply payment amounts to specific invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => {
              const invoice = getInvoiceById(field);
              return (
                <div key={field.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Invoice {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeInvoice(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Invoice Number</Label>
                      <Input
                        value={invoice?.invoiceNumber || ''}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Invoice Total</Label>
                      <Input
                        value={`$${invoice?.totalAmount || '0.00'}`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Amount to Apply *</Label>
                      <Input
                        type="number"
                        min="0"
                        max={invoice?.totalAmount || '0'}
                        step="0.01"
                        placeholder="0.00"
                        value={form.watch(`amountsApplied.${index}`) || ''}
                        onChange={(e) => updateAmountApplied(index, e.target.value)}
                      />
                    </div>
                  </div>

                  {invoice && (
                    <div className="text-sm text-gray-600">
                      <p>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                      <p>Status: {invoice.status}</p>
                    </div>
                  )}
                </div>
              );
            })}

            {availableInvoices.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={addInvoice}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Invoice
              </Button>
            )}

            {availableInvoices.length === 0 && selectedCustomerId && (
              <div className="text-center py-4 text-gray-500">
                No invoices found for this customer.
              </div>
            )}

            {form.formState.errors.invoiceIds && (
              <p className="text-sm text-red-500">{form.formState.errors.invoiceIds.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Payment Amount:</span>
                <span className="font-medium">
                  ${parseFloat(form.watch('amount') || '0').toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount Applied:</span>
                <span className="font-medium">
                  ${getTotalApplied().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Remaining:</span>
                <span className={getRemainingAmount() >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${getRemainingAmount().toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || getRemainingAmount() < 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
        </div>
      </form>
    </div>
  );
}
