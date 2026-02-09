'use client';

import { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import Loading from '@/components/custom/Loading';
import { StorageService } from '@/lib/api/storage';
import { authClient } from '@/lib/api/publicClient';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const InvoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(1),
  unitPrice: z.string().min(1),
  totalPrice: z.string().min(1),
});

const CreateInvoiceSchema = z.object({
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  items: z.array(InvoiceItemSchema).min(1),
});

type CreateInvoiceForm = z.infer<typeof CreateInvoiceSchema>;

const PaymentSchema = z.object({
  paymentDate: z.string().min(1),
  amount: z.string().min(1),
  invoiceId: z.string().min(1),
  paymentMethod: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentForm = z.infer<typeof PaymentSchema>;

export default function Billing({  customerId }: { customerId: number }) {
  const tenant = StorageService.getTenant();

  const [openInvoice, setOpenInvoice] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);

  const { data: customersData, isLoading: customersLoading } = authClient.customers.getCustomers.useQuery({
    queryKey: ['customers'],
    enabled: !!tenant,
  });
  const customers = customersData?.body.data ?? [];
  const selected = useMemo(() => customers.find((c: any) => c.id === customerId), [customers, customerId]);
  const customerIdStr = selected?.id ? selected.id : undefined;

  const { data: invoicesData, isLoading: invoicesLoading } = authClient.billing.getInvoices.useQuery({
    queryKey: ['invoices', customerIdStr ?? 'unknown'],
    queryData: customerIdStr ? { query: { customerId: customerIdStr } } : undefined,
    enabled: !!tenant && !!customerIdStr,
  });
  const invoices = invoicesData?.body.data ?? [];

  const { data: paymentsData, isLoading: paymentsLoading } = authClient.billing.getPayments.useQuery({
    queryKey: ['payments', customerIdStr ?? 'unknown'],
    queryData: customerIdStr ? { query: { customerId: customerIdStr } } : undefined,
    enabled: !!tenant && !!customerIdStr,
  });
  const payments = paymentsData?.body.data ?? [];

  const { mutate: createInvoice, isPending: creatingInvoice } = authClient.billing.createInvoice.useMutation();
  const { mutate: deleteInvoice, isPending: deletingInvoice } = authClient.billing.deleteInvoice.useMutation();
  const { mutate: createPayment, isPending: creatingPayment } = authClient.billing.createPayment.useMutation();
  const queryClient = authClient.useQueryClient();

  const invoiceForm = useForm<CreateInvoiceForm>({
    resolver: zodResolver(CreateInvoiceSchema),
    defaultValues: {
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      items: [{ description: '', quantity: 1, unitPrice: '0.00', totalPrice: '0.00' }],
    },
  });

  const itemsField = useFieldArray({ control: invoiceForm.control, name: 'items' });

  const paymentForm = useForm<PaymentForm>({
    resolver: zodResolver(PaymentSchema),
    defaultValues: { paymentDate: new Date().toISOString().split('T')[0] },
  });

  if (customersLoading) return <Loading />;

  const submitInvoice = (values: CreateInvoiceForm) => {
    if (!customerIdStr) {
      toast.error('Customer ID not found');
      return;
    }
    const totalItems = values.items.map((i) => ({
      description: i.description,
      quantity: Number(i.quantity),
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    }));

    createInvoice(
      {
        body: {
          invoice: {
            customerId: customerIdStr,
            issueDate: new Date(values.issueDate).toISOString(),
            dueDate: new Date(values.dueDate).toISOString(),
            status: 'Unpaid',
            totalAmount: totalItems.reduce((acc, it) => acc + Number(it.totalPrice), 0).toFixed(2),
            invoiceNumber: `INV-${Date.now()}`,
          } as any,
          items: totalItems,
        },
      },
      {
        onSuccess: () => {
          toast.success('Invoice created');
          queryClient.invalidateQueries({ queryKey: ['invoices', customerIdStr] });
          setOpenInvoice(false);
          invoiceForm.reset();
        },
        onError: (e) => {
          console.error(e);
          toast.error('Failed to create invoice');
        },
      }
    );
  };

  const submitPayment = (values: PaymentForm) => {
    if (!customerIdStr) {
      toast.error('Customer ID not found');
      return;
    }
    createPayment(
      {
        body: {
          payment: {
            customerId: Number(customerIdStr),
            amount: values.amount,
            paymentDate: new Date(values.paymentDate).toISOString(),
            status: 'completed',
            type: 'payment',
            paymentMethod: values.paymentMethod || 'cash',
            reference: values.reference || '',
            notes: values.notes || '',
          } as any,
          invoiceIds: [Number(values.invoiceId)],
          amountsApplied: [values.amount],
        },
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded');
          queryClient.invalidateQueries({ queryKey: ['payments', customerIdStr] });
          queryClient.invalidateQueries({ queryKey: ['invoices', customerIdStr] });
          setOpenPayment(false);
          paymentForm.reset();
        },
        onError: (e) => {
          console.error(e);
          toast.error('Failed to record payment');
        },
      }
    );
  };

  const handleDeleteInvoice = (id: number) => {
    if (!window.confirm('Delete this invoice?')) return;
    deleteInvoice(
      { params: { id: id }, body: {} },
      {
        onSuccess: () => {
          toast.success('Invoice deleted');
          queryClient.invalidateQueries({ queryKey: ['invoices', customerIdStr] });
        },
        onError: (e) => {
          console.error(e);
          toast.error('Failed to delete invoice');
        },
      }
    );
  };

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <CardTitle className="text-base">Billing</CardTitle>
        {/* <div className="flex gap-2">
          <Button onClick={() => setOpenInvoice(true)}><Plus className="h-4 w-4 mr-2" />Create Invoice</Button>
          <Button variant="outline" onClick={() => setOpenPayment(true)}><Plus className="h-4 w-4 mr-2" />Record Payment</Button>
        </div> */}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Invoice #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Total</TableHead>
                    {/* <TableHead>Actions</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.length > 0 ? (
                    invoices.map((inv: any) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.status}</TableCell>
                        <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(inv.dueDate).toLocaleDateString()}</TableCell>
                        <TableCell>${Number(inv.totalAmount ?? 0).toFixed(2)}</TableCell>
                        {/* <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteInvoice(inv.id)}
                            disabled={deletingInvoice}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell> */}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">No invoices found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payments</CardTitle></CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <Loading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Payment ID</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length > 0 ? (
                    payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.id}</TableCell>
                        <TableCell>{p.paymentMethod}</TableCell>
                        <TableCell>{p.status}</TableCell>
                        <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell>${Number(p.amount ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">No payments found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice */}
      <Dialog open={openInvoice} onOpenChange={setOpenInvoice}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
          <Form {...invoiceForm}>
            <form onSubmit={invoiceForm.handleSubmit(submitInvoice)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={invoiceForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={invoiceForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Items</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => itemsField.append({ description: '', quantity: 1, unitPrice: '0.00', totalPrice: '0.00' })}>
                    <Plus className="h-4 w-4 mr-2" />Add Item
                  </Button>
                </div>
                {itemsField.fields.map((field, idx) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <FormField
                      control={invoiceForm.control}
                      name={`items.${idx}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={invoiceForm.control}
                      name={`items.${idx}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={invoiceForm.control}
                      name={`items.${idx}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl><Input type="text" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={invoiceForm.control}
                      name={`items.${idx}.totalPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total</FormLabel>
                          <FormControl><Input type="text" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end">
                      <Button type="button" variant="ghost" size="icon" onClick={() => itemsField.remove(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenInvoice(false)}>Cancel</Button>
                <Button type="submit" disabled={creatingInvoice}>Create</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Record Payment */}
      <Dialog open={openPayment} onOpenChange={setOpenPayment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(submitPayment)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={paymentForm.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Date</FormLabel>
                      <FormControl><Input type="date" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="invoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger><SelectValue placeholder="Select invoice" /></SelectTrigger>
                        <SelectContent>
                          {invoices.map((i: any) => <SelectItem key={i.id} value={String(i.id)}>{i.invoiceNumber} - ${Number(i.totalAmount ?? 0).toFixed(2)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Method</FormLabel>
                      <FormControl><Input {...field} placeholder="cash / credit_card / bank_transfer" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={paymentForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Notes</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpenPayment(false)}>Cancel</Button>
                <Button type="submit" disabled={creatingPayment}>Record</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}