'use client';

import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { authClient } from '@/lib/api/publicClient';
import { StorageService } from '@/lib/api/storage';
import { INVOICES_QUERY_KEY } from '@/lib/api/queryKeys';
import { formatDateForInput, parseDateInputAsUTC } from '@/lib/utils/date';

const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.string().min(1, 'Unit price is required'),
  totalPrice: z.string().optional(),
});

const InvoiceFormSchema = z.object({
  customerId: z.coerce.number().min(1, 'Customer is required'),
  bookingId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  issueDate: z.date(),
  dueDate: z.date(),
  notes: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>;

export default function CreateInvoicePage() {
  const router = useRouter();
  const queryClient = authClient.useQueryClient();

  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues: {
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      customerId: 0,
      bookingId: '',
      invoiceNumber: '',
      notes: '',
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
  const { data: customersData } = authClient.customers.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  const { data: bookingsData } = authClient.booking.getBookings.useQuery({
    queryKey: ['bookings'],
  });

  const customers = customersData?.body?.data || [];
  const bookings = bookingsData?.body?.data || [];

  // Calculate item total when quantity or unit price changes
  const calculateItemTotal = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    const quantity = Number(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const total = (quantity * unitPrice).toFixed(2);
    form.setValue(`items.${index}.totalPrice`, total);
  };

  // Calculate subtotal from all items
  const calculateSubtotal = () => {
    const items = form.getValues('items');
    return items.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), 0);
  };

  const { mutate: createInvoice, isPending: isSaving } = authClient.billing.createInvoice.useMutation();

  const onSubmit = (values: InvoiceFormValues) => {
    // Calculate totals
    const subtotal = values.items.reduce((sum, item) => sum + parseFloat(item.totalPrice || '0'), 0);
    const taxAmount = 0; // Add tax logic if needed
    const totalAmount = subtotal + taxAmount;

    // Prepare invoice data
    const invoiceData = {
      invoice: {
        status: 'Unpaid',
        customerId: values.customerId,
        bookingId: values.bookingId || '',
        invoiceNumber: values.invoiceNumber || '',
        issueDate: values.issueDate,
        dueDate: values.dueDate,
        tenantId: StorageService.getTenant()?.id || '',
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        notes: values.notes || '',
      },
      items: values.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: parseFloat(item.unitPrice).toFixed(2),
        totalPrice: parseFloat(item.totalPrice || '0').toFixed(2),
      })),
    };

    createInvoice(
      { body: invoiceData },
      {
        onSuccess: () => {
          toast.success('Invoice created successfully!');
          queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
          router.push('/bookings/billing/invoices');
        },
        onError: (error) => {
          console.error(error);
          toast.error('Failed to create invoice');
        },
      }
    );
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Invoice</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>Basic invoice information</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.name || customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bookingId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select booking" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bookings.map((booking: any) => (
                          <SelectItem key={booking.id} value={booking.id}>
                            {booking.asset?.name || `Booking ${booking.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated if empty" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issue Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value instanceof Date ? formatDateForInput(field.value) : ''}
                        onChange={(e) => field.onChange(parseDateInputAsUTC(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value instanceof Date ? formatDateForInput(field.value) : ''}
                        onChange={(e) => field.onChange(parseDateInputAsUTC(e.target.value))}
                      />
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
                      <Textarea placeholder="Additional notes for the invoice..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Items */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Invoice Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ description: '', quantity: 1, unitPrice: '0.00', totalPrice: '0.00' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 border text-left">Description</th>
                        <th className="p-2 border text-left w-24">Quantity</th>
                        <th className="p-2 border text-left w-32">Unit Price</th>
                        <th className="p-2 border text-left w-32">Total</th>
                        <th className="p-2 border text-center w-20">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => (
                        <tr key={field.id}>
                          <td className="p-2 border">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} placeholder="Item description" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="p-2 border">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        calculateItemTotal(index);
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="p-2 border">
                            <FormField
                              control={form.control}
                              name={`items.${index}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(e);
                                        calculateItemTotal(index);
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </td>
                          <td className="p-2 border">
                            <FormField
                              control={form.control}
                              name={`items.${index}.totalPrice`}
                              render={({ field }) => (
                                <Input {...field} readOnly className="bg-muted" />
                              )}
                            />
                          </td>
                          <td className="p-2 border text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              disabled={fields.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                  <span className="font-medium">${calculateSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${calculateSubtotal().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
