'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { INVOICES_QUERY_KEY } from '@/lib/api/queryKeys';

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch invoice using useQuery hook (same as EditInvoicePage)
  const { data: invoiceData, isLoading } = authClient.billing.getInvoice.useQuery({
    queryKey: [...INVOICES_QUERY_KEY, invoiceId],
    queryData: { params: { id: Number(invoiceId) } },
  });

  useEffect(() => {
    if (invoiceData?.body) {
      setInvoice(invoiceData.body);
      setLoading(false);
    }
  }, [invoiceData]);

  if (loading || isLoading) return <div className="container mx-auto py-10 text-center">Loading invoice...</div>;
  if (!invoice) return <div className="container mx-auto py-10 text-center text-red-500">Invoice not found.</div>;

  const subtotal = invoice.items.reduce((sum: number, item: any) => sum + parseFloat(item.totalPrice), 0);
  const taxAmount = 0; // adjust if needed
  const totalAmount = subtotal + taxAmount;

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.push(`/bookings/billing/invoices/`)} className="mr-4">
          Back
        </Button>
        <h1 className="text-3xl font-bold">View Invoice</h1>
      </div>

      {/* Invoice Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Basic invoice information</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Invoice Number</Label>
            <Input value={invoice.invoiceNumber} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Input value={invoice.status} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Issue Date</Label>
            <Input value={new Date(invoice.issueDate).toISOString().slice(0, 10)} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input value={new Date(invoice.dueDate).toISOString().slice(0, 10)} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Subtotal</Label>
            <Input value={subtotal.toFixed(2)} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Tax Amount</Label>
            <Input value={taxAmount.toFixed(2)} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Total Amount</Label>
            <Input value={totalAmount.toFixed(2)} readOnly />
          </div>
          <div className="space-y-2">
            <Label>Customer</Label>
            <Input value={invoice.customerName || invoice.customerId} readOnly />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Input value={invoice.notes || ''} readOnly />
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
          {invoice.items.map((item: any, index: number) => (
            <div key={item.id} className="border rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <Label>Description</Label>
                  <Input value={item.description} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Quantity</Label>
                  <Input value={item.quantity} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Unit Price</Label>
                  <Input value={parseFloat(item.unitPrice).toFixed(2)} readOnly />
                </div>
                <div className="space-y-1">
                  <Label>Total Price</Label>
                  <Input value={parseFloat(item.totalPrice).toFixed(2)} readOnly />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
