'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, DollarSign, Calendar } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  // Fetch payments and customers
  const { data: paymentsData, refetch: refetchPayments } = authClient.billing.getPayments.useQuery({
    queryKey: ['payments'],
    query: {},
  });

  const { data: customersData } = authClient.users.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  const payments = paymentsData?.body || [];
  const customers = customersData?.body || [];

  // Filter payments
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCustomer = customerFilter === 'all' || String(payment.customerId) === customerFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;

    return matchesSearch && matchesCustomer && matchesMethod;
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => String(c.customer.id) === customerId);
    return customer ? (customer.user.name || customer.user.email) : 'Unknown Customer';
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
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalPayments = () => {
    return filteredPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  };

  const getTotalInvoicesPaid = () => {
    return filteredPayments.reduce((sum, payment) => sum + payment.invoices.length, 0);
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payments</h1>
        <Button onClick={() => router.push('/billing/payments/create')}>
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
            <CardTitle className="text-sm font-medium">Invoices Paid</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalInvoicesPaid()}</div>
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
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
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
            <div className="text-center py-8 text-gray-500">
              No payments found matching your criteria.
            </div>
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
                  <TableHead>Invoices</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      #{payment.id}
                    </TableCell>
                    <TableCell>
                      {getCustomerName(String(payment.customerId))}
                    </TableCell>
                    <TableCell className="font-medium">
                      ${parseFloat(payment.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getMethodLabel(payment.paymentMethod)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.reference || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {payment.invoices.length} invoice{payment.invoices.length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/billing/payments/${payment.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}