'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { formatDateForInput } from '@/lib/utils/date';

export default function ViewPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { data: paymentData, isLoading: paymentLoading } = authClient.billing.getPayment.useQuery({
    queryKey: ['payment', paymentId],
    queryData: { params: { id: Number(paymentId) } },
  });

  const { data: customersData } = authClient.customers.getCustomers.useQuery({
    queryKey: ['customers'],
  });

  const { data: paymentMethodsData } = authClient.billing.getPaymentMethods.useQuery({
    queryKey: ['paymentMethods'],
  });

  const paymentMethods = paymentMethodsData?.body?.data ?? [];

  // Helper to get method name from ID
  const getMethodLabel = (methodId: string | number) => {
    return paymentMethods.find((m) => String(m.id) === String(methodId))?.name ?? String(methodId);
  };

  const customers = customersData?.body.data ?? [];

  const customerName = useMemo(() => {
    if (!payment) return '';
    const found = customers.find((c: any) => Number(c.id) === Number(payment.customerId));
    return found ? (found.name || found.email || `#${payment.customerId}`) : `#${payment.customerId}`;
  }, [customers, payment]);

  useEffect(() => {
    if (paymentData?.body) {
      setPayment(paymentData.body);
      setLoading(false);
    }
  }, [paymentData]);

  if (loading || paymentLoading) return <div className="container mx-auto py-10 text-center">Loading payment...</div>;
  if (!payment) return <div className="container mx-auto py-10 text-center text-red-500">Payment not found.</div>;

  const getStatusColor = (status: string) => {
    switch ((status ?? '').toLowerCase()) {
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

  const isRefund = (payment.type ?? '').toLowerCase() === 'refund';
  const amountNumber = Number(payment.amount);
  const amountAbs = Math.abs(amountNumber).toFixed(2);

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push(`/bookings/billing/payments`)} className="mr-4">
          Back
        </Button>
        <h1 className="text-3xl font-bold">Payment #{payment.id}</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Core payment information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Input value={customerName} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Entry Type</Label>
            <Input value={payment.type} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input value={`${isRefund ? '-' : ''}$${amountAbs}`} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Input value={getMethodLabel(payment.paymentMethod)} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input value={formatDateForInput(payment.paymentDate ?? payment.createdAt)} readOnly />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Reference</Label>
            <Input value={payment.reference || ''} readOnly />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Input value={payment.notes || ''} readOnly />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Applied Invoices</CardTitle>
          <CardDescription>Invoices associated with this payment</CardDescription>
        </CardHeader>
        <CardContent>
          {payment.invoices?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payment.invoices.map((inv: any) => (
                  <TableRow key={`${inv.invoiceId}-${inv.invoiceNumber}`}>
                    <TableCell className="font-medium">#{inv.invoiceNumber}</TableCell>
                    <TableCell>${parseFloat(inv.amountApplied).toFixed(2)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/bookings/billing/invoices/${inv.invoiceId}/view`)}
                      >
                        View Invoice
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground">No invoices applied.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}