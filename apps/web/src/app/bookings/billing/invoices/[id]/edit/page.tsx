'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { INVOICES_QUERY_KEY } from '@/lib/api/queryKeys';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const InvoiceItemSchema = z.object({
  id: z.number().optional(),
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.string().min(1, 'Unit price is required'),
  totalPrice: z.string().optional(),
  invoiceId: z.number().optional(),
});

const InvoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  status: z.string().min(1, 'Status is required'),
  issueDate: z.date(),
  dueDate: z.date(),
  subtotal: z.string().min(1, 'Subtotal is required'),
  taxAmount: z.string().default('0.00'),
  totalAmount: z.string().min(1, 'Total amount is required'),
  notes: z.string().optional(),
  customerId: z.coerce.number().min(1, 'Customer is required'),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
});

type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>;

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';
  const queryClient = authClient.useQueryClient();

  // Fetch invoice
  const { data: invoiceData, isLoading } = authClient.billing.getInvoice.useQuery({
    queryKey: [...INVOICES_QUERY_KEY, invoiceId],
    queryData: { params: { id: Number(invoiceId) } },
  });

  // Fetch customers
  const { data: customersData } = authClient.users.getCustomers.useQuery({ queryKey: ['customers'] });
  const customers = customersData?.body?.data || [];

  // Initialize form
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues: {
      invoiceNumber: '',
      status: 'Unpaid',
      issueDate: new Date(),
      dueDate: new Date(),
      subtotal: '0.00',
      taxAmount: '0.00',
      totalAmount: '0.00',
      notes: '',
      customerId: 0,
      items: [{ description: '', quantity: 1, unitPrice: '0.00', totalPrice: '0.00' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Populate form when invoice data loads
  useEffect(() => {
    if (!invoiceData?.body) return;
    const invoice = invoiceData.body;

    form.reset({
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      totalAmount: invoice.totalAmount,
      notes: invoice.notes || '',
      customerId: invoice.customerId,
      items: invoice.items && invoice.items.length > 0
        ? invoice.items.map((item: any) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            invoiceId: item.invoiceId,
          }))
        : [{ description: '', quantity: 1, unitPrice: '0.00', totalPrice: '0.00' }],
    });
  }, [invoiceData, form]);

  // Calculate item total when quantity or unit price changes
  const calculateItemTotal = (index: number) => {
    const items = form.getValues('items');
    const item = items[index];
    const quantity = Number(item.quantity) || 0;
    const unitPrice = parseFloat(item.unitPrice) || 0;
    const total = (quantity * unitPrice).toFixed(2);
    form.setValue(`items.${index}.totalPrice`, total);
    recalculateTotals();
  };

  // Recalculate subtotal and total
  const recalculateTotals = () => {
    const items = form.getValues('items');
    const subtotal = items.reduce((acc, item) => {
      return acc + (parseFloat(item.totalPrice || '0'));
    }, 0);
    const tax = parseFloat(form.getValues('taxAmount')) || 0;
    const total = subtotal + tax;

    form.setValue('subtotal', subtotal.toFixed(2));
    form.setValue('totalAmount', total.toFixed(2));
  };

  const { mutate: updateInvoice, isPending: isSaving } = authClient.billing.updateInvoice.useMutation();

  const onSubmit = (values: InvoiceFormValues) => {
    if (!invoiceId) return;

    updateInvoice(
      {
        params: { id: Number(invoiceId) },
        body: {
          ...values,
          items: values.items.map((item) => ({
            id: item.id ?? 0,
            invoiceId: item.invoiceId ?? Number(invoiceId),
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice || '0.00',
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success('Invoice updated successfully!');
          queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY });
          router.push(`/bookings/billing/invoices/${invoiceId}/view`);
        },
        onError: (error) => {
          console.error(error);
          toast.error('Failed to update invoice');
        },
      }
    );
  };

  if (isLoading) return <div className="container mx-auto py-10 text-center">Loading invoice...</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Invoice</h1>
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
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Partial">Partial</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
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
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
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
                        value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                          <SelectItem key={customer.customer.id} value={String(customer.customer.id)}>
                            {customer.user.name || customer.user.email}
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
                name="taxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          recalculateTotals();
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtotal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subtotal</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly className="bg-muted" />
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
                      <Textarea {...field} rows={3} />
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
                              onClick={() => {
                                remove(index);
                                recalculateTotals();
                              }}
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

              <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
