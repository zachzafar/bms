'use client';

import { useState } from 'react';
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
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';

// Invoice form schema
const invoiceFormSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  bookingId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  issueDate: z.string().min(1, 'Issue date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.string().min(1, 'Unit price is required'),
    totalPrice: z.string().min(1, 'Total price is required'),
  })).min(1, 'At least one item is required'),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function CreateInvoicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [
        {
          description: '',
          quantity: 1,
          unitPrice: '0.00',
          totalPrice: '0.00',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Fetch customers and bookings for dropdowns
  const { data: customersData } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  const { data: bookingsData } = authClient.booking.getBookings.useQuery({
    queryKey: ['bookings'],
  });

  const { mutate: createInvoice } = authClient.billing.createInvoice.useMutation({
    onSuccess: (data) => {
      toast.success('Invoice created successfully!');
      router.push('/billing/invoices');
    },
    onError: (error) => {
      toast.error('Failed to create invoice');
      console.error('Create invoice error:', error);
    },
  });

  const calculateItemTotal = (quantity: number, unitPrice: string) => {
    const total = quantity * parseFloat(unitPrice || '0');
    return total.toFixed(2);
  };

  const updateItemTotal = (index: number) => {
    const quantity = form.watch(`items.${index}.quantity`);
    const unitPrice = form.watch(`items.${index}.unitPrice`);
    const totalPrice = calculateItemTotal(quantity, unitPrice);
    form.setValue(`items.${index}.totalPrice`, totalPrice);
  };

  const addItem = () => {
    append({
      description: '',
      quantity: 1,
      unitPrice: '0.00',
      totalPrice: '0.00',
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const onSubmit = (data: InvoiceFormValues) => {
    setIsSubmitting(true);
    
    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0);
    const taxAmount = 0; // You can add tax calculation logic here
    const totalAmount = subtotal + taxAmount;

    const invoiceData = {
      invoice: {
        customerId: data.customerId,
        bookingId: data.bookingId,
        invoiceNumber: data.invoiceNumber,
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        notes: data.notes,
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        status: 'Unpaid',
      },
      items: data.items,
    };

    createInvoice(invoiceData);
    setIsSubmitting(false);
  };

  const customers = customersData?.body || [];
  const bookings = bookingsData?.body || [];

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
        <h1 className="text-3xl font-bold">Create New Invoice</h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Basic invoice information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerId">Customer *</Label>
                <Select
                  value={form.watch('customerId')}
                  onValueChange={(value) => form.setValue('customerId', value)}
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
                <Label htmlFor="bookingId">Booking (Optional)</Label>
                <Select
                  value={form.watch('bookingId')}
                  onValueChange={(value) => form.setValue('bookingId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a booking" />
                  </SelectTrigger>
                  <SelectContent>
                    {bookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        {booking.asset?.name || `Booking ${booking.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input
                  id="invoiceNumber"
                  placeholder="Auto-generated if empty"
                  {...form.register('invoiceNumber')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date *</Label>
                <Input
                  id="issueDate"
                  type="date"
                  {...form.register('issueDate')}
                />
                {form.formState.errors.issueDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.issueDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  {...form.register('dueDate')}
                />
                {form.formState.errors.dueDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.dueDate.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes for the invoice..."
                  {...form.register('notes')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
            <CardDescription>Products or services being invoiced</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Item {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor={`items.${index}.description`}>Description *</Label>
                    <Input
                      id={`items.${index}.description`}
                      placeholder="Item description"
                      {...form.register(`items.${index}.description`)}
                    />
                    {form.formState.errors.items?.[index]?.description && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items?.[index]?.description?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.quantity`}>Quantity *</Label>
                    <Input
                      id={`items.${index}.quantity`}
                      type="number"
                      min="0.01"
                      step="0.01"
                      {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                      onChange={(e) => {
                        form.setValue(`items.${index}.quantity`, parseFloat(e.target.value) || 0);
                        updateItemTotal(index);
                      }}
                    />
                    {form.formState.errors.items?.[index]?.quantity && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items?.[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.unitPrice`}>Unit Price *</Label>
                    <Input
                      id={`items.${index}.unitPrice`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register(`items.${index}.unitPrice`)}
                      onChange={(e) => {
                        form.setValue(`items.${index}.unitPrice`, e.target.value);
                        updateItemTotal(index);
                      }}
                    />
                    {form.formState.errors.items?.[index]?.unitPrice && (
                      <p className="text-sm text-red-500">
                        {form.formState.errors.items?.[index]?.unitPrice?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`items.${index}.totalPrice`}>Total Price</Label>
                    <Input
                      id={`items.${index}.totalPrice`}
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      {...form.register(`items.${index}.totalPrice`)}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>

            {form.formState.errors.items && (
              <p className="text-sm text-red-500">{form.formState.errors.items.message}</p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-right">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">
                  ${form.watch('items')?.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>
                  ${form.watch('items')?.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), 0).toFixed(2)}
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
            disabled={isSubmitting}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Invoice'}
          </Button>
        </div>
      </form>
    </div>
  );
}
