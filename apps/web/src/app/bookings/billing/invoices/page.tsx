'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Download, Undo2 } from 'lucide-react';
import { authClient, axiosClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { formatDisplayDate } from '@/lib/utils/date';
import ApplyPaymentModal from '@/components/billing/ApplyPaymentModal';
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';


interface Invoice {
  id: number;
  invoiceNumber: string;
  customerId: number | null;
  status: string;
  issueDate: Date
  dueDate: string;
  subtotal: string;
  taxAmount: string;
  totalAmount: string;
  notes: string | null;
  items: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { page, pageSize, queryParams, goToPage, changePageSize } = usePagination(1, 10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const openPaymentModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  // Fetch invoices and customers
  const { data: invoicesData, refetch: refetchInvoices } = authClient.billing.getInvoices.useQuery({
    queryKey: ['invoices', page, pageSize],
    queryData: {query: queryParams},
  });

  const { data: customersData } = authClient.customers.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  // Mutation hooks
  const { mutate: deleteInvoice } = authClient.billing.deleteInvoice.useMutation({
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      refetchInvoices();
    },
    onError: (error: any) => {
      const message = error?.body?.message || 'Failed to delete invoice';
      toast.error(message);
      console.error('Delete invoice error:', error);
    },
  });

  const { mutate: refundInvoice, isPending: isRefunding } = authClient.billing.refundInvoice.useMutation({
    onSuccess: () => {
      toast.success('Invoice refunded successfully');
      refetchInvoices();
    },
    onError: (error: any) => {
      const message = error?.body?.message || 'Failed to refund invoice';
      toast.error(message);
      console.error('Refund invoice error:', error);
    },
  });


  const invoices = invoicesData?.status === 200 ? invoicesData.body.data : [];
  const paginationMeta = invoicesData?.status === 200 ? invoicesData.body.pagination : undefined;
  const customers = customersData?.body?.data || [];

  // Filter invoices safely
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesCustomer = customerFilter === 'all' || String(invoice.customerId) === customerFilter;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => String(c.id) === customerId);
    return customer ? customer.name || customer.email : 'Unknown Customer';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-primary/10 text-primary';
      case 'unpaid':
        return 'bg-destructive/10 text-destructive';
      case 'partial':
        return 'bg-secondary/10 text-secondary-foreground';
      case 'overdue':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-muted text-gray-800';
    }
  };

  const isOverdue = (dueDate?: string, status?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return false;
    return due < new Date() && status?.toLowerCase() !== 'paid';
  };

  const hasPaymentsApplied = (status: string) => {
    const s = status.toLowerCase();
    return s === 'paid' || s === 'partial';
  };

  const handleDeleteInvoice = (invoiceId: number) => {
    if (confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      deleteInvoice({ params: { id: invoiceId } });
    }
  };

  const handleRefundInvoice = (invoiceId: number) => {
    if (confirm('Are you sure you want to refund all payments for this invoice? This will delete the associated payments and reset the invoice status to Unpaid.')) {
      refundInvoice({ params: { id: invoiceId }, body: {} });
    }
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
    try {
      toast.info('Generating PDF...');
      const response = await axiosClient.get(`/invoice/${invoice.id}/pdf`, {
        responseType: 'blob',
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Download PDF error:', error);
      toast.error('Failed to download PDF');
    }
  };

  const getTotalOutstanding = () => {
    return filteredInvoices
      .filter((inv) => inv.status.toLowerCase() !== 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
  };

  const getOverdueInvoices = () => {
    return filteredInvoices.filter((inv) => isOverdue(inv.dueDate, inv.status));
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button onClick={() => router.push('/bookings/billing/invoices/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Invoice
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredInvoices.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${getTotalOutstanding().toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getOverdueInvoices().length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredInvoices.filter((inv) => inv.status.toLowerCase() === 'paid').length}
            </div>
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
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
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
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name || customer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice List</CardTitle>
          <CardDescription>
            {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found matching your criteria.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className={isOverdue(invoice.dueDate, invoice.status) ? 'bg-destructive/5' : ''}>
                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{getCustomerName(String(invoice.customerId))}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(invoice.status)}>{invoice.status}</Badge>
                      {isOverdue(invoice.dueDate, invoice.status) && (
                        <Badge variant="destructive" className="ml-2">
                          Overdue
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDisplayDate(invoice.issueDate)}</TableCell>
                    <TableCell>
                      <span className={isOverdue(invoice.dueDate, invoice.status) ? 'text-destructive font-medium' : ''}>
                        {formatDisplayDate(invoice.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">${parseFloat(invoice.totalAmount).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/bookings/billing/invoices/${invoice.id}/view`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/bookings/billing/invoices/${invoice.id}/edit`)}
                          disabled={hasPaymentsApplied(invoice.status)}
                          title={hasPaymentsApplied(invoice.status) ? 'Cannot edit invoice with payments applied' : 'Edit invoice'}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadPdf(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {hasPaymentsApplied(invoice.status) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefundInvoice(invoice.id)}
                            disabled={isRefunding}
                            title="Refund all payments for this invoice"
                          >
                            <Undo2 className="h-4 w-4 mr-1" />
                            Refund
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteInvoice(invoice.id)}
                          >
                            Delete
                          </Button>
                        )}
                        {/* Apply Payment - only show for unpaid/partial invoices */}
                        {invoice.status.toLowerCase() !== 'paid' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => openPaymentModal(invoice)}
                          >
                            Apply Payment
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <ApplyPaymentModal
                open={isPaymentModalOpen}
                onOpenChange={setIsPaymentModalOpen}
                invoice={selectedInvoice && selectedInvoice.customerId !== null ? {
                  id: selectedInvoice.id,
                  invoiceNumber: selectedInvoice.invoiceNumber,
                  totalAmount: selectedInvoice.totalAmount,
                  customerId: selectedInvoice.customerId,
                } : null}
                customerName={selectedInvoice ? getCustomerName(String(selectedInvoice.customerId)) : undefined}
                onApplied={() => refetchInvoices()}
              />
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
    </div>
  );
}