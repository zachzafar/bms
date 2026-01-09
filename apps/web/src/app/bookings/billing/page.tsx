'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DollarSign, FileText, CreditCard, TrendingUp, AlertTriangle } from 'lucide-react';
import { authClient } from '@/lib/api/publicClient';

export default function BillingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch billing data
  const { data: invoicesData } = authClient.billing.getInvoices.useQuery({
    queryKey: ['invoices']
  });

  const { data: paymentsData } = authClient.billing.getPayments.useQuery({
    queryKey: ['payments']
  });

  const invoices = invoicesData?.body.data || [];
  const payments = paymentsData?.body.data || [];

  // Calculate statistics
  const totalOutstanding = invoices
    .filter(inv => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);

  const invoicesDue = invoices.filter(inv => {
    const dueDate = new Date(inv.dueDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return dueDate <= thirtyDaysFromNow && inv.status !== 'Paid';
  });

  const recentPayments = payments
    .filter(payment => {
      const paymentDate = new Date(payment.createdAt);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return paymentDate >= thirtyDaysAgo;
    })
    .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

  const overdueInvoices = invoices.filter(inv => {
    const dueDate = new Date(inv.dueDate);
    return dueDate < new Date() && inv.status !== 'Paid';
  });

  const totalInvoices = invoices.length;
  const totalPaid = invoices.filter(inv => inv.status === 'Paid').length;
  const totalUnpaid = totalInvoices - totalPaid;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Billing Management</h1>
        <div className="space-x-2">
          <Button onClick={() => router.push('/billing/invoices/create')}>
            Create Invoice
          </Button>
          <Button onClick={() => router.push('/billing/payments/create')}>
            Record Payment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {totalUnpaid} unpaid invoice{totalUnpaid !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Invoices Due</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{invoicesDue.length}</div>
                <p className="text-xs text-muted-foreground">
                  Next 30 days
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${recentPayments.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Invoices</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{overdueInvoices.length}</div>
                <p className="text-xs text-muted-foreground">
                  Past due date
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Generate Invoice from Booking
                  </CardTitle>
                  <CardDescription>
                    Create an invoice automatically from an existing booking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/billing/invoices/create')}
                  >
                    Generate Invoice
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Record Payment
                  </CardTitle>
                  <CardDescription>
                    Record a customer payment and apply it to invoices
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/billing/payments/create')}
                  >
                    Record Payment
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    View Reports
                  </CardTitle>
                  <CardDescription>
                    Access billing reports and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/billing/reports')}
                  >
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Manage your customer invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      {totalInvoices} total invoices • {totalPaid} paid • {totalUnpaid} unpaid
                    </p>
                  </div>
                  <Button onClick={() => router.push('/billing/invoices')}>
                    View All Invoices
                  </Button>
                </div>
                
                {overdueInvoices.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <div>
                        <h4 className="font-medium text-red-800">Overdue Invoices</h4>
                        <p className="text-sm text-red-600">
                          You have {overdueInvoices.length} overdue invoice{overdueInvoices.length !== 1 ? 's' : ''} 
                          totaling ${overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Track customer payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">
                      {payments.length} total payments • ${payments.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(2)} total amount
                    </p>
                  </div>
                  <Button onClick={() => router.push('/billing/payments')}>
                    View All Payments
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${recentPayments.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">Recent Payments</div>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {payments.filter(p => new Date(p.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                    </div>
                    <div className="text-sm text-blue-600">This Week</div>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {payments.filter(p => new Date(p.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length}
                    </div>
                    <div className="text-sm text-purple-600">This Month</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}