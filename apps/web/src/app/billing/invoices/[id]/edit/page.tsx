'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/api/publicClient';
import { toast } from 'sonner';
import { INVOICES_QUERY_KEY } from '@/lib/api/queryKeys';
import { ArrowLeft, Save, Plus } from 'lucide-react';

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? '';

  const [saving, setSaving] = useState(false);

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState('Unpaid');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [subtotal, setSubtotal] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [customerId, setCustomerId] = useState('');

  // Invoice items
  const [items, setItems] = useState<
    {
      id?: number;
      description: string;
      quantity: number;
      unitPrice: string;
      totalPrice: string;
      invoiceId?: number;
    }[]
  >([]);

  // Fetch invoice
  const { data: invoiceData, isLoading } = authClient.billing.getInvoice.useQuery({
    queryKey: [...INVOICES_QUERY_KEY, invoiceId],
    queryData: { params: { id: invoiceId } },
  });

  // Fetch customers
  const { data: customersData } = authClient.users.getCustomers.useQuery({ queryKey: ['customers'] });
  const customers = customersData?.body || [];

  // Populate form
  useEffect(() => {
    if (!invoiceData?.body) return;
    const invoice = invoiceData.body;

    setInvoiceNumber(invoice.invoiceNumber);
    setStatus(invoice.status);
    setIssueDate(new Date(invoice.issueDate).toISOString().slice(0, 10));
    setDueDate(new Date(invoice.dueDate).toISOString().slice(0, 10));
    setSubtotal(invoice.subtotal);
    setTaxAmount(invoice.taxAmount);
    setTotalAmount(invoice.totalAmount);
    setNotes(invoice.notes || '');
    setCustomerId(String(invoice.customerId));
    setItems(invoice.items || []);
  }, [invoiceData]);

  // Add new item
  const addItem = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unitPrice: '0.00', totalPrice: '0.00' },
    ]);
  };

  // Remove item
  const removeItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
    recalcTotals(newItems);
  };

  // Handle changes to description, quantity, unitPrice
  const handleItemChange = (index: number, field: 'description' | 'quantity' | 'unitPrice', value: string) => {
    const newItems = [...items];
    if (field === 'quantity') newItems[index].quantity = Number(value);
    else if (field === 'unitPrice') newItems[index].unitPrice = value;
    else newItems[index].description = value;

    const qty = newItems[index].quantity || 0;
    const unit = parseFloat(newItems[index].unitPrice) || 0;
    newItems[index].totalPrice = (qty * unit).toFixed(2);

    setItems(newItems);
    recalcTotals(newItems);
  };

  // Recalculate subtotal and total
  const recalcTotals = (updatedItems: typeof items) => {
    const newSubtotal = updatedItems.reduce((acc, i) => acc + parseFloat(i.totalPrice || '0'), 0);
    setSubtotal(newSubtotal.toFixed(2));
    const tax = parseFloat(taxAmount) || 0;
    setTotalAmount((newSubtotal + tax).toFixed(2));
  };

  const { mutate: updateInvoice } = authClient.billing.updateInvoice.useMutation();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceId) return;
    setSaving(true);

    updateInvoice(
      {
        params: { id: invoiceId },
        body: {
          invoiceNumber,
          status,
          issueDate,
          dueDate,
          subtotal,
          taxAmount,
          totalAmount,
          notes,
          customerId,
          items: items.map((i) => ({
            id: i.id ?? 0,            // send 0 or remove depending on backend
            invoiceId: i.invoiceId ?? 0,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          })),
        },
      },
      {
        onSuccess: () => {
          toast.success('Invoice updated successfully!');
          router.push(`/billing/invoices/${invoiceId}/view`);
        },
        onError: (error) => {
          console.error(error);
          toast.error('Failed to update invoice');
        },
        onSettled: () => setSaving(false),
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

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Basic invoice information</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Partial">Partial</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subtotal</Label>
              <Input value={subtotal} onChange={(e) => setSubtotal(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tax Amount</Label>
              <Input value={taxAmount} onChange={(e) => setTaxAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
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
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            {/* Invoice Items */}
            <div className="md:col-span-2">
              <Label>Invoice Items</Label>
              <table className="w-full border border-gray-300 mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 border">Description</th>
                    <th className="p-2 border">Quantity</th>
                    <th className="p-2 border">Unit Price</th>
                    <th className="p-2 border">Total</th>
                    <th className="p-2 border">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="p-2 border">
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        />
                      </td>
                      <td className="p-2 border">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        />
                      </td>
                      <td className="p-2 border">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        />
                      </td>
                      <td className="p-2 border">{item.totalPrice}</td>
                      <td className="p-2 border">
                        <Button variant="destructive" size="sm" onClick={() => removeItem(index)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2"
                onClick={addItem}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <div className="md:col-span-2 flex justify-end mt-4">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
