'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Pencil, DollarSign, Calendar } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Form,FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

interface Payment {
  id: number;
  customerId: string;
  amount: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
  status: string;
  createdAt: string;
  invoices: Array<{
    invoiceId: number;
    amountApplied: string;
    invoiceNumber: string;
  }>;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<{
    id: number;
    invoiceNumber: string;
    totalAmount: string;
    customerId: number;
  } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Add schema and form
  const paymentFormSchema = z.object({
    amount: z.string().min(1, 'Amount is required'),
    paymentMethod: z.string().min(1, 'Method is required'),
    reference: z.string().optional(),
    notes: z.string().optional(),
    entryType: z.enum(['payment', 'refund']),
  });

  type PaymentFormValues = z.infer<typeof paymentFormSchema>;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: '',
      paymentMethod: 'credit_card',
      reference: '',
      notes: '',
      entryType: 'payment',
    },
  });

  // Fetch payments and customers
  const { data: paymentsData, refetch: refetchPayments } = authClient.billing.getPayments.useQuery({
    queryKey: ['payments', page, pageSize],
    queryData: {query:queryParams},
  });

  const { data: customersData } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  // Fetch invoices for unpaid listing in modal
  const { data: invoicesData } = authClient.billing.getInvoices.useQuery({
    queryKey: ['invoices'],
  });

  const payments = paymentsData?.status === 200 ? paymentsData.body.data : [];
  const paginationMeta = paymentsData?.status === 200 ? paymentsData.body.pagination : undefined;
  const customers = customersData?.body?.data || [];
  const invoices = invoicesData?.body?.data || [];
  const entryType = form.watch('entryType');

  const eligibleInvoicesForSelectedCustomer = invoices.filter(
    (inv) => {
      const matchesCustomer = selectedCustomerId ? String(inv.customerId) === selectedCustomerId : false;
      const eligibleByType =
        entryType === 'refund'
          ? (inv.status === 'Paid' || inv.status === 'Partial')
          : inv.status !== 'Paid';
      return matchesCustomer && eligibleByType;
    }
  );

  // Modal side effects: prefill amount when invoice changes
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = customerFilter === 'all' || String(payment.customerId) === customerFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;

    return matchesSearch && matchesCustomer && matchesMethod;
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => String(c.customer.id) === customerId);
    return customer ? customer.user.name || customer.user.email : 'Unknown Customer';
  };

  const getMethodLabel = (method: string) => {
    const methodLabels: Record<string, string> = {
      credit_card: 'Credit Card',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      check: 'Check',
      paypal: 'PayPal',
      other: 'Other',
    };
    return methodLabels[method] || method;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-secondary/10 text-secondary-foreground';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-gray-800';
    }
  };

  const getTotalPayments = () => {
    return filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  };

  const unpaidInvoicesCount = invoices.filter((inv) => inv.status !== 'Paid').length;

  const { mutate: createPayment, isPending: creatingPayment } = authClient.billing.createPayment.useMutation({
    onSuccess: () => {
      toast.success('Payment applied successfully!');
      setIsPaymentModalOpen(false);
      setSelectedCustomerId(null);
      setSelectedInvoice(null);
      form.reset();
      refetchPayments();
    },
    onError: (error) => {
      toast.error('Failed to apply payment');
      console.error(error);
    },
  });

  const submitPayment = (values: PaymentFormValues) => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    if (!selectedInvoice) {
      toast.error('Please select a target invoice');
      return;
    }
    const parsedAmount = parseFloat(values.amount);
    if (!values.amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Enter a valid amount greater than 0');
      return;
    }

    const isRefund = values.entryType === 'refund';
    const amountForStorage = isRefund ? (-Math.abs(parsedAmount)).toFixed(2) : parsedAmount.toFixed(2);

    createPayment({
      body: {
        payment: {
          type: values.entryType,
          status: isRefund ? 'completed' : 'completed',
          paymentDate: new Date(),
          paymentMethod: values.paymentMethod,
          reference: values.reference,
          notes: values.notes,
          tenantId: "", // keep as-is per current app pattern
          amount: amountForStorage,
          customerId: Number(selectedCustomerId),
        },
        invoiceIds: [selectedInvoice.id],
        amountsApplied: [amountForStorage], // negative for refund
      },
    });
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button onClick={() => setIsPaymentModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalPayments().toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid Invoices</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidInvoicesCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.customer.id} value={customer.customer.id.toString()}>
                      {customer.user.name || customer.user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment List</CardTitle>
          <CardDescription>
            {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payments found matching your criteria.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">#{payment.id}</TableCell>
                    <TableCell>{getCustomerName(String(payment.customerId))}</TableCell>
                    <TableCell className="font-medium">${parseFloat(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getMethodLabel(payment.paymentMethod)}</Badge>
                    </TableCell>
                    <TableCell>{payment.reference || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(payment.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/bookings/billing/payments/${payment.id}/view`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => router.push(`/bookings/billing/payments/${payment.id}/edit`)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {paginationMeta && (
        <DataTablePagination
          pagination={paginationMeta}
          onPageChange={goToPage}
          onPageSizeChange={changePageSize}
        />
      )}

      {/* Record Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={(open) => {
        setIsPaymentModalOpen(open);
        if (!open) {
          form.reset();
          setSelectedInvoice(null);
          setSelectedCustomerId(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment or Refund</DialogTitle>
            <DialogDescription>
              Choose entry type, select a customer, then choose an eligible invoice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submitPayment)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="entryType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entry Type *</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="payment">Payment</SelectItem>
                              <SelectItem value="refund">Refund</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Customer — use plain Label/Select, not FormItem/FormLabel/FormMessage */}
                  <div className="space-y-2">
                    <Label>Customer *</Label>
                    <Select
                      value={selectedCustomerId ?? ''}
                      onValueChange={(val) => {
                        setSelectedCustomerId(val);
                        setSelectedInvoice(null);
                        form.setValue('amount', '');
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.customer.id} value={customer.customer.id.toString()}>
                            {customer.user.name || customer.user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target Invoice — use plain Label/Select, not FormItem/FormLabel/FormMessage */}
                  <div className="space-y-2">
                    <Label>Target Invoice *</Label>
                    <Select
                      value={selectedInvoice ? String(selectedInvoice.id) : ''}
                      onValueChange={(invoiceId) => {
                        const inv = eligibleInvoicesForSelectedCustomer.find((i) => String(i.id) === invoiceId) || null;
                        setSelectedInvoice(
                          inv ? { id: inv.id, invoiceNumber: inv.invoiceNumber, totalAmount: inv.totalAmount, customerId: inv.customerId } : null
                        );
                        form.setValue('amount', inv ? (entryType === 'refund' ? '' : inv.totalAmount) : '');
                      }}
                      disabled={!selectedCustomerId || eligibleInvoicesForSelectedCustomer.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={selectedCustomerId ? 'Select invoice' : 'Select customer first'} />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleInvoicesForSelectedCustomer.map((inv) => (
                          <SelectItem key={inv.id} value={inv.id.toString()}>
                            #{inv.invoiceNumber} — ${parseFloat(inv.totalAmount).toFixed(2)} ({inv.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input placeholder={entryType === 'refund' ? 'Refund amount' : 'Payment amount'} {...field} />
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

                <div className="flex justify-end space-x-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsPaymentModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingPayment}>
                    {creatingPayment ? (entryType === 'refund' ? 'Refunding...' : 'Applying...') : (entryType === 'refund' ? 'Apply Refund' : 'Apply Payment')}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}